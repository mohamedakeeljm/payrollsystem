import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { differenceInMinutes } from 'date-fns';

export class AttendanceService {
  static async clockIn(
    organizationId: string,
    employeeId: string,
    meta?: { ipAddress?: string; source?: string }
  ) {
    const today = new Date().toISOString().split('T')[0];

    // Check existing record for today
    let record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, date: today },
      include: { shift: true },
    });

    if (record && record.clockIn) {
      throw new BadRequestError('You have already clocked in for today.');
    }

    const now = new Date();

    // Find applicable shift
    const defaultShift = await prisma.shift.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });

    let lateMinutes = 0;
    if (defaultShift) {
      const [shiftHour, shiftMinute] = defaultShift.startTime.split(':').map(Number);
      const shiftStartTime = new Date(now);
      shiftStartTime.setHours(shiftHour, shiftMinute, 0, 0);

      const diff = differenceInMinutes(now, shiftStartTime);
      if (diff > defaultShift.gracePeriodMinutes) {
        lateMinutes = diff;
      }
    }

    if (!record) {
      record = await prisma.attendanceRecord.create({
        data: {
          organizationId,
          employeeId,
          shiftId: defaultShift?.id,
          date: today,
          clockIn: now,
          status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
          lateMinutes,
          missingClockOut: true,
        },
        include: { shift: true },
      });
    } else {
      record = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          clockIn: now,
          status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
          lateMinutes,
          missingClockOut: true,
        },
        include: { shift: true },
      });
    }

    // Log attendance event
    await prisma.attendanceEvent.create({
      data: {
        organizationId,
        employeeId,
        eventType: 'CLOCK_IN',
        timestamp: now,
        source: meta?.source || 'WEB',
        ipAddress: meta?.ipAddress,
      },
    });

    return record;
  }

  static async clockOut(
    organizationId: string,
    employeeId: string,
    meta?: { ipAddress?: string; source?: string }
  ) {
    const today = new Date().toISOString().split('T')[0];

    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId, date: today },
      include: { shift: true },
    });

    if (!record || !record.clockIn) {
      throw new BadRequestError('Cannot clock out without clocking in first.');
    }

    if (record.clockOut) {
      throw new BadRequestError('You have already clocked out for today.');
    }

    const now = new Date();
    const durationMinutes = differenceInMinutes(now, new Date(record.clockIn));
    const totalHours = Math.round((durationMinutes / 60) * 100) / 100;

    let overtimeMinutes = 0;
    let earlyDepartureMinutes = 0;

    if (record.shift) {
      const [shiftEndH, shiftEndM] = record.shift.endTime.split(':').map(Number);
      const shiftEndTime = new Date(now);
      shiftEndTime.setHours(shiftEndH, shiftEndM, 0, 0);

      const diffFromEnd = differenceInMinutes(now, shiftEndTime);
      if (diffFromEnd > 30) {
        overtimeMinutes = diffFromEnd;
      } else if (diffFromEnd < 0) {
        earlyDepartureMinutes = Math.abs(diffFromEnd);
      }
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        clockOut: now,
        totalHours,
        overtimeMinutes,
        earlyDepartureMinutes,
        missingClockOut: false,
      },
      include: { shift: true },
    });

    await prisma.attendanceEvent.create({
      data: {
        organizationId,
        employeeId,
        eventType: 'CLOCK_OUT',
        timestamp: now,
        source: meta?.source || 'WEB',
        ipAddress: meta?.ipAddress,
      },
    });

    return updated;
  }

  static async getAttendanceRecords(
    organizationId: string,
    filters: {
      employeeId?: string;
      departmentId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters.departmentId) {
      where.employee = { departmentId: filters.departmentId };
    }

    const [total, records] = await Promise.all([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
          shift: true,
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Request Attendance Correction
  static async requestCorrection(organizationId: string, data: any, actor: any) {
    const record = await prisma.attendanceRecord.findFirst({
      where: { id: data.attendanceRecordId, organizationId },
    });
    if (!record) throw new NotFoundError('Attendance record not found');

    const correction = await prisma.attendanceCorrection.create({
      data: {
        organizationId,
        employeeId: record.employeeId,
        attendanceRecordId: record.id,
        originalClockIn: record.clockIn,
        originalClockOut: record.clockOut,
        proposedClockIn: new Date(data.proposedClockIn),
        proposedClockOut: data.proposedClockOut ? new Date(data.proposedClockOut) : null,
        reason: data.reason,
        requestedById: actor.userId,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'ATTENDANCE',
      recordId: correction.id,
      afterValues: correction,
      reason: `Submitted attendance correction request for date ${record.date}: ${data.reason}`,
    });

    return correction;
  }

  static async reviewCorrection(
    correctionId: string,
    organizationId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewNotes: string | undefined,
    actor: any
  ) {
    const correction = await prisma.attendanceCorrection.findFirst({
      where: { id: correctionId, organizationId },
      include: { attendanceRecord: true },
    });
    if (!correction) throw new NotFoundError('Correction request not found');

    if (correction.status !== 'PENDING') {
      throw new BadRequestError(`This correction has already been ${correction.status.toLowerCase()}`);
    }

    const updated = await prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: {
        status: decision,
        reviewedById: actor.userId,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });

    if (decision === 'APPROVED') {
      const start = updated.proposedClockIn ? new Date(updated.proposedClockIn) : null;
      const end = updated.proposedClockOut ? new Date(updated.proposedClockOut) : null;
      const duration = start && end ? Math.max(0, differenceInMinutes(end, start)) : 0;
      const totalHours = Math.round((duration / 60) * 100) / 100;

      await prisma.attendanceRecord.update({
        where: { id: correction.attendanceRecordId },
        data: {
          clockIn: start,
          clockOut: end,
          totalHours,
          isCorrected: true,
          missingClockOut: end ? false : true,
          status: 'PRESENT',
        },
      });
    }

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'ATTENDANCE',
      recordId: correctionId,
      reason: reviewNotes || `Attendance correction ${decision.toLowerCase()}`,
    });

    return updated;
  }

  // Overtime Request & Approval
  static async requestOvertime(organizationId: string, employeeId: string, data: any, actor: any) {
    const ot = await prisma.overtimeRequest.create({
      data: {
        organizationId,
        employeeId,
        date: data.date,
        hoursRequested: data.hoursRequested,
        otType: data.otType || 'NORMAL_1_5X',
        reason: data.reason,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'ATTENDANCE',
      recordId: ot.id,
      afterValues: ot,
    });

    return ot;
  }

  static async reviewOvertime(
    otId: string,
    organizationId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewNotes: string | undefined,
    actor: any
  ) {
    const ot = await prisma.overtimeRequest.findFirst({
      where: { id: otId, organizationId },
    });
    if (!ot) throw new NotFoundError('Overtime request not found');

    const updated = await prisma.overtimeRequest.update({
      where: { id: otId },
      data: {
        status: decision,
        reviewedById: actor.userId,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'ATTENDANCE',
      recordId: otId,
    });

    return updated;
  }
}

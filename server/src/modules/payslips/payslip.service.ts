import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class PayslipService {
  static async getPayslips(
    organizationId: string,
    filters: { employeeId?: string; periodCode?: string }
  ) {
    const where: any = { organizationId };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.periodCode) where.periodCode = filters.periodCode;

    return prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPayslipById(id: string, organizationId: string, employeeId?: string) {
    const payslip = await prisma.payslip.findFirst({
      where: { id, organizationId },
      include: {
        organization: true,
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true,
          },
        },
        payrollRunEmployee: {
          include: {
            earnings: true,
            deductions: true,
            payrollRun: {
              include: { payrollPeriod: true },
            },
          },
        },
      },
    });

    if (!payslip) throw new NotFoundError('Payslip not found');

    if (employeeId && payslip.employeeId !== employeeId) {
      throw new ForbiddenError('You can only view your own payslips.');
    }

    return payslip;
  }

  static async generatePayslipPdf(id: string, organizationId: string, employeeId?: string): Promise<Buffer> {
    const payslip = await this.getPayslipById(id, organizationId, employeeId);
    const runEmp = payslip.payrollRunEmployee;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const orgName = payslip.organization.name || 'SmartHR Lanka';
      const currency = payslip.organization.currency || 'LKR';

      // --- Header ---
      doc.fillColor('#072849')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(orgName, { align: 'center' });

      doc.fillColor('#64748b')
         .fontSize(10)
         .font('Helvetica')
         .text('MONTHLY PAYSLIP', { align: 'center' })
         .moveDown(1);

      // Divider line
      doc.strokeColor('#0270c7').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // --- Employee & Period Details Grid ---
      const startY = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#072849');
      doc.text('Employee Information:', 40, startY);
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`Name: ${payslip.employee.firstName} ${payslip.employee.lastName}`, 40, startY + 15);
      doc.text(`Employee ID: ${payslip.employee.employeeId}`, 40, startY + 30);
      doc.text(`Department: ${payslip.employee.department?.name || 'General'}`, 40, startY + 45);
      doc.text(`Designation: ${payslip.employee.designation?.title || 'Staff'}`, 40, startY + 60);
      doc.text(`EPF No: ${payslip.employee.epfNumber || 'N/A'}`, 40, startY + 75);

      doc.font('Helvetica-Bold').fillColor('#072849');
      doc.text('Payment Information:', 320, startY);
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`Payslip No: ${payslip.payslipNumber}`, 320, startY + 15);
      doc.text(`Period: ${payslip.periodName} (${payslip.periodCode})`, 320, startY + 30);
      doc.text(`Payment Date: ${payslip.paymentDate}`, 320, startY + 45);
      doc.text(`Bank: ${payslip.employee.bankName || 'Direct Transfer'}`, 320, startY + 60);
      doc.text(`Account No: ${payslip.employee.bankAccountNumber ? '•••• ' + payslip.employee.bankAccountNumber.slice(-4) : 'N/A'}`, 320, startY + 75);

      doc.y = startY + 100;
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // --- Earnings & Deductions Tables ---
      const tableTop = doc.y;

      // Left Column: Earnings
      doc.rect(40, tableTop, 250, 20).fill('#f1f5f9');
      doc.fillColor('#072849').font('Helvetica-Bold').fontSize(10).text('Earnings', 50, tableTop + 5);
      doc.text('Amount (LKR)', 210, tableTop + 5);

      let earnY = tableTop + 25;
      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      for (const earn of runEmp.earnings) {
        doc.text(earn.name, 50, earnY, { width: 150 });
        doc.text(earn.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 }), 210, earnY, { width: 75, align: 'right' });
        earnY += 18;
      }

      // Right Column: Deductions
      doc.rect(305, tableTop, 250, 20).fill('#f1f5f9');
      doc.fillColor('#072849').font('Helvetica-Bold').fontSize(10).text('Deductions', 315, tableTop + 5);
      doc.text('Amount (LKR)', 475, tableTop + 5);

      let dedY = tableTop + 25;
      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      for (const ded of runEmp.deductions) {
        doc.text(ded.name, 315, dedY, { width: 150 });
        doc.text(ded.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 }), 475, dedY, { width: 75, align: 'right' });
        dedY += 18;
      }

      const maxY = Math.max(earnY, dedY, tableTop + 140);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, maxY).lineTo(555, maxY).stroke();

      // --- Totals Row ---
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#072849');
      doc.text('Total Gross Earnings:', 50, maxY + 8);
      doc.text(`${currency} ${runEmp.grossEarnings.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 175, maxY + 8, { width: 110, align: 'right' });

      doc.text('Total Deductions:', 315, maxY + 8);
      doc.text(`${currency} ${runEmp.totalDeductions.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 440, maxY + 8, { width: 110, align: 'right' });

      // --- Net Salary Banner ---
      const netY = maxY + 35;
      doc.rect(40, netY, 515, 36).fill('#072849');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13);
      doc.text('NET SALARY PAYABLE:', 55, netY + 11);
      doc.text(`${currency} ${runEmp.netSalary.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 350, netY + 11, { width: 190, align: 'right' });

      // --- Employer Contributions (Sri Lankan EPF 12% & ETF 3%) ---
      const employerY = netY + 50;
      doc.rect(40, employerY, 515, 45).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9);
      doc.text('Employer Contributions (Not deducted from employee salary):', 50, employerY + 8);
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
      doc.text(`Employer EPF (12%): ${currency} ${runEmp.epfEmployerAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 50, employerY + 24);
      doc.text(`Employer ETF (3%): ${currency} ${runEmp.etfEmployerAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 220, employerY + 24);
      doc.text(`Total Employer Cost: ${currency} ${runEmp.employerTotalCost.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, 380, employerY + 24);

      // --- Footer ---
      doc.fontSize(8).fillColor('#94a3b8').text(
        'This is a system-generated document from SmartHR Lanka. Valid without signature.',
        40,
        760,
        { align: 'center', width: 515 }
      );

      doc.end();
    });
  }
}

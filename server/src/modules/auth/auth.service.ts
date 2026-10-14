import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { BadRequestError, UnauthorizedError } from '../../utils/errors';
import { AuthTokens, JwtUserPayload } from './auth.types';
import { AuditService } from '../audit/audit.service';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_hr_lanka_super_secret_jwt_key_2026';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'smart_hr_lanka_super_secret_refresh_key_2026';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  static async generateTokens(payload: JwtUserPayload): Promise<AuthTokens> {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY as any,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, organizationId: payload.organizationId },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY as any }
    );

    return { accessToken, refreshToken };
  }

  static async login(
    email: string,
    pass: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            departmentId: true,
            branchId: true,
            employmentStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact your administrator.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Resolve primary role and distinct permissions
    const primaryRole = user.userRoles[0]?.role.code || 'EMPLOYEE';
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: primaryRole,
      permissions: Array.from(permissionSet),
      employeeId: user.employee?.id,
      departmentId: user.employee?.departmentId || undefined,
      branchId: user.employee?.branchId || undefined,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
    };

    const tokens = await this.generateTokens(payload);

    // Update lastLoginAt and save hashed refresh token or direct token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken: tokens.refreshToken,
      },
    });

    await AuditService.log({
      organizationId: user.organizationId,
      userId: user.id,
      actorName: payload.fullName,
      actorRole: primaryRole,
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      reason: 'User logged in successfully',
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: payload.fullName,
        role: primaryRole,
        permissions: payload.permissions,
        employeeId: user.employee?.id,
        employeeCode: user.employee?.employeeId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code,
          currency: user.organization.currency,
          timezone: user.organization.timezone,
        },
      },
    };
  }

  static async refreshToken(oldRefreshToken: string) {
    if (!oldRefreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: true,
      },
    });

    if (!user || user.refreshToken !== oldRefreshToken || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const primaryRole = user.userRoles[0]?.role.code || 'EMPLOYEE';
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: primaryRole,
      permissions: Array.from(permissionSet),
      employeeId: user.employee?.id,
      departmentId: user.employee?.departmentId || undefined,
      branchId: user.employee?.branchId || undefined,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
    };

    const tokens = await this.generateTokens(payload);

    // Refresh token rotation
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          include: {
            department: true,
            designation: true,
            branch: true,
          },
        },
      },
    });

    if (!user) throw new BadRequestError('User not found');

    const primaryRole = user.userRoles[0]?.role.code || 'EMPLOYEE';
    const permissions = new Set<string>();

    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      role: primaryRole,
      roles: user.userRoles.map((ur) => ur.role.code),
      permissions: Array.from(permissions),
      employee: user.employee,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
        currency: user.organization.currency,
        timezone: user.organization.timezone,
      },
    };
  }
}

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('SmartHR Lanka API Integration Tests', () => {
  let adminToken: string;
  let employeeToken: string;
  let periodId: string;

  it('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.currency).toBe('LKR');
    expect(res.body.timezone).toBe('Asia/Colombo');
  });

  it('POST /api/v1/auth/login succeeds for Super Admin with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarthr.lk',
        password: 'Admin@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');

    adminToken = res.body.data.tokens.accessToken;
  });

  it('POST /api/v1/auth/login succeeds for Employee (Kasun Perera)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'kasun@smarthr.lk',
        password: 'Admin@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('EMPLOYEE');

    employeeToken = res.body.data.tokens.accessToken;
  });

  it('POST /api/v1/auth/login rejects invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarthr.lk',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me returns current user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@smarthr.lk');
    expect(res.body.data.organization.currency).toBe('LKR');
  });

  it('GET /api/v1/employees requires authentication', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/employees returns employee directory for Super Admin', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/organization/departments returns departments', async () => {
    const res = await request(app)
      .get('/api/v1/organization/departments')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/leave/types returns statutory Sri Lankan leave types', async () => {
    const res = await request(app)
      .get('/api/v1/leave/types')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const codes = res.body.data.map((t: any) => t.code);
    expect(codes).toContain('ANNUAL');
    expect(codes).toContain('CASUAL');
    expect(codes).toContain('MEDICAL_SICK');
  });

  it('GET /api/v1/payroll/periods returns payroll periods', async () => {
    const res = await request(app)
      .get('/api/v1/payroll/periods')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    periodId = res.body.data[0].id;
  });

  it('GET /api/v1/payroll/preview/:periodId calculates live gross, EPF, APIT, and net pay', async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/preview/${periodId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalGrossPay).toBeGreaterThan(0);
    expect(res.body.data.summary.totalNetPay).toBeGreaterThan(0);
    expect(res.body.data.employees.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/payslips returns finalized payslips', async () => {
    const res = await request(app)
      .get('/api/v1/payslips')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organization/organization.routes';
import employeeRoutes from './modules/employees/employee.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import salaryRoutes from './modules/salary/salary.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import loanRoutes from './modules/loans/loan.routes';
import payslipRoutes from './modules/payslips/payslip.routes';
import reportRoutes from './modules/reports/reports.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import auditRoutes from './modules/audit/audit.routes';

const app: Application = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, or restricted in prod
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

app.use('/api/v1/auth/login', authLimiter);

// Health check endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    timezone: 'Asia/Colombo',
    currency: 'LKR',
    app: 'SmartHR Lanka API',
  });
});

// Versioned API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/salary', salaryRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/payslips', payslipRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;

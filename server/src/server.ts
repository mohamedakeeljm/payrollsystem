import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ Connected to SmartHR Lanka Database via Prisma ORM');

    app.listen(PORT, () => {
      console.log(`🚀 SmartHR Lanka API Server running at http://localhost:${PORT}`);
      console.log(`🌍 Timezone: Asia/Colombo | Currency: LKR (Sri Lankan Rupee)`);
      console.log(`📑 Healthcheck: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { initWebSocketServer } from './websocket/socketServer';
import { initOverdueScheduler } from './jobs/overdueScheduler';
import { prisma } from './config/db';

const httpServer = http.createServer(app);

// Initialize WebSocket real-time server
initWebSocketServer(httpServer);

// Initialize overdue task background cron scheduler
initOverdueScheduler();

httpServer.listen(ENV.PORT, () => {
  console.log(`=========================================`);
  console.log(` Velozity Server Running`);
  console.log(` Port: ${ENV.PORT}`);
  console.log(` Environment: ${ENV.NODE_ENV}`);
  console.log(` Client URL: ${ENV.CLIENT_URL}`);
  console.log(`=========================================`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

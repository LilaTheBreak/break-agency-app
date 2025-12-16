import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /health
 * 
 * Health check endpoint for monitoring system status.
 * Returns basic system information and database connectivity.
 * No authentication required.
 */
export async function healthCheck(req: Request, res: Response) {
  const healthData: {
    status: string;
    timestamp: string;
    database: string;
    uptime: number;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "disconnected",
    uptime: process.uptime()
  };

  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;
    healthData.database = "connected";
  } catch (error) {
    console.error("Health check database error:", error);
    healthData.status = "degraded";
    healthData.database = "error";
  }

  // Return 200 if status is ok, 503 if degraded
  const statusCode = healthData.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthData);
}

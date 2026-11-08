import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { RowDataPacket } from "mysql2";

export const getDashboardMetrics = async (_req: Request, res: Response): Promise<void> => {
  const [counts] = await pool.query<RowDataPacket[]>(`
    SELECT 
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('CONFIRMED', 'COMPLETED') THEN bill_amount ELSE 0 END) AS grossRevenue
    FROM bookings
  `);

  const [activeServices] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM services WHERE is_active = TRUE"
  );
  const [registeredClients] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'client'"
  );

  res.json({
    success: true,
    data: {
      totalBookings: counts[0].totalBookings || 0,
      pending: counts[0].pending || 0,
      confirmed: counts[0].confirmed || 0,
      completed: counts[0].completed || 0,
      grossRevenue: counts[0].grossRevenue || 0,
      activeServices: activeServices[0].count || 0,
      registeredClients: registeredClients[0].count || 0,
    },
  });
};
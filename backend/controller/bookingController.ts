import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { BookingRow } from "../model/bookingModel.js";
import { ServiceRow } from "../model/serviceModel.js";
import { generateBookingReference } from "../utils/generateBookingReference.js";
import { sendBookingEmail } from "../services/emailService.js";
import { ResultSetHeader } from "mysql2";

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, email, serviceId, date, time, notes } = req.body;

    const [serviceRows] = await pool.query<ServiceRow[]>(
      "SELECT * FROM services WHERE id = ? AND is_active = TRUE",
      [serviceId]
    );

    if (serviceRows.length === 0) {
      res.status(400).json({ success: false, message: "Selected service is invalid or unavailable." });
      return;
    }
    const service = serviceRows[0];

    // Check slot availability
    const [conflict] = await pool.query<BookingRow[]>(
      "SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ? AND status IN ('PENDING', 'CONFIRMED')",
      [date, time]
    );

    if (conflict.length > 0) {
      res.status(409).json({ success: false, message: "That appointment slot is already reserved." });
      return;
    }

    const reference = generateBookingReference();
    const userId = req.user ? req.user.id : null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO bookings 
        (reference, user_id, name, phone, email, service_id, booking_date, booking_time, notes, bill_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference, userId, name, phone, email || null, service.id, date, time, notes || "", service.price]
    );

    if (email) {
      sendBookingEmail(email, { reference, name, date, time, serviceName: service.name });
    }

    res.status(201).json({
      success: true,
      data: { id: result.insertId, reference, name, date, time, bill_amount: service.price },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reserve appointment." });
  }
};

// Client view of their own bookings
export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  const [rows] = await pool.query<BookingRow[]>(
    `SELECT b.*, s.name as service_name, s.duration 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     WHERE b.user_id = ? 
     ORDER BY b.created_at DESC`,
    [req.user?.id]
  );
  res.json({ success: true, data: rows });
};

// Admin view of all bookings
export const getAdminBookings = async (_req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<BookingRow[]>(
    `SELECT b.*, s.name as service_name 
     FROM bookings b 
     JOIN services s ON b.service_id = s.id 
     ORDER BY b.created_at DESC`
  );
  res.json({ success: true, data: rows });
};

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ success: true, message: "Status updated" });
};
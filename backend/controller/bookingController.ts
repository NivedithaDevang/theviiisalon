import { Request, Response } from "express";
import { PoolConnection } from "mysql2/promise";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/database.js";
import { BookingRow } from "../model/bookingModel.js";
import { generateBookingReference } from "../utils/generateBookingReference.js";
import { sendBookingEmails } from "../services/emailService.js";

interface IncomingServiceItem {
  id: number;
  name: string;
  price: number;
  category?: string;
}

interface ServiceDbRow extends RowDataPacket {
  id: number;
  service_name: string;
  price: number;
  duration_minutes: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function resolveServicesDetails(
  conn: PoolConnection,
  serviceId: number,
  serviceName?: string,
  price?: number,
  services?: IncomingServiceItem[]
): Promise<{
  primaryServiceId: number;
  combinedName: string;
  totalPrice: number;
  totalDuration: number;
  services: Array<{ name: string; price: number }>;
}> {
  const items: IncomingServiceItem[] =
    Array.isArray(services) && services.length > 0
      ? services
      : [{ id: Number(serviceId), name: serviceName || "Salon Service", price: Number(price) || 0 }];

  let primaryServiceId: number | null = null;
  let totalPrice = 0;
  let totalDuration = 0;
  const resolvedNames: string[] = [];
  const resolvedServices: Array<{ name: string; price: number }> = [];

  for (const item of items) {
    const [rows] = await conn.query<ServiceDbRow[]>(
      `SELECT id, service_name, price, duration_minutes
       FROM services
       WHERE (id = ? OR LOWER(service_name) = LOWER(?)) AND is_active = TRUE
       LIMIT 1`,
      [item.id, item.name]
    );

    if (rows.length > 0) {
      const dbService = rows[0];
      if (!primaryServiceId) primaryServiceId = dbService.id;
      totalPrice += Number(dbService.price);
      totalDuration += Number(dbService.duration_minutes) || 45;
      resolvedNames.push(dbService.service_name);
      resolvedServices.push({ name: dbService.service_name, price: Number(dbService.price) });
    } else {
      const itemPrice = Number(item.price) || 0;
      totalPrice += itemPrice;
      totalDuration += 45;
      resolvedNames.push(item.name);
      resolvedServices.push({ name: item.name, price: itemPrice });
    }
  }

  if (!primaryServiceId) {
    const first = items[0];
    const categoryName = first.category || "General Salon";

    await conn.query(`INSERT IGNORE INTO service_categories (name) VALUES (?)`, [categoryName]);
    const [catRows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM service_categories WHERE name = ? LIMIT 1`,
      [categoryName]
    );

    const [inserted] = await conn.query<ResultSetHeader>(
      `INSERT INTO services (category_id, service_name, price, duration_minutes)
       VALUES (?, ?, ?, ?)`,
      [catRows[0].id, first.name.slice(0, 180), Number(first.price) || 0, 45]
    );
    primaryServiceId = inserted.insertId;
  }

  return {
    primaryServiceId,
    combinedName: resolvedNames.join(", ").slice(0, 500),
    totalPrice,
    totalDuration,
    services: resolvedServices,
  };
}

// POST /api/bookings
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const connection = await db.getConnection();
  try {
    const { name, phone, email, serviceId, serviceName, price, services, date, time, notes } = req.body;
    const cleanEmail = typeof email === "string" ? email.trim() : "";

    if (!name || !phone || !cleanEmail || (!serviceId && (!services || services.length === 0)) || !date || !time) {
      res.status(400).json({ success: false, message: "Name, phone, email, service, date, and time are required." });
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      res.status(400).json({ success: false, message: "Please provide a valid email address for your booking confirmation." });
      return;
    }

    const [conflict] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM bookings
       WHERE appointment_date = ?
         AND appointment_time = ?
         AND status IN ('PENDING', 'CONFIRMED')
       LIMIT 1`,
      [date, time]
    );

    if (conflict.length > 0) {
      res.status(409).json({ success: false, message: "That appointment slot is already reserved." });
      return;
    }

    await connection.beginTransaction();

    const cleanPhone = String(phone).trim();
    const cleanName = String(name).trim();
    const cleanNotes = notes ? String(notes).trim() : null;

    const [existingCustomer] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE phone = ? LIMIT 1`,
      [cleanPhone]
    );

    let customerId: number;
    if (existingCustomer.length > 0) {
      customerId = Number(existingCustomer[0].id);
      await connection.query(
        `UPDATE customers SET full_name = ?, email = COALESCE(?, email) WHERE id = ?`,
        [cleanName, cleanEmail, customerId]
      );
    } else {
      const [customerResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO customers (full_name, phone, whatsapp_number, email) VALUES (?, ?, ?, ?)`,
        [cleanName, cleanPhone, cleanPhone, cleanEmail]
      );
      customerId = customerResult.insertId;
    }

    const {
      primaryServiceId,
      combinedName,
      totalPrice,
      totalDuration,
      services: resolvedServices,
    } = await resolveServicesDetails(connection, Number(serviceId), serviceName, price, services);

    const reference = generateBookingReference();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO bookings
        (reference, customer_id, service_id, service_name_snapshot, price_snapshot, duration_snapshot, appointment_date, appointment_time, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference,
        customerId,
        primaryServiceId,
        combinedName,
        totalPrice,
        totalDuration,
        date,
        time,
        cleanNotes,
      ]
    );

    await connection.commit();

    let emailDelivery: { client: "SENT" | "FAILED" | "NOT_PROVIDED"; admin: "SENT" | "FAILED" };
    try {
      emailDelivery = await sendBookingEmails({
        bookingId: result.insertId,
        reference,
        name: cleanName,
        phone: cleanPhone,
        clientEmail: cleanEmail,
        services: resolvedServices,
        serviceName: combinedName,
        totalPrice,
        date,
        time,
        notes: cleanNotes,
      });
    } catch (emailError) {
      console.error("Booking was saved, but booking email dispatch failed:", emailError);
      emailDelivery = {
        client: cleanEmail ? "FAILED" : "NOT_PROVIDED",
        admin: "FAILED",
      };
    }

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        reference,
        name: cleanName,
        serviceName: combinedName,
        date,
        time,
        bill_amount: totalPrice,
        emailDelivery,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Create booking error:", err);
    res.status(500).json({ success: false, message: "Failed to reserve appointment." });
  } finally {
    connection.release();
  }
};

// GET /api/bookings (Admin Panel — returns all bookings with customer details)
export const getAdminBookings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await db.query<BookingRow[]>(
      `SELECT
        b.id,
        b.reference,
        c.full_name AS name,
        c.phone,
        c.email,
        b.service_id,
        COALESCE(sc.name, 'Uncategorized') AS category,
        b.service_name_snapshot AS service_name,
        b.price_snapshot AS bill_amount,
        b.duration_snapshot AS duration,
        DATE_FORMAT(b.appointment_date, '%Y-%m-%d') AS booking_date,
        TIME_FORMAT(b.appointment_time, '%H:%i') AS booking_time,
        b.status,
        b.notes,
        b.internal_notes,
        b.created_at
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       LEFT JOIN services s ON b.service_id = s.id
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       ORDER BY b.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get admin bookings error:", err);
    res.status(500).json({ success: false, message: "Failed to load bookings." });
  }
};

// PATCH /api/bookings/:id/status (Admin Panel — Confirm / Complete / Cancel)
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, internalNotes } = req.body;
    const allowedStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid booking status." });
      return;
    }

    await db.query(
      `UPDATE bookings
       SET status = ?, internal_notes = COALESCE(?, internal_notes)
       WHERE id = ?`,
      [status, internalNotes ?? null, req.params.id]
    );
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ success: false, message: "Failed to update booking status." });
  }
};
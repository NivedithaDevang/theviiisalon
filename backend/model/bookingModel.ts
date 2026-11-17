import crypto from "crypto";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {db} from "../config/database.js";

export interface BookingRow extends RowDataPacket {
  id: number;
  reference: string;
  user_id?: number;
  name: string;
  phone: string;
  email?: string;
  service_id: number;
  booking_date: string;
  booking_time: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  bill_amount: number;
  service_name?: string;
  duration_snapshot?: number;
  internal_notes?: string;
  created_at?: Date;
}

export interface SelectedServiceItem {
  id: number;
  name: string;
  price: number;
  category?: string;
  duration_minutes?: number;
}

export interface CreateBookingInput {
  name: string;
  phone: string;
  email?: string;
  serviceId: number;
  serviceName: string;
  price: number;
  services?: SelectedServiceItem[];
  date: string;
  time: string;
  notes?: string;
}

function generateBookingReference(): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `VIII-${datePart}-${randomPart}`;
}

// Ensures a valid service_id exists in `services` even if the frontend used fallback catalog IDs
async function resolveValidServiceId(
  conn: PoolConnection,
  input: CreateBookingInput
): Promise<{ serviceId: number; duration: number }> {
  const [byId] = await conn.query<RowDataPacket[]>(
    `SELECT id, duration_minutes FROM services WHERE id = ? LIMIT 1`,
    [input.serviceId]
  );
  if (byId.length > 0) {
    return {
      serviceId: Number(byId[0].id),
      duration: Number(byId[0].duration_minutes) || 45,
    };
  }

  const primaryName = input.services?.[0]?.name || input.serviceName.split(",")[0].trim();
  const [byName] = await conn.query<RowDataPacket[]>(
    `SELECT id, duration_minutes FROM services WHERE LOWER(service_name) = LOWER(?) LIMIT 1`,
    [primaryName]
  );
  if (byName.length > 0) {
    return {
      serviceId: Number(byName[0].id),
      duration: Number(byName[0].duration_minutes) || 45,
    };
  }

  // Fallback: ensure a default category and service row exist so FK constraint never fails
  const categoryName = input.services?.[0]?.category || "General Salon";
  await conn.query(
    `INSERT IGNORE INTO service_categories (name) VALUES (?)`,
    [categoryName]
  );
  const [catRows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM service_categories WHERE name = ? LIMIT 1`,
    [categoryName]
  );
  const categoryId = Number(catRows[0].id);

  const [insertedService] = await conn.query<ResultSetHeader>(
    `INSERT INTO services (category_id, service_name, price, duration_minutes)
     VALUES (?, ?, ?, ?)`,
    [categoryId, primaryName.slice(0, 180), input.services?.[0]?.price ?? input.price, 45]
  );

  return { serviceId: insertedService.insertId, duration: 45 };
}

export const bookingModel = {
  // Create a booking (upserts customer by phone + inserts booking inside a transaction)
  async createBooking(input: CreateBookingInput): Promise<{ id: number; reference: string }> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const cleanPhone = input.phone.trim();
      const cleanName = input.name.trim();
      const cleanEmail = input.email?.trim() || null;

      // 1. Upsert customer in `customers` table
      const [existingCustomers] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM customers WHERE phone = ? LIMIT 1`,
        [cleanPhone]
      );

      let customerId: number;
      if (existingCustomers.length > 0) {
        customerId = Number(existingCustomers[0].id);
        await connection.query(
          `UPDATE customers
           SET full_name = ?, email = COALESCE(?, email)
           WHERE id = ?`,
          [cleanName, cleanEmail, customerId]
        );
      } else {
        const [customerResult] = await connection.query<ResultSetHeader>(
          `INSERT INTO customers (full_name, phone, whatsapp_number, email)
           VALUES (?, ?, ?, ?)`,
          [cleanName, cleanPhone, cleanPhone, cleanEmail]
        );
        customerId = customerResult.insertId;
      }

      // 2. Resolve valid service_id for foreign key integrity
      const { serviceId, duration } = await resolveValidServiceId(connection, input);

      // 3. Calculate total duration & snapshot name (fits VARCHAR(180))
      const totalDuration =
        input.services && input.services.length > 0
          ? input.services.reduce((sum, s) => sum + (Number(s.duration_minutes) || 45), 0)
          : duration;

      const snapshotName = input.serviceName.trim().slice(0, 180);
      const reference = generateBookingReference();

      // 4. Insert into `bookings`
      const [bookingResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO bookings (
          reference,
          customer_id,
          service_id,
          service_name_snapshot,
          price_snapshot,
          duration_snapshot,
          appointment_date,
          appointment_time,
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          reference,
          customerId,
          serviceId,
          snapshotName,
          Number(input.price),
          totalDuration,
          input.date,
          input.time,
          input.notes?.trim() || null,
        ]
      );

      await connection.commit();
      return { id: bookingResult.insertId, reference };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all bookings for Admin Dashboard (mapped to BookingRow)
  async findAll(filters?: { status?: string; date?: string }): Promise<BookingRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      conditions.push("b.status = ?");
      params.push(filters.status);
    }
    if (filters?.date) {
      conditions.push("b.appointment_date = ?");
      params.push(filters.date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query<BookingRow[]>(
      `SELECT
        b.id,
        b.reference,
        b.customer_id AS user_id,
        c.full_name AS name,
        c.phone,
        c.email,
        b.service_id,
        b.service_name_snapshot AS service_name,
        b.price_snapshot AS bill_amount,
        b.duration_snapshot,
        DATE_FORMAT(b.appointment_date, '%Y-%m-%d') AS booking_date,
        TIME_FORMAT(b.appointment_time, '%H:%i') AS booking_time,
        b.status,
        b.notes,
        b.internal_notes,
        b.created_at
       FROM bookings b
       INNER JOIN customers c ON b.customer_id = c.id
       ${whereClause}
       ORDER BY b.appointment_date DESC, b.appointment_time ASC`,
      params
    );
    return rows;
  },

  // Get single booking by ID or Reference
  async findByIdOrReference(identifier: number | string): Promise<BookingRow | null> {
    const isNumeric = typeof identifier === "number" || /^\d+$/.test(String(identifier));
    const [rows] = await db.query<BookingRow[]>(
      `SELECT
        b.id,
        b.reference,
        b.customer_id AS user_id,
        c.full_name AS name,
        c.phone,
        c.email,
        b.service_id,
        b.service_name_snapshot AS service_name,
        b.price_snapshot AS bill_amount,
        b.duration_snapshot,
        DATE_FORMAT(b.appointment_date, '%Y-%m-%d') AS booking_date,
        TIME_FORMAT(b.appointment_time, '%H:%i') AS booking_time,
        b.status,
        b.notes,
        b.internal_notes,
        b.created_at
       FROM bookings b
       INNER JOIN customers c ON b.customer_id = c.id
       WHERE ${isNumeric ? "b.id = ?" : "b.reference = ?"}
       LIMIT 1`,
      [identifier]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Check if a date/time slot is already booked (avoids UNIQUE KEY uq_appointment_slot crash)
  async isSlotTaken(date: string, time: string): Promise<boolean> {
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id FROM bookings
       WHERE appointment_date = ?
         AND appointment_time = ?
         AND status NOT IN ('CANCELLED', 'REJECTED')
       LIMIT 1`,
      [date, normalizedTime]
    );
    return rows.length > 0;
  },

  // Update booking status & optional internal admin notes
  async updateStatus(
    id: number,
    status: BookingRow["status"],
    internalNotes?: string
  ): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE bookings
       SET status = ?,
           internal_notes = COALESCE(?, internal_notes)
       WHERE id = ?`,
      [status, internalNotes ?? null, id]
    );
    return result.affectedRows > 0;
  },
};
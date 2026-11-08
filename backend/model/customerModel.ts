import db from "../config/database.js";
import { RowDataPacket } from "mysql2";

export const getAllCustomers = async () => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
            c.id,
            c.full_name,
            c.phone,
            c.whatsapp_number,
            c.email,
            c.gender,
            c.whatsapp_opt_in,
            c.created_at,
            COUNT(b.id) AS total_bookings
         FROM customers c
         LEFT JOIN bookings b ON c.id = b.customer_id
         GROUP BY c.id
         ORDER BY c.created_at DESC`
    );

    return rows;
};

export const getCustomerById = async (id: number) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, full_name, phone, whatsapp_number,
                email, gender, notes, whatsapp_opt_in, created_at
         FROM customers
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
};

export const getCustomerBookings = async (id: number) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
            b.id,
            b.booking_reference,
            b.appointment_date,
            b.start_time,
            b.end_time,
            b.total_amount,
            b.booking_status
         FROM bookings b
         WHERE b.customer_id = ?
         ORDER BY b.appointment_date DESC`,
        [id]
    );

    return rows;
};

export const searchCustomers = async (search: string) => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, full_name, phone, email
         FROM customers
         WHERE full_name LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
         ORDER BY full_name ASC
         LIMIT 50`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    return rows;
};
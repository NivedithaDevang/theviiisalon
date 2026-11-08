import db from "../config/database.js";
import { RowDataPacket } from "mysql2";

export const getDashboardStats = async () => {
    const [rows] = await db.execute<RowDataPacket[]>(`
        SELECT
            COUNT(*) AS total_bookings,

            SUM(appointment_date = CURDATE()
                AND booking_status = 'CONFIRMED') AS today_appointments,

            SUM(booking_status = 'PENDING') AS pending_bookings,

            SUM(booking_status = 'CONFIRMED') AS confirmed_bookings,

            SUM(booking_status = 'COMPLETED') AS completed_bookings,

            SUM(booking_status = 'CANCELLED') AS cancelled_bookings,

            SUM(
                CASE WHEN booking_status = 'COMPLETED'
                THEN total_amount ELSE 0 END
            ) AS total_revenue

        FROM bookings
    `);

    const [customers] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total_customers FROM customers`
    );

    const [services] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS active_services
         FROM services WHERE is_active = TRUE`
    );

    return {
        ...rows[0],
        total_customers: customers[0].total_customers,
        active_services: services[0].active_services
    };
};
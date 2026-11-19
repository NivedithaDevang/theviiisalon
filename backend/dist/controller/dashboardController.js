import { db } from "../config/database.js";
export const getDashboardMetrics = async (_req, res) => {
    const [counts] = await db.query(`
    SELECT 
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('CONFIRMED', 'COMPLETED') THEN price_snapshot ELSE 0 END) AS grossRevenue
    FROM bookings
  `);
    const [activeServices] = await db.query("SELECT COUNT(*) as count FROM services WHERE is_active = TRUE");
    const [registeredClients] = await db.query("SELECT COUNT(*) as count FROM customers");
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
//# sourceMappingURL=dashboardController.js.map
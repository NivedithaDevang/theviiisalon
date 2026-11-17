import { useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { api } from "../api";

interface AdminBooking {
  id: number;
  reference: string;
  name: string;
  phone: string;
  email?: string;
  service_name: string;
  bill_amount: number;
  booking_date: string;
  booking_time: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  notes?: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setError("");
      const token = localStorage.getItem("adminToken");
      const { data } = await api.get<{ data: AdminBooking[] }>("/bookings", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setBookings(data.data || []);
    } catch {
      setError("Could not load bookings. Please verify your admin session.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    // Auto-refresh every 15 seconds so newly booked appointments appear live
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  const handleStatusChange = async (id: number, status: AdminBooking["status"]) => {
    try {
      const token = localStorage.getItem("adminToken");
      await api.patch(
        `/bookings/${id}/status`,
        { status },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      alert("Failed to update booking status.");
    }
  };

  const visibleBookings =
    filterStatus === "ALL" ? bookings : bookings.filter((b) => b.status === filterStatus);

  return (
    <section className="admin-bookings" style={{ padding: "7rem 1.5rem 4rem", maxWidth: 1100, margin: "0 auto", color: "#fbf6ef" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <small style={{ color: "#d8b467", letterSpacing: "0.2em" }}>SALON OWNER PORTAL</small>
          <h1 style={{ margin: "0.25rem 0 0" }}>Client Appointments ({bookings.length})</h1>
        </div>
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          <select
            className="salon-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: "#1c0e12", color: "#fbf6ef", border: "1px solid rgba(216,180,103,0.35)", borderRadius: 10, padding: "0.55rem 0.9rem" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={fetchBookings}
            style={{ background: "#d8b467", color: "#180c0f", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <p style={{ color: "#ff9b9b" }}>{error}</p>}

      {loading ? (
        <p>Loading appointments…</p>
      ) : visibleBookings.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No appointments found for this filter.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {visibleBookings.map((booking) => (
            <div
              key={booking.id}
              style={{
                background: "rgba(29, 15, 19, 0.85)",
                border: "1px solid rgba(216, 180, 103, 0.22)",
                borderRadius: 16,
                padding: "1.25rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                  <strong style={{ color: "#e3c178", letterSpacing: "0.06em" }}>{booking.reference}</strong>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(216,180,103,0.16)", color: "#e3c178" }}>
                    {booking.status}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>
                  {booking.name} • <span style={{ fontWeight: 400, opacity: 0.85 }}>{booking.phone}</span>
                </h3>
                <p style={{ margin: "0 0 0.35rem", color: "#e3c178" }}>
                  {booking.service_name} — <strong>₹{Number(booking.bill_amount).toLocaleString("en-IN")}</strong>
                </p>
                <small style={{ opacity: 0.75 }}>
                  Slot: {booking.booking_date} at {booking.booking_time}
                  {booking.email ? ` • ${booking.email}` : ""}
                  {booking.notes ? ` • Note: "${booking.notes}"` : ""}
                </small>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {booking.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                    style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 0.9rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <CheckCircle size={15} /> Confirm
                  </button>
                )}
                {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(booking.id, "COMPLETED")}
                      style={{ background: "#d8b467", color: "#180c0f", border: "none", borderRadius: 8, padding: "0.5rem 0.9rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <Clock size={15} /> Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                      style={{ background: "rgba(220, 68, 68, 0.2)", color: "#ff9b9b", border: "1px solid rgba(220,68,68,0.4)", borderRadius: 8, padding: "0.5rem 0.9rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      <XCircle size={15} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ArrowLeft, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface DashboardStats {
  totalBookings: number;
  pending: number;
  confirmed: number;
  completed: number;
  grossRevenue: number;
  registeredClients: number;
}

interface AdminBooking {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  service_name?: string;
  serviceName?: string;
  booking_date?: string;
  date?: string;
  booking_time?: string;
  time?: string;
  bill_amount?: number;
  billAmount?: number;
  status: BookingStatus;
}

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

const emptyStats: DashboardStats = {
  totalBookings: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  grossRevenue: 0,
  registeredClients: 0,
};

function requestMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "The request failed. Please try again.";
  }
  return "The request failed. Please try again.";
}

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("theviiisalon88@gmail.com");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState(emptyStats);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    setError("");
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/bookings"),
      ]);
      setStats({ ...emptyStats, ...dashboardResponse.data?.data });
      setBookings(bookingsResponse.data?.data || []);
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/auth/me")
      .then(({ data }) => {
        if (active && data?.data?.role === "admin") setUser(data.data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof AxiosError && requestError.response?.status === 401) {
          setUser(null);
        } else {
          setError(requestMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user) void loadDashboard();
  }, [user]);

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/admin/login-request", { email, password });
      setOtpRequested(true);
      setNotice(data?.message || "A verification code has been sent to the registered salon email.");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/admin/verify-otp", { email, otp });
      setUser(data.data);
      setOtp("");
      setPassword("");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (booking: AdminBooking, status: BookingStatus) => {
    setError("");
    try {
      await api.patch(`/admin/bookings/${booking.id}/status`, { status });
      setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status } : item));
      const { data } = await api.get("/admin/dashboard");
      setStats({ ...emptyStats, ...data?.data });
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  };

  const logout = async () => {
    setError("");
    try {
      await api.post("/auth/logout");
      setUser(null);
      setOtpRequested(false);
      setOtp("");
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  };

  const isLoggedIn = Boolean(user);

  return (
    <section className="admin-page">
      <div className="admin-page-top">
        <Link to="/" className="admin-back-link"><ArrowLeft size={15} /> Back to salon</Link>
        {isLoggedIn && (
          <button type="button" className="admin-logout" onClick={() => void logout()}>
            <LogOut size={15} /> Sign out
          </button>
        )}
      </div>
      <header className="admin-page-heading">
        <span className="luxury-tag"><ShieldCheck size={14} /> OWNER PORTAL</span>
        <h1>{isLoggedIn ? "Salon dashboard" : "Welcome back."}</h1>
        <p>{isLoggedIn ? `Signed in as ${user?.email}` : "Secure sign-in for THE VIII SALON management."}</p>
      </header>

      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-notice" role="status">{notice}</p>}

      {checkingSession ? (
        <p className="admin-loading">Checking your secure session…</p>
      ) : !user ? (
        <div className="admin-login-card">
          <h2>{otpRequested ? "Verify your sign-in" : "Sign in securely"}</h2>
          <p>{otpRequested ? "Enter the one-time code sent to your salon email." : "Use your registered owner email and password. A one-time code will be sent to complete sign-in."}</p>
          {otpRequested ? (
            <form onSubmit={verifyOtp} className="admin-login-form">
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
              <label>Verification code<input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} required autoComplete="one-time-code" /></label>
              <button type="submit" className="btn-luxury-primary" disabled={busy}>{busy ? "Verifying…" : "Verify and continue"}</button>
              <button type="button" className="admin-text-button" onClick={() => { setOtpRequested(false); setOtp(""); setNotice(""); }}>Use another sign-in request</button>
            </form>
          ) : (
            <form onSubmit={requestOtp} className="admin-login-form">
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label>
              <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
              <button type="submit" className="btn-luxury-primary" disabled={busy}>{busy ? "Sending code…" : "Continue with email"}</button>
            </form>
          )}
        </div>
      ) : (
        <>
          <div className="admin-stats-grid">
            {[
              ["Total appointments", stats.totalBookings],
              ["Awaiting confirmation", stats.pending],
              ["Confirmed", stats.confirmed],
              ["Completed", stats.completed],
              ["Gross revenue", `₹${Number(stats.grossRevenue).toLocaleString("en-IN")}`],
              ["Registered clients", stats.registeredClients],
            ].map(([label, value]) => (
              <article className="admin-stat-card" key={label}>
                <span>{label}</span><strong>{value}</strong>
              </article>
            ))}
          </div>
          <section className="admin-bookings-panel">
            <div className="admin-bookings-heading">
              <div><span className="admin-kicker">APPOINTMENT DESK</span><h2>Recent bookings</h2></div>
              <button type="button" className="admin-refresh" onClick={() => void loadDashboard()} disabled={loadingDashboard}>
                <RefreshCw size={15} /> Refresh
              </button>
            </div>
            {loadingDashboard ? <p className="admin-loading">Loading appointments…</p> : bookings.length === 0 ? (
              <p className="admin-empty">No appointments yet. New requests will appear here.</p>
            ) : (
              <div className="admin-bookings-scroll">
                <table className="admin-bookings-table">
                  <thead><tr><th>Client</th><th>Service</th><th>Date & time</th><th>Amount</th><th>Status</th><th>Update</th></tr></thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td><strong>{booking.name}</strong><small>{booking.phone}{booking.email ? ` · ${booking.email}` : ""}</small></td>
                        <td>{booking.service_name || booking.serviceName || "—"}</td>
                        <td>{String(booking.booking_date || booking.date || "—").slice(0, 10)}<small>{booking.booking_time || booking.time || ""}</small></td>
                        <td>₹{Number(booking.bill_amount ?? booking.billAmount ?? 0).toLocaleString("en-IN")}</td>
                        <td><span className={`booking-status status-${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                        <td>
                          <select aria-label={`Update status for ${booking.name}`} value={booking.status} onChange={(event) => void updateStatus(booking, event.target.value as BookingStatus)}>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

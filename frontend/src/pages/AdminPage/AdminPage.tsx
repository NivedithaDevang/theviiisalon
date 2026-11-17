import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { ArrowLeft, ChevronDown, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Header } from "../../components/Header/Header";
import "./AdminPage.css";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type BookingSort =
  | "date_latest"
  | "date_earliest"
  | "created_latest"
  | "created_earliest"
  | "amount_high"
  | "amount_low"
  | "client_az";

interface DropdownOption {
  value: string;
  label: string;
}

const BOOKING_SORT_OPTIONS: DropdownOption[] = [
  { value: "date_latest", label: "Appointment: latest first" },
  { value: "date_earliest", label: "Appointment: earliest first" },
  { value: "created_latest", label: "Recently added" },
  { value: "created_earliest", label: "Oldest added" },
  { value: "amount_high", label: "Amount: high to low" },
  { value: "amount_low", label: "Amount: low to high" },
  { value: "client_az", label: "Client: A to Z" },
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

const BOOKING_STATUS_OPTIONS: DropdownOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function AdminDropdown({
  value,
  options,
  ariaLabel,
  compact = false,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  ariaLabel: string;
  compact?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div
      className={`admin-sort-dropdown${compact ? " is-compact" : ""}${open ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="admin-sort-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open && (
        <div className="admin-sort-options" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`admin-sort-option${option.value === value ? " is-selected" : ""}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  reference?: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  service_name?: string;
  serviceName?: string;
  booking_date?: string;
  date?: string;
  booking_time?: string;
  created_at?: string;
  time?: string;
  bill_amount?: number;
  billAmount?: number;
  status: BookingStatus;
}

interface AdminUser {
  id: number;
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
  const [secretKey, setSecretKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState(emptyStats);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingMonthFilter, setBookingMonthFilter] = useState("ALL");
  const [bookingSort, setBookingSort] = useState<BookingSort>("date_latest");
  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    setError("");
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/bookings"),
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
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (active && data?.data?.role === "ADMIN") setUser(data.data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof AxiosError && requestError.response?.status === 401) {
          localStorage.removeItem("adminToken");
          setUser(null);
        } else {
          setError(requestMessage(requestError));
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) void loadDashboard();
  }, [user]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/auth/login", { email, password, secretKey });
      const token = data?.data?.token;
      const admin = data?.data?.admin as AdminUser | undefined;
      if (!token || !admin || admin.role !== "ADMIN") {
        throw new Error("The server returned an invalid admin login response.");
      }
      localStorage.setItem("adminToken", token);
      setUser(admin);
      setPassword("");
      setSecretKey("");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (booking: AdminBooking, status: BookingStatus) => {
    setError("");
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status });
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status } : item))
      );
      const { data } = await api.get("/dashboard/stats");
      setStats({ ...emptyStats, ...data?.data });
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  };

  const logout = async () => {
    setError("");
    try {
      await api.post("/auth/logout");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      localStorage.removeItem("adminToken");
      setUser(null);
      setPassword("");
      setSecretKey("");
    }
  };

  const bookingMonths = useMemo(
    () =>
      [
        ...new Set(
          bookings
            .map((booking) => (booking.booking_date || booking.date || "").slice(0, 7))
            .filter(Boolean)
        ),
      ].sort((a, b) => b.localeCompare(a)),
    [bookings]
  );

  const formatMonth = (month: string) =>
    new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
      new Date(`${month}-01T00:00:00`)
    );

  const monthDropdownOptions: DropdownOption[] = useMemo(
    () => [
      { value: "ALL", label: "All months" },
      ...bookingMonths.map((month) => ({ value: month, label: formatMonth(month) })),
    ],
    [bookingMonths]
  );

  const visibleBookings = useMemo(() => {
    const query = bookingSearch.trim().toLocaleLowerCase();
    const filtered = bookings.filter((booking) => {
      const bookingDate = (booking.booking_date || booking.date || "").slice(0, 10);
      const searchable = [
        booking.name,
        booking.phone,
        booking.email,
        booking.reference,
        booking.service_name,
        booking.serviceName,
        booking.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (bookingStatusFilter === "ALL" || booking.status === bookingStatusFilter) &&
        (bookingMonthFilter === "ALL" || bookingDate.startsWith(bookingMonthFilter)) &&
        (!bookingDateFrom || bookingDate >= bookingDateFrom) &&
        (!bookingDateTo || bookingDate <= bookingDateTo)
      );
    });

    return filtered.sort((a, b) => {
      const dateA = `${a.booking_date || a.date || ""} ${a.booking_time || a.time || ""}`;
      const dateB = `${b.booking_date || b.date || ""} ${b.booking_time || b.time || ""}`;
      const createdA = new Date(a.created_at || "").getTime() || 0;
      const createdB = new Date(b.created_at || "").getTime() || 0;
      const amountA = Number(a.bill_amount ?? a.billAmount ?? 0);
      const amountB = Number(b.bill_amount ?? b.billAmount ?? 0);

      switch (bookingSort) {
        case "date_earliest":
          return dateA.localeCompare(dateB);
        case "created_latest":
          return createdB - createdA;
        case "created_earliest":
          return createdA - createdB;
        case "amount_high":
          return amountB - amountA;
        case "amount_low":
          return amountA - amountB;
        case "client_az":
          return a.name.localeCompare(b.name);
        case "date_latest":
        default:
          return dateB.localeCompare(dateA);
      }
    });
  }, [
    bookings,
    bookingSearch,
    bookingStatusFilter,
    bookingMonthFilter,
    bookingDateFrom,
    bookingDateTo,
    bookingSort,
  ]);

  const clearBookingFilters = () => {
    setBookingSearch("");
    setBookingStatusFilter("ALL");
    setBookingMonthFilter("ALL");
    setBookingSort("date_latest");
    setBookingDateFrom("");
    setBookingDateTo("");
  };

  const isLoggedIn = Boolean(user);

  return (
    <div>
      <Header />
      <section className="admin-page">
        <div className="admin-page-top">
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={15} /> Back to salon
          </Link>
          {isLoggedIn && (
            <button type="button" className="admin-logout" onClick={() => void logout()}>
              <LogOut size={15} /> Sign out
            </button>
          )}
        </div>
        <header className="admin-page-heading">
          <span className="luxury-tag">
            <ShieldCheck size={14} /> OWNER PORTAL
          </span>
          <h1>{isLoggedIn ? "Salon dashboard" : "Welcome back."}</h1>
          <p>
            {isLoggedIn
              ? `Signed in as ${user?.email}`
              : "Secure sign-in for THE VIII SALON management."}
          </p>
        </header>

        {error && (
          <p className="admin-message admin-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-message admin-notice" role="status">
            {notice}
          </p>
        )}

        {checkingSession ? (
          <p className="admin-loading">Checking your secure session…</p>
        ) : !user ? (
          <div className="admin-login-card">
            <h2>Sign in securely</h2>
            <p>Use your registered owner email, password, and admin secret key.</p>
            <form onSubmit={login} className="admin-login-form">
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label>
                Admin secret key
                <input
                  type="password"
                  value={secretKey}
                  onChange={(event) => setSecretKey(event.target.value)}
                  required
                  autoComplete="off"
                />
              </label>
              <button type="submit" className="btn-luxury-primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
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
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
            <section className="admin-bookings-panel">
              <div className="admin-bookings-heading">
                <div>
                  <span className="admin-kicker">APPOINTMENT DESK</span>
                  <h2>
                    Bookings ({visibleBookings.length} of {bookings.length})
                  </h2>
                </div>
                <button
                  type="button"
                  className="admin-refresh"
                  onClick={() => void loadDashboard()}
                  disabled={loadingDashboard}
                >
                  <RefreshCw size={15} /> Refresh
                </button>
              </div>
              <div className="admin-booking-filters">
                <label className="admin-booking-search">
                  Search bookings
                  <input
                    type="search"
                    value={bookingSearch}
                    onChange={(event) => setBookingSearch(event.target.value)}
                    placeholder="Name, phone, email, reference, service, notes…"
                  />
                </label>
                <label>
                  Status
                  <AdminDropdown
                    ariaLabel="Filter by status"
                    value={bookingStatusFilter}
                    onChange={setBookingStatusFilter}
                    options={STATUS_FILTER_OPTIONS}
                  />
                </label>
                <label>
                  Month
                  <AdminDropdown
                    ariaLabel="Filter by month"
                    value={bookingMonthFilter}
                    onChange={setBookingMonthFilter}
                    options={monthDropdownOptions}
                  />
                </label>
                <label>
                  From
                  <input
                    type="date"
                    value={bookingDateFrom}
                    onChange={(event) => setBookingDateFrom(event.target.value)}
                  />
                </label>
                <label>
                  To
                  <input
                    type="date"
                    value={bookingDateTo}
                    onChange={(event) => setBookingDateTo(event.target.value)}
                  />
                </label>
                <label>
                  Sort by
                  <AdminDropdown
                    ariaLabel="Sort bookings"
                    value={bookingSort}
                    onChange={(val) => setBookingSort(val as BookingSort)}
                    options={BOOKING_SORT_OPTIONS}
                  />
                </label>
                <button
                  type="button"
                  className="admin-clear-filters"
                  onClick={clearBookingFilters}
                >
                  Clear filters
                </button>
              </div>
              {loadingDashboard ? (
                <p className="admin-loading">Loading appointments…</p>
              ) : bookings.length === 0 ? (
                <p className="admin-empty">
                  No appointments yet. New requests will appear here.
                </p>
              ) : visibleBookings.length === 0 ? (
                <p className="admin-empty">
                  No bookings match these filters. Try changing or clearing the filters.
                </p>
              ) : (
                <div className="admin-bookings-scroll">
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Service</th>
                        <th>Date & time</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <strong>{booking.name}</strong>
                            <small>
                              {booking.reference ? `Ref: ${booking.reference} · ` : ""}
                              {booking.phone}
                              {booking.email ? ` · ${booking.email}` : ""}
                            </small>
                          </td>
                          <td>
                            {booking.service_name || booking.serviceName || "—"}
                            {booking.notes && <small>Note: {booking.notes}</small>}
                          </td>
                          <td>
                            {String(booking.booking_date || booking.date || "—").slice(0, 10)}
                            <small>{booking.booking_time || booking.time || ""}</small>
                          </td>
                          <td>
                            ₹
                            {Number(
                              booking.bill_amount ?? booking.billAmount ?? 0
                            ).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <span
                              className={`booking-status status-${booking.status.toLowerCase()}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            <AdminDropdown
                              compact
                              ariaLabel={`Update status for ${booking.name}`}
                              value={booking.status}
                              onChange={(val) =>
                                void updateStatus(booking, val as BookingStatus)
                              }
                              options={BOOKING_STATUS_OPTIONS}
                            />
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
    </div>
  );
}
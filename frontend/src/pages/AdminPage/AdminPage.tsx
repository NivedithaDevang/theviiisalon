import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { Header } from "../../components/Header/Header";
import "./AdminPage.css";
import { Footer } from "../../components/Footer/Footer";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type BookingSort =
  | "date_latest"
  | "date_earliest"
  | "created_latest"
  | "created_earliest"
  | "amount_high"
  | "amount_low"
  | "client_az";
type ServiceSort =
  | "name_az"
  | "name_za"
  | "category_az"
  | "price_high"
  | "price_low"
  | "duration_short"
  | "duration_long";

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

const SERVICE_SORT_OPTIONS: DropdownOption[] = [
  { value: "name_az", label: "Name: A to Z" },
  { value: "name_za", label: "Name: Z to A" },
  { value: "category_az", label: "Category: A to Z" },
  { value: "price_high", label: "Price: high to low" },
  { value: "price_low", label: "Price: low to high" },
  { value: "duration_short", label: "Duration: shortest first" },
  { value: "duration_long", label: "Duration: longest first" },
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

interface AdminService {
  id: number;
  category_id: number;
  category: string;
  name: string;
  price: number;
  duration: number;
  description?: string | null;
  is_active: boolean | number;
}

interface ServiceCategory {
  id: number;
  name: string;
}

interface ServiceForm {
  categoryId: string;
  name: string;
  price: string;
  duration: string;
  description: string;
}

const emptyServiceForm: ServiceForm = {
  categoryId: "",
  name: "",
  price: "",
  duration: "45",
  description: "",
};

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
  const [email, setEmail] = useState("theviiisalon88@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loginChallenge, setLoginChallenge] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stats, setStats] = useState(emptyStats);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeModule, setActiveModule] = useState<"bookings" | "services">("bookings");
  const [services, setServices] = useState<AdminService[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("ALL");
  const [serviceSort, setServiceSort] = useState<ServiceSort>("name_az");
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

  const loadServices = async () => {
    setLoadingServices(true);
    setServiceError("");
    try {
      const [serviceResponse, categoryResponse] = await Promise.all([
        api.get("/services/admin/all"),
        api.get("/services/categories"),
      ]);
      const activeOnly = (serviceResponse.data?.data || []).filter((item: AdminService) =>
        Boolean(item.is_active)
      );
      setServices(activeOnly);
      setServiceCategories(categoryResponse.data?.data || []);
    } catch (requestError) {
      setServiceError(requestMessage(requestError));
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem("adminToken");
  }, []);

  useEffect(() => {
    if (user) {
      void loadDashboard();
      void loadServices();
    }
  }, [user]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const challengeToken = data?.data?.challengeToken;
      if (!challengeToken) {
        throw new Error("The server did not start the admin verification step.");
      }
      setLoginChallenge(challengeToken);
      setChallengeError("");
      setPassword("");
      setSecretKey("");
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const verifySecretKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setChallengeError("");
    try {
      const { data } = await api.post("/auth/verify-secret-key", {
        challengeToken: loginChallenge,
        secretKey,
      });
      const token = data?.data?.token;
      const admin = data?.data?.admin as AdminUser | undefined;
      if (!token || !admin || admin.role !== "ADMIN") {
        throw new Error("The server returned an invalid admin login response.");
      }
      localStorage.setItem("adminToken", token);
      setUser(admin);
      setLoginChallenge("");
      setSecretKey("");
    } catch (requestError) {
      setChallengeError(requestMessage(requestError));
      setSecretKey("");
    } finally {
      setBusy(false);
    }
  };

  const cancelSecretVerification = () => {
    setLoginChallenge("");
    setSecretKey("");
    setChallengeError("");
  };

  const openServiceForm = (service?: AdminService) => {
    setEditingServiceId(service?.id ?? null);
    setServiceForm(
      service
        ? {
            categoryId: String(service.category_id),
            name: service.name,
            price: String(service.price),
            duration: String(service.duration),
            description: service.description || "",
          }
        : {
            ...emptyServiceForm,
            categoryId: String(serviceCategories[0]?.id || ""),
          }
    );
    setServiceError("");
    setServiceFormOpen(true);
  };

  const saveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingService(true);
    setServiceError("");
    const payload = {
      categoryId: Number(serviceForm.categoryId),
      name: serviceForm.name.trim(),
      price: Number(serviceForm.price),
      duration: Number(serviceForm.duration),
      description: serviceForm.description.trim(),
      isActive: true,
    };

    try {
      if (editingServiceId === null) {
        await api.post("/services", payload);
      } else {
        await api.patch(`/services/${editingServiceId}`, payload);
      }
      setServiceFormOpen(false);
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm);
      await loadServices();
    } catch (requestError) {
      setServiceError(requestMessage(requestError));
    } finally {
      setSavingService(false);
    }
  };

  const removeService = async (service: AdminService) => {
    if (
      !window.confirm(
        `Permanently delete "${service.name}"? Existing booking history will be retained. This cannot be undone.`
      )
    )
      return;
    setServiceError("");
    try {
      await api.delete(`/services/${service.id}`);
      await loadServices();
    } catch (requestError) {
      setServiceError(requestMessage(requestError));
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

  const logout = () => {
    setError("");
    localStorage.removeItem("adminToken");
    setUser(null);
    setActiveModule("bookings");
    setPassword("");
    setSecretKey("");
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

  const visibleServices = useMemo(() => {
    const filtered = services.filter(
      (service) =>
        serviceCategoryFilter === "ALL" || service.category_id === Number(serviceCategoryFilter)
    );

    return filtered.sort((a, b) => {
      switch (serviceSort) {
        case "name_za":
          return b.name.localeCompare(a.name);
        case "category_az":
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case "price_high":
          return Number(b.price) - Number(a.price);
        case "price_low":
          return Number(a.price) - Number(b.price);
        case "duration_short":
          return Number(a.duration) - Number(b.duration);
        case "duration_long":
          return Number(b.duration) - Number(a.duration);
        case "name_az":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [services, serviceCategoryFilter, serviceSort]);

  const clearServiceFilters = () => {
    setServiceCategoryFilter("ALL");
    setServiceSort("name_az");
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
            <button type="button" className="admin-logout" onClick={logout}>
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

        {!user ? (
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
                <span className="admin-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              <button type="submit" className="btn-luxury-primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <nav className="admin-module-tabs" aria-label="Admin modules">
              <button
                type="button"
                className={activeModule === "bookings" ? "is-active" : ""}
                aria-current={activeModule === "bookings" ? "page" : undefined}
                onClick={() => setActiveModule("bookings")}
              >
                Appointments
              </button>
              <button
                type="button"
                className={activeModule === "services" ? "is-active" : ""}
                aria-current={activeModule === "services" ? "page" : undefined}
                onClick={() => setActiveModule("services")}
              >
                Manage services
              </button>
            </nav>
            {activeModule === "bookings" ? (
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
            ) : (
              <section className="admin-services-panel">
                <div className="admin-bookings-heading">
                  <div>
                    <span className="admin-kicker">SERVICE MENU</span>
                    <h2>
                      Manage services ({visibleServices.length} of {services.length})
                    </h2>
                  </div>
                  <div className="admin-service-actions">
                    <button
                      type="button"
                      className="admin-refresh"
                      onClick={() => void loadServices()}
                      disabled={loadingServices}
                    >
                      <RefreshCw size={15} /> Refresh
                    </button>
                    <button
                      type="button"
                      className="admin-add-service"
                      onClick={() => openServiceForm()}
                    >
                      <Plus size={15} /> Add service
                    </button>
                  </div>
                </div>

                {serviceError && (
                  <p className="admin-message admin-error" role="alert">
                    {serviceError}
                  </p>
                )}
                <div className="admin-service-filters">
                  <label>
                    Category
                    <AdminDropdown
                      ariaLabel="Filter services by category"
                      value={serviceCategoryFilter}
                      onChange={setServiceCategoryFilter}
                      options={[
                        { value: "ALL", label: "All categories" },
                        ...serviceCategories.map((category) => ({
                          value: String(category.id),
                          label: category.name,
                        })),
                      ]}
                    />
                  </label>
                  <label>
                    Sort by
                    <AdminDropdown
                      ariaLabel="Sort services"
                      value={serviceSort}
                      onChange={(value) => setServiceSort(value as ServiceSort)}
                      options={SERVICE_SORT_OPTIONS}
                    />
                  </label>
                  <button
                    type="button"
                    className="admin-clear-filters"
                    onClick={clearServiceFilters}
                  >
                    Clear filters
                  </button>
                </div>
                {loadingServices ? (
                  <p className="admin-loading">Loading services…</p>
                ) : services.length === 0 ? (
                  <p className="admin-empty">No services found.</p>
                ) : visibleServices.length === 0 ? (
                  <p className="admin-empty">No services match this category.</p>
                ) : (
                  <div className="admin-bookings-scroll">
                    <table className="admin-bookings-table admin-services-table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Duration</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleServices.map((service) => (
                          <tr key={service.id}>
                            <td>
                              <strong>{service.name}</strong>
                              {service.description && <small>{service.description}</small>}
                            </td>
                            <td>{service.category}</td>
                            <td>₹{Number(service.price).toLocaleString("en-IN")}</td>
                            <td>{service.duration} min</td>
                            <td>
                              <div className="admin-service-row-actions">
                                <button
                                  type="button"
                                  className="admin-service-edit"
                                  onClick={() => openServiceForm(service)}
                                  aria-label={`Edit ${service.name}`}
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-service-remove"
                                  onClick={() => void removeService(service)}
                                  aria-label={`Permanently delete ${service.name}`}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {serviceFormOpen && (
                  <div className="admin-service-form-overlay">
                    <section
                      className="admin-service-form-card"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="admin-service-form-title"
                    >
                      <div className="admin-service-form-heading">
                        <h3 id="admin-service-form-title">
                          {editingServiceId === null ? "Add a service" : "Edit service"}
                        </h3>
                        <button
                          type="button"
                          className="admin-service-form-close"
                          onClick={() => setServiceFormOpen(false)}
                          aria-label="Close service form"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {serviceError && (
                        <p className="admin-message admin-error" role="alert">
                          {serviceError}
                        </p>
                      )}
                      <form onSubmit={saveService} className="admin-service-form">
                        <label>
                          Service name
                          <input
                            type="text"
                            value={serviceForm.name}
                            onChange={(event) =>
                              setServiceForm({ ...serviceForm, name: event.target.value })
                            }
                            maxLength={180}
                            required
                          />
                        </label>
                        <label>
                          Category
                          <AdminDropdown
                            ariaLabel="Select service category"
                            value={serviceForm.categoryId}
                            onChange={(categoryId) =>
                              setServiceForm({ ...serviceForm, categoryId })
                            }
                            options={[
                              { value: "", label: "Select a category" },
                              ...serviceCategories.map((category) => ({
                                value: String(category.id),
                                label: category.name,
                              })),
                            ]}
                          />
                        </label>
                        <div className="admin-service-form-row">
                          <label>
                            Price (₹)
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={serviceForm.price}
                              onChange={(event) =>
                                setServiceForm({ ...serviceForm, price: event.target.value })
                              }
                              required
                            />
                          </label>
                          <label>
                            Duration (minutes)
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={serviceForm.duration}
                              onChange={(event) =>
                                setServiceForm({ ...serviceForm, duration: event.target.value })
                              }
                              required
                            />
                          </label>
                        </div>
                        <label>
                          Description
                          <textarea
                            rows={3}
                            value={serviceForm.description}
                            onChange={(event) =>
                              setServiceForm({ ...serviceForm, description: event.target.value })
                            }
                          />
                        </label>
                        <div className="admin-service-form-actions">
                          <button
                            type="button"
                            className="admin-secret-cancel"
                            onClick={() => setServiceFormOpen(false)}
                            disabled={savingService}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-luxury-primary"
                            disabled={savingService || serviceCategories.length === 0}
                          >
                            {savingService
                              ? "Saving…"
                              : editingServiceId === null
                                ? "Add service"
                                : "Save changes"}
                          </button>
                        </div>
                      </form>
                    </section>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        {loginChallenge && !user && (
          <div className="admin-secret-overlay">
            <section
              className="admin-secret-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-secret-title"
            >
              <h2 id="admin-secret-title">Verify admin secret key</h2>
              <p>Enter your secret key to continue to the salon dashboard.</p>
              {challengeError && (
                <p className="admin-message admin-error" role="alert">
                  {challengeError}
                </p>
              )}
              <form onSubmit={verifySecretKey} className="admin-login-form">
                <label>
                  Admin secret key
                  <span className="admin-password-field">
                    <input
                      type={showSecretKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(event) => setSecretKey(event.target.value)}
                      required
                      autoComplete="off"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="admin-password-toggle"
                      aria-label={showSecretKey ? "Hide secret key" : "Show secret key"}
                      aria-pressed={showSecretKey}
                      onClick={() => setShowSecretKey((visible) => !visible)}
                    >
                      {showSecretKey ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
                <button type="submit" className="btn-luxury-primary" disabled={busy}>
                  {busy ? "Verifying…" : "Verify and continue"}
                </button>
                <button
                  type="button"
                  className="admin-secret-cancel"
                  onClick={cancelSecretVerification}
                  disabled={busy}
                >
                  Cancel
                </button>
              </form>
            </section>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
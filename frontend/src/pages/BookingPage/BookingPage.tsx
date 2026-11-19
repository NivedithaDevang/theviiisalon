import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { catalogServiceOptions } from "../../utils/servicesData";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import "./BookingPage.css";

interface ServiceOption {
  id: number;
  name: string;
  price: number;
  category?: string;
  subcategory?: string;
}

interface BookingResponse {
  reference: string;
  emailDelivery?: {
    client: "SENT" | "FAILED" | "NOT_PROVIDED";
    admin: "SENT" | "FAILED";
  };
}

interface BookingSummary {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes: string;
  services: ServiceOption[];
  totalAmount: number;
}

const SERVICE_SECTIONS = [
  "Hair",
  "Skin & Beauty",
  "Women's Grooming",
  "Men's Grooming",
  "Nails",
] as const;

type ServiceSection = (typeof SERVICE_SECTIONS)[number];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function resolveSection(service: ServiceOption): ServiceSection {
  const rawCategory = (service.category || "").toLowerCase();
  const name = service.name.toLowerCase();

  if (rawCategory.includes("women")) return "Women's Grooming";
  if (
    rawCategory.includes("men") ||
    name.includes("men's") ||
    name.includes("beard") ||
    name.includes("head massage")
  ) {
    return "Men's Grooming";
  }
  if (
    rawCategory.includes("nail") ||
    name.includes("nail") ||
    name.includes("manicure") ||
    name.includes("pedicure") ||
    name.includes("cuticle")
  ) {
    return "Nails";
  }
  if (
    rawCategory.includes("skin") ||
    rawCategory.includes("beauty") ||
    name.includes("facial") ||
    name.includes("cleanup") ||
    name.includes("bleach") ||
    name.includes("polishing") ||
    name.includes("threading") ||
    name.includes("wax") ||
    name.includes("de-tan")
  ) {
    return "Skin & Beauty";
  }
  return "Hair";
}

function formatDisplayTime(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${mStr} ${suffix}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "We couldn't complete that request. Please try again.";
  }
  return "We couldn't complete that request. Please try again.";
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedSection, setSelectedSection] = useState<ServiceSection | "">("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [openDropdown, setOpenDropdown] = useState<"category" | "service" | null>(null);

  // Form fields
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  // Modal states
  const [reviewSummary, setReviewSummary] = useState<BookingSummary | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    reference: string;
    summary: BookingSummary;
    emailDelivery?: BookingResponse["emailDelivery"];
  } | null>(null);

  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categoryRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        categoryRef.current &&
        !categoryRef.current.contains(target) &&
        serviceRef.current &&
        !serviceRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;

    const applyPreselection = (list: ServiceOption[]) => {
      const requestedService = searchParams.get("service");
      if (!requestedService) return;

      const matching =
        list.find((s) => String(s.id) === requestedService) ||
        list.find((s) => s.name.toLowerCase() === requestedService.toLowerCase());

      if (matching) {
        setSelectedSection(resolveSection(matching));
        setSelectedServiceIds([matching.id]);
      }
    };

    api
      .get("/services")
      .then(({ data }) => {
        const list: ServiceOption[] = Array.isArray(data) ? data : data?.data || [];
        if (!active) return;
        setServices(list);
        applyPreselection(list);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setServices(catalogServiceOptions);
        applyPreselection(catalogServiceOptions);
        setServiceError(`${getErrorMessage(requestError)} Showing the published salon menu.`);
      })
      .finally(() => {
        if (active) setLoadingServices(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const servicesBySection = useMemo(() => {
    const grouped: Record<ServiceSection, ServiceOption[]> = {
      Hair: [],
      "Skin & Beauty": [],
      "Women's Grooming": [],
      "Men's Grooming": [],
      Nails: [],
    };

    for (const service of services) {
      grouped[resolveSection(service)].push(service);
    }
    return grouped;
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!selectedSection) return [];
    return servicesBySection[selectedSection] || [];
  }, [selectedSection, servicesBySection]);

  const groupedSubcategories = useMemo(() => {
    const hasSubcategories = filteredServices.some((s) => Boolean(s.subcategory));
    if (!hasSubcategories) return null;

    return filteredServices.reduce<Record<string, ServiceOption[]>>((acc, item) => {
      const key = item.subcategory || "Other Services";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filteredServices]);

  const selectedServicesList = useMemo(
    () =>
      selectedServiceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is ServiceOption => Boolean(s)),
    [services, selectedServiceIds]
  );

  const totalEstimatedPrice = useMemo(
    () => selectedServicesList.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedServicesList]
  );

  const handleSelectCategory = (section: ServiceSection) => {
    setSelectedSection(section);
    setOpenDropdown("service");
  };

  const handleToggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRemoveService = (id: number) => {
    setSelectedServiceIds((prev) => prev.filter((item) => item !== id));
  };

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
    if (value && (value < "11:00" || value > "20:30")) {
      setError("Salon appointments are available strictly between 11:00 AM and 8:30 PM.");
    } else {
      setError("");
    }
  };

  // Opens Review Modal instead of submitting immediately
  const handleOpenReviewModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = clientName.trim();
    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      return;
    }

    if (selectedServicesList.length === 0) {
      setError("Choose at least one service before requesting an appointment.");
      return;
    }

    if (!selectedDate) {
      setError("Please choose your preferred appointment date.");
      return;
    }

    if (!selectedTime || selectedTime < "11:00" || selectedTime > "20:30") {
      setError("Please choose an appointment time strictly between 11:00 AM and 8:30 PM.");
      return;
    }

    setReviewSummary({
      name: trimmedName,
      phone,
      email: trimmedEmail,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim(),
      services: selectedServicesList,
      totalAmount: totalEstimatedPrice,
    });
  };

  // Submits booking and switches to Confirmed Modal
  const handleConfirmBooking = async () => {
    if (!reviewSummary) return;

    const primaryService = reviewSummary.services[0];
    const combinedServiceNames = reviewSummary.services.map((s) => s.name).join(", ");

    try {
      setSubmitting(true);
      setError("");
      const { data } = await api.post<{ data: BookingResponse }>("/bookings", {
        name: reviewSummary.name,
        phone: reviewSummary.phone,
        email: reviewSummary.email,
        serviceId: primaryService.id,
        serviceName: combinedServiceNames,
        price: reviewSummary.totalAmount,
        services: reviewSummary.services.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          category: resolveSection(s),
        })),
        date: reviewSummary.date,
        time: reviewSummary.time,
        notes: reviewSummary.notes,
      });

      setConfirmedReceipt({
        reference: data.data.reference,
        summary: reviewSummary,
        emailDelivery: data.data.emailDelivery,
      });
      setReviewSummary(null);

      // Reset form behind modal
      setClientName("");
      setPhone("");
      setEmail("");
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
      setSelectedSection("");
      setSelectedServiceIds([]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setReviewSummary(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAndGoHome = () => {
    setConfirmedReceipt(null);
    navigate("/");
  };

  return (
    <div>
      <Header />
      <section className="booking-page">
        <header className="booking-heading">
          <span className="luxury-tag">
            <CalendarDays size={14} /> YOUR MOMENT STARTS HERE
          </span>
          <h1>
            Make time for <em>yourself.</em>
          </h1>
          <p>Tell us what you have in mind. We’ll confirm your appointment directly with you.</p>
        </header>

        <form className="booking-page-form" onSubmit={handleOpenReviewModal} noValidate>
          <label>
            Your name *
            <input
              name="name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              maxLength={100}
            />
          </label>

          <label>
            Phone number *
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="9876543210 (10 digits)"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              pattern="[0-9]{10}"
              minLength={10}
              maxLength={10}
              required
            />
          </label>

          <label>
            Email address *
            <small>Please enter correct email to receive booking confirmation mail</small>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </label>

          {/* STEP 1: CATEGORY */}
          <div className="booking-field" ref={categoryRef}>
            <span className="booking-field-label">Service category *</span>
            <div className={`luxury-select ${openDropdown === "category" ? "is-open" : ""}`}>
              <button
                type="button"
                className="luxury-select-trigger"
                disabled={loadingServices || services.length === 0}
                onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
              >
                <span className={selectedSection ? "has-value" : "placeholder"}>
                  {loadingServices
                    ? "Loading categories…"
                    : selectedSection
                    ? `${selectedSection} (${servicesBySection[selectedSection].length})`
                    : "Choose a category"}
                </span>
                <ChevronDown size={16} className="luxury-select-chevron" />
              </button>

              {openDropdown === "category" && (
                <div className="luxury-select-menu" role="listbox">
                  {SERVICE_SECTIONS.map((section) => {
                    const count = servicesBySection[section]?.length || 0;
                    const isSelected = selectedSection === section;
                    return (
                      <button
                        type="button"
                        key={section}
                        disabled={count === 0}
                        className={`luxury-select-option ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectCategory(section)}
                      >
                        <span>{section}</span>
                        <span className="luxury-option-meta">
                          <small>{count} services</small>
                          {isSelected && <Check size={14} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: MULTI-SERVICE SELECT */}
          <div className="booking-field booking-service-select" ref={serviceRef}>
            <div className="booking-label-row">
              <span className="booking-field-label">Select services * (choose one or more)</span>
              {selectedServicesList.length > 0 && (
                <button
                  type="button"
                  className="booking-clear-btn"
                  onClick={() => setSelectedServiceIds([])}
                >
                  Clear all ({selectedServicesList.length})
                </button>
              )}
            </div>

            <div className={`luxury-select ${openDropdown === "service" ? "is-open" : ""}`}>
              <button
                type="button"
                className="luxury-select-trigger"
                disabled={!selectedSection || filteredServices.length === 0}
                onClick={() => setOpenDropdown(openDropdown === "service" ? null : "service")}
              >
                <span className={selectedServicesList.length > 0 ? "has-value" : "placeholder"}>
                  {!selectedSection
                    ? "Select a category first"
                    : selectedServicesList.length === 0
                    ? `Add services from ${selectedSection}`
                    : `${selectedServicesList.length} service${
                        selectedServicesList.length > 1 ? "s" : ""
                      } selected — click to add or change`}
                </span>
                <ChevronDown size={16} className="luxury-select-chevron" />
              </button>

              {openDropdown === "service" && (
                <div
                  className="luxury-select-menu luxury-select-menu--tall"
                  role="listbox"
                  aria-multiselectable="true"
                >
                  {groupedSubcategories
                    ? Object.entries(groupedSubcategories).map(([subcat, items]) => (
                        <div className="luxury-select-group" key={subcat}>
                          <div className="luxury-select-group-title">{subcat}</div>
                          {items.map((service) => {
                            const isSelected = selectedServiceIds.includes(service.id);
                            return (
                              <button
                                type="button"
                                key={service.id}
                                aria-selected={isSelected}
                                className={`luxury-select-option ${isSelected ? "is-selected" : ""}`}
                                onClick={() => handleToggleService(service.id)}
                              >
                                <span className="luxury-option-left">
                                  <span
                                    className={`luxury-checkbox ${isSelected ? "is-checked" : ""}`}
                                  >
                                    {isSelected && <Check size={12} />}
                                  </span>
                                  <span className="luxury-option-name">{service.name}</span>
                                </span>
                                <span className="luxury-option-price">
                                  ₹{Number(service.price).toLocaleString("en-IN")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    : filteredServices.map((service) => {
                        const isSelected = selectedServiceIds.includes(service.id);
                        return (
                          <button
                            type="button"
                            key={service.id}
                            aria-selected={isSelected}
                            className={`luxury-select-option ${isSelected ? "is-selected" : ""}`}
                            onClick={() => handleToggleService(service.id)}
                          >
                            <span className="luxury-option-left">
                              <span className={`luxury-checkbox ${isSelected ? "is-checked" : ""}`}>
                                {isSelected && <Check size={12} />}
                              </span>
                              <span className="luxury-option-name">{service.name}</span>
                            </span>
                            <span className="luxury-option-price">
                              ₹{Number(service.price).toLocaleString("en-IN")}
                            </span>
                          </button>
                        );
                      })}

                  <div className="luxury-select-footer">
                    <span>Switch category anytime to add services from other sections</span>
                    <button
                      type="button"
                      className="luxury-select-done"
                      onClick={() => setOpenDropdown(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedServicesList.length > 0 && (
              <div className="selected-services-box">
                <div className="selected-services-chips">
                  {selectedServicesList.map((item) => (
                    <span className="selected-service-chip" key={item.id}>
                      <span className="chip-title">{item.name}</span>
                      <span className="chip-price">
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </span>
                      <button
                        type="button"
                        className="chip-remove"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => handleRemoveService(item.id)}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="selected-services-total">
                  <span>
                    Estimated total ({selectedServicesList.length}{" "}
                    {selectedServicesList.length === 1 ? "service" : "services"})
                  </span>
                  <strong>₹{totalEstimatedPrice.toLocaleString("en-IN")}</strong>
                </div>
              </div>
            )}
          </div>

          {serviceError && (
            <p className="booking-form-notice" role="status">
              {serviceError}
            </p>
          )}

          <label>
            Preferred date *
            <input
              name="date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </label>

          <label>
            Preferred time * (11:00 AM – 8:30 PM)
            <input
              name="time"
              type="time"
              min="11:00"
              max="20:30"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              required
            />
          </label>

          <label className="booking-notes">
            Anything we should know?
            <textarea
              name="notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share a preference or a note for our team."
            />
          </label>

          {error && (
            <p className="booking-form-message" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn-luxury-primary booking-submit"
            type="submit"
            disabled={submitting || loadingServices || services.length === 0}
          >
            Request appointment <ArrowRight size={16} />
          </button>

          <p className="booking-disclaimer">
            Payment is completed at the salon after your appointment.
          </p>
        </form>
      </section>

      {/* POPUP MODAL 1: REVIEW & CONFIRM DETAILS */}
      {reviewSummary && (
        <div
          className="bp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div className="bp-modal-card">
            <div className="bp-modal-header">
              <div>
                <span className="bp-modal-tag">REVIEW BOOKING</span>
                <h2 id="review-modal-title">Confirm Your Details</h2>
              </div>
              <button
                type="button"
                className="bp-modal-x"
                aria-label="Close"
                disabled={submitting}
                onClick={() => setReviewSummary(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="bp-modal-grid">
              <div>
                <small>CLIENT NAME</small>
                <strong>{reviewSummary.name}</strong>
              </div>
              <div>
                <small>PHONE NUMBER</small>
                <strong>+91 {reviewSummary.phone}</strong>
              </div>
              <div>
                <small>EMAIL ADDRESS</small>
                <strong>{reviewSummary.email || "Not provided"}</strong>
              </div>
              <div>
                <small>DATE & TIME</small>
                <strong>
                  {reviewSummary.date} at {formatDisplayTime(reviewSummary.time)}
                </strong>
              </div>
            </div>

            <div className="bp-modal-services">
              <small className="bp-section-lbl">
                SELECTED SERVICES ({reviewSummary.services.length})
              </small>
              <ul>
                {reviewSummary.services.map((srv) => (
                  <li key={srv.id}>
                    <span>{srv.name}</span>
                    <strong>₹{Number(srv.price).toLocaleString("en-IN")}</strong>
                  </li>
                ))}
              </ul>
              <div className="bp-modal-total">
                <span>Total Amount</span>
                <strong>₹{reviewSummary.totalAmount.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="bp-pay-banner">
              You have to complete the payment at the salon after your service.
            </div>

            <div className="bp-modal-footer">
              <button
                type="button"
                className="bp-btn-secondary"
                disabled={submitting}
                onClick={() => setReviewSummary(null)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-luxury-primary bp-btn-primary"
                disabled={submitting}
                onClick={handleConfirmBooking}
              >
                {submitting ? "Booking…" : "Confirm Booking"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: BOOKING CONFIRMED RECEIPT */}
      {confirmedReceipt && (
        <div
          className="bp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmed-modal-title"
        >
          <div className="bp-modal-card bp-modal-card--centered">
            <button
              type="button"
              className="bp-modal-x bp-modal-x--float"
              aria-label="Close and return home"
              onClick={handleCloseAndGoHome}
            >
              <X size={18} />
            </button>

            <CheckCircle2 size={44} className="bp-success-icon" />
            <span className="bp-modal-tag">REQUEST RECEIVED</span>
            <h2 id="confirmed-modal-title" className="bp-success-title">
              Your moment is <em>on its way.</em>
            </h2>
            <p className="bp-success-text">
              {confirmedReceipt.emailDelivery?.client === "SENT" &&
              confirmedReceipt.emailDelivery.admin === "SENT"
                ? "Your appointment request is saved. Confirmation details have been emailed to you and the salon desk will contact you shortly to confirm your slot."
                : confirmedReceipt.emailDelivery?.client === "SENT" &&
                  confirmedReceipt.emailDelivery.admin === "FAILED"
                ? "Your appointment request is saved and a confirmation was emailed to you, but the salon email alert failed. Please call the salon if you need immediate confirmation."
                : confirmedReceipt.emailDelivery?.client === "SENT"
                ? "Your appointment request is saved and a confirmation was emailed to you. Our salon desk will contact you shortly to confirm your slot."
                : confirmedReceipt.emailDelivery?.client === "FAILED" ||
                  confirmedReceipt.emailDelivery?.admin === "FAILED"
                ? "Your appointment request is saved and visible to the salon. We couldn't send one or more email notifications; please contact the salon if you need immediate confirmation."
                : "Your appointment request is saved. Our salon desk will contact you shortly to confirm your slot. Add an email address next time to receive a copy of the booking details."}
            </p>

            <div className="bp-ref-box">
              <small>YOUR REFERENCE</small>
              <strong>{confirmedReceipt.reference}</strong>
            </div>

            <div className="bp-pay-banner">
              <strong>Note:</strong> You have to complete your payment directly at the salon at
              the time of your visit.
            </div>

            <button
              type="button"
              className="btn-luxury-primary bp-btn-full"
              onClick={handleCloseAndGoHome}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
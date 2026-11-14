import { FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { catalogServiceOptions } from "../utils/servicesData";

interface ServiceOption {
  id: number;
  name: string;
  price: number;
  category?: string;
}

interface BookingResponse {
  reference: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "We couldn't complete that request. Please try again.";
  }
  return "We couldn't complete that request. Please try again.";
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/services")
      .then(({ data }) => {
        const list: ServiceOption[] = Array.isArray(data) ? data : data?.data || [];
        if (!active) return;
        setServices(list);
        const requestedService = searchParams.get("service");
        const matching = list.find((service) => String(service.id) === requestedService)
          || list.find((service) => service.name.toLowerCase() === requestedService?.toLowerCase());
        setServiceId(matching ? String(matching.id) : "");
      })
      .catch((requestError: unknown) => {
        if (active) {
          setServices(catalogServiceOptions);
          const requestedService = searchParams.get("service");
          const matchingService = catalogServiceOptions.find((service) =>
            String(service.id) === requestedService
            || service.name.toLowerCase() === requestedService?.toLowerCase()
          );
          setServiceId(matchingService ? String(matchingService.id) : "");
          setServiceError(`${getErrorMessage(requestError)} Showing the published salon menu.`);
        }
      })
      .finally(() => {
        if (active) setLoadingServices(false);
      });
    return () => { active = false; };
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    const formData = new FormData(form);
    const selectedService = services.find((service) => String(service.id) === serviceId);
    if (!selectedService) {
      setError("Choose a service before requesting an appointment.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post<{ data: BookingResponse }>("/bookings", {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: formData.get("date"),
        time: formData.get("time"),
        notes: formData.get("notes"),
      });
      setReference(data.data.reference);
      form.reset();
      setServiceId("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (reference) {
    return (
      <section className="booking-page">
        <div className="booking-success">
          <CheckCircle2 size={44} />
          <span className="luxury-tag">REQUEST RECEIVED</span>
          <h1>Your moment is<br /><em>on its way.</em></h1>
          <p>We’ve received your appointment request. Our salon desk will be in touch to confirm your slot.</p>
          <div className="booking-reference">
            <small>YOUR REFERENCE</small>
            <strong>{reference}</strong>
          </div>
          <a className="btn-luxury-primary" href="tel:+916362429259">Call the salon <ArrowRight size={16} /></a>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page">
      <header className="booking-heading">
        <span className="luxury-tag"><CalendarDays size={14} /> YOUR MOMENT STARTS HERE</span>
        <h1>Make time for <em>yourself.</em></h1>
        <p>Tell us what you have in mind. We’ll confirm your appointment directly with you.</p>
      </header>
      <form className="booking-page-form" onSubmit={handleSubmit}>
        <label>
          Your name *
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
        <label>
          Phone number *
          <input name="phone" type="tel" autoComplete="tel" required maxLength={20} />
        </label>
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" maxLength={255} />
        </label>
        <label>
          Select a service *
          <select
            name="serviceId"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            required
            disabled={loadingServices || services.length === 0}
          >
            <option value="">{loadingServices ? "Loading services…" : "Choose a service"}</option>
            {services.map((service) => (
              <option value={service.id} key={service.id}>
                {service.name} — ₹{Number(service.price).toLocaleString("en-IN")}
              </option>
            ))}
          </select>
        </label>
        {serviceError && <p className="booking-form-notice" role="status">{serviceError}</p>}
        <label>
          Preferred date *
          <input name="date" type="date" min={new Date().toISOString().slice(0, 10)} required />
        </label>
        <label>
          Preferred time *
          <input name="time" type="time" min="11:00" max="20:30" required />
        </label>
        <label className="booking-notes">
          Anything we should know?
          <textarea name="notes" rows={4} maxLength={1000} placeholder="Share a preference or a note for our team." />
        </label>
        {error && <p className="booking-form-message" role="alert">{error}</p>}
        <button className="btn-luxury-primary booking-submit" type="submit" disabled={submitting || loadingServices || services.length === 0}>
          {submitting ? "Sending request…" : "Request appointment"} <ArrowRight size={16} />
        </button>
        <p className="booking-disclaimer">Your preferred time is a request and will be confirmed by our salon team.</p>
      </form>
    </section>
  );
}

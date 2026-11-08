import React, { FormEvent } from "react";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";
import { allServicesFlat } from "../../utils/servicesData";
import "./Booking.css";

interface BookingProps {
  selectedService: string;
  setSelectedService: (service: string) => void;
}

export const Booking: React.FC<BookingProps> = ({
  selectedService,
  setSelectedService,
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const message = `*Booking Request - THE VIII SALON*
----------------------------------------
*Name:* ${data.get("name")}
*Phone:* ${data.get("phone")}
*Service:* ${data.get("service")}
*Date:* ${data.get("date")}
*Preferred Time:* ${data.get("time")}
----------------------------------------
Kindly confirm the appointment slot at BTM 2nd Stage.`;

    window.open(
      `https://wa.me/916362429259?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <section className="booking-section" id="booking">
      <div className="booking-card">
        <span className="luxury-tag">
          <Sparkles size={14} /> YOUR MOMENT STARTS HERE
        </span>
        <h2>
          Make Time For <span className="gold-shimmer">Yourself</span>
        </h2>
        <p className="booking-sub">
          Reserve your slot online. Instant confirmation dispatched via WhatsApp.
        </p>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Your Full Name"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Contact Number (+91)"
              required
            />
          </div>

          <div className="form-row">
            <select
              name="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
            >
              <option value="">Select a Service</option>
              {allServicesFlat.map((s, idx) => (
                <option key={`${s.name}-${idx}`} value={s.rawName}>
                  {s.name} ({s.price})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <input type="date" name="date" required />
            <input type="time" name="time" required />
          </div>

          <button className="btn-luxury-primary w-full" type="submit">
            <Calendar size={18} /> Request Appointment <ArrowRight size={18} />
          </button>

          <small className="form-footer-note">
            Your appointment will be confirmed shortly by our salon desk.
          </small>
        </form>
      </div>
    </section>
  );
};
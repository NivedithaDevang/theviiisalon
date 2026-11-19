import React from "react";
import { Phone, Mail, MapPin, Clock, ExternalLink, MessageCircle, Sparkles } from "lucide-react";
import "./Contact.css";

export const Contact: React.FC = () => {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <span className="luxury-tag">
          <Sparkles size={14} /> GET IN TOUCH
        </span>
        <h2>
          Visit Our <span className="gold-shimmer">Sanctuary</span>
        </h2>
        <p className="contact-desc">
          Drop by our studio or reach out via phone or email for bookings and consultations.
        </p>

        <div className="contact-grid">
          {/* Location */}
          <div className="contact-card">
            <div className="contact-icon">
              <MapPin size={22} />
            </div>
            <h3>Our Location</h3>
            <p className="address-text">
              <strong>The VIII | Unisex Salon</strong>
              <br />
              2nd Floor, No. 75, 100 Feet Ring Road,
              <br />
              Vysya Bank Colony, BTM Layout 2nd Stage,
              <br />
              Bengaluru, Karnataka – 560076.
            </p>
            <a
              href="https://maps.google.com/?q=No.+75+100+Feet+Ring+Road+BTM+Layout+2nd+Stage+Bengaluru"
              target="_blank"
              rel="noopener noreferrer"
              className="map-link"
            >
              Get Directions <ExternalLink size={14} />
            </a>
          </div>

          {/* Opening Hours */}
          <div className="contact-card">
            <div className="contact-icon">
              <Clock size={22} />
            </div>
            <h3>Opening Hours</h3>
            <p>
              Monday – Sunday: <strong>11:00 AM – 8:30 PM</strong>
            </p>
            <p className="contact-sub" style={{ marginTop: "0.5rem" }}>
              Walk-ins welcome & appointments available.
            </p>
          </div>

          {/* Calls */}
          <div className="contact-card">
            <div className="contact-icon">
              <Phone size={22} />
            </div>
            <h3>Direct Calls</h3>
            <a href="tel:+916362429259" className="link-item">
              +91 63624 29259
            </a>
            <a
              href="https://wa.me/916362429259?text=Hello%20THE%20VIII%20SALON%2C%20I%27d%20like%20to%20make%20an%20enquiry."
              className="whatsapp-contact-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Reach out on WhatsApp
            </a>
            <a
              href="https://www.instagram.com/theviiisalon.in?hvrq=MXRoa2ltcmdpZWZqZA=="
              className="instagram-contact-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
              </svg>
              DM us on Instagram
            </a>
            <p className="contact-sub">Available during working hours</p>
          </div>

          {/* Email */}
          <div className="contact-card">
            <div className="contact-icon">
              <Mail size={22} />
            </div>
            <h3>Email Desk</h3>
            <a href="mailto:theviiisalon88@gmail.com" className="link-item">
              theviiisalon88@gmail.com
            </a>
            <p className="contact-sub">We reply within 24 hours</p>
          </div>
        </div>
      </div>
    </section>
  );
};
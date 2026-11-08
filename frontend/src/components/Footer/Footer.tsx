import React from "react";
import { Lock, Sparkles } from "lucide-react";
import "./Footer.css";

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="footer-luxury">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-viii">VIII</span>
          <h3>THE VIII SALON</h3>
          <p className="tagline">Beauty is endless. So are you.</p>
        </div>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#booking">Book Appointment</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer-bottom">
          <p>© 2026 THE VIII SALON. All rights reserved.</p>
          <div className="footer-admin-link">
            <button
              type="button"
              className="admin-link-btn"
              onClick={onOpenAdmin}
            >
              <Lock size={12} /> Salon Owner Portal
            </button>
          </div>
          <p className="footer-loc">BTM Layout 2nd Stage, Bengaluru</p>
        </div>
      </div>
    </footer>
  );
};
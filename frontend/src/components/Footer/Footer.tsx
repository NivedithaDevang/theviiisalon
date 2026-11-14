import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import "./Footer.css";

export const Footer: React.FC = () => {
  return (
    <footer className="footer-luxury">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-viii">VIII</span>
          <h3>THE VIII SALON</h3>
          <p className="tagline">Beauty is endless. So are you.</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/#about">About</Link>
          <Link to="/services">Services</Link>
          <Link to="/booking">Book Appointment</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-bottom">
          <p>© 2026 THE VIII SALON. All rights reserved.</p>
          <div className="footer-admin-link">
            <Link to="/admin" className="admin-link-btn">
              <Lock size={12} /> Salon Owner Portal
            </Link>
          </div>
          <p className="footer-loc">BTM Layout 2nd Stage, Bengaluru</p>
        </div>
      </div>
    </footer>
  );
};
import React, { useState, useEffect } from "react";
import { Menu, X, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Header.css";

export const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${scrolled ? "scrolled" : ""}`}>
      <nav className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="logo-brand" onClick={() => setMenuOpen(false)}>
          <span className="logo-mark">VIII</span>
          <div className="logo-divider"></div>
          <div className="logo-details">
            <span className="logo-name">THE VIII</span>
            <span className="logo-tagline">UNISEX SALON • BENGALURU</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className={`nav-center-menu ${menuOpen ? "mobile-active" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>Services</Link>
          <Link to="/booking" onClick={() => setMenuOpen(false)}>Booking</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>

          {/* Mobile-only CTA in drawer */}
          <div className="mobile-cta-box">
            <Link
              to="/booking"
              className="nav-cta-btn"
              onClick={() => setMenuOpen(false)}
            >
              <Sparkles size={14} /> Book Appointment
            </Link>
          </div>
        </div>

        {/* Right CTA */}
        <div className="nav-actions">
          <Link to="/booking" className="nav-cta-btn">
            <span>Book Appointment</span>
            <ArrowUpRight size={15} className="cta-icon" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            className="menu-toggle-btn"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
    </header>
  );
};
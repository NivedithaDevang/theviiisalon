import React, { useState, useEffect } from "react";
import { Menu, X, Sparkles, ArrowUpRight } from "lucide-react";
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
        <a href="#home" className="logo-brand">
          <span className="logo-mark">VIII</span>
          <div className="logo-divider"></div>
          <div className="logo-details">
            <span className="logo-name">THE VIII</span>
            <span className="logo-tagline">UNISEX SALON • BENGALURU</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div className={`nav-center-menu ${menuOpen ? "mobile-active" : ""}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#booking" onClick={() => setMenuOpen(false)}>Booking</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>

          {/* Mobile-only CTA in drawer */}
          <div className="mobile-cta-box">
            <a
              href="#booking"
              className="nav-cta-btn"
              onClick={() => setMenuOpen(false)}
            >
              <Sparkles size={14} /> Book Appointment
            </a>
          </div>
        </div>

        {/* Right CTA */}
        <div className="nav-actions">
          <a href="#booking" className="nav-cta-btn">
            <span>Book Appointment</span>
            <ArrowUpRight size={15} className="cta-icon" />
          </a>

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
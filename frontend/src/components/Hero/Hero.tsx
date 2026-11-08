import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import "./Hero.css";

export const Hero: React.FC = () => {
  return (
    <section className="hero" id="home">
      {/* Background ambient lighting blooms */}
      <div className="ambient-bloom bloom-left"></div>
      <div className="ambient-bloom bloom-right"></div>

      <div className="hero-content">
        <span className="luxury-kicker">
          <Sparkles size={13} /> HAUTE BEAUTÉ & COIFFURE
        </span>

        <h1 className="hero-title">
          Your Beauty.<br />
          Your Identity.<br />
          <span className="gold-shimmer">Infinite Possibilities.</span>
        </h1>

        <p className="hero-subtext">
          Step into Bengaluru's sanctuary of aesthetic excellence. 
          Bespoke hair design, master styling, and restorative spa rituals 
          crafted exclusively for your individuality in BTM Layout.
        </p>

        <div className="hero-actions">
          <a href="#booking" className="btn-luxury-primary">
            Reserve an Appointment <ArrowRight size={16} />
          </a>
          <a href="#services" className="btn-luxury-ghost">
            View Rituals
          </a>
        </div>

        <div className="hero-experience-note">
          <span className="bullet-point"></span>
          <span>By appointment & bespoke consultation • BTM 2nd Stage</span>
        </div>
      </div>

      {/* Seamless Blended Salon Architecture Visual */}
      <div className="hero-visual-wrapper">
        <div className="gold-diffuse-glow"></div>
        <img
          src="/salon-interior.jpg"
          alt="THE VIII Luxury Salon Sanctuary"
          className="salon-interior-fade-img"
        />

        {/* Minimalist Floating Brand Tag */}
        <div className="emblem-card">
          <span className="emblem-viii">VIII</span>
          <div className="emblem-text">
            <strong>THE VIII SALON</strong>
            <small>EST. 2026</small>
          </div>
        </div>
      </div>
    </section>
  );
};
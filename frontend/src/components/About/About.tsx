import React from "react";
import { Sparkles, Compass } from "lucide-react";
import "./About.css";

export const About: React.FC = () => {
  return (
    <section className="about-section" id="about">
      <div className="about-bloom-left"></div>
      <div className="about-bloom-right"></div>

      <div className="about-inner">
        {/* Left Column: Focused Narrative */}
        <div className="about-story-col">
          <span className="luxury-tag">
            <Sparkles size={14} /> THE STORY OF VIII
          </span>

          <h2 className="about-headline">
            Where Infinity Meets <br />
            <span className="gold-shimmer">Endless Artistry.</span>
          </h2>

          <p className="about-lead">
            Founded by <strong>Keerthi</strong>, THE VIII SALON was inspired by a simple idea: 
            turned on its side, the numeral <strong>8</strong> becomes the eternal <strong>infinity symbol (∞)</strong>.
          </p>

          <p className="about-narrative">
            To us, it represents beauty without limits. No rigid rules, no fleeting trends—just 
            bespoke hair craft, curated skin therapies, and timeless confidence designed around you.
          </p>
        </div>

        {/* Right Column: Clean Luxury Plaque */}
        <div className="about-card-col">
          <div className="about-luxury-plaque">
            <div className="plaque-glow"></div>

            <div className="infinity-crest">
              <span className="crest-symbol">VIII</span>
              <span className="crest-infinity">∞</span>
            </div>

            <h3 className="plaque-title">Beauty Without Boundaries</h3>
            <p className="plaque-quote">
              "Your beauty is endless. Step in, unwind, and let us unveil it."
            </p>

            <div className="founder-sign-block">
              <div className="signature-line"></div>
              <span className="founder-name">Keerthi</span>
              <span className="founder-role">Founder • The VIII Salon</span>
            </div>

            <div className="plaque-footer-badge">
              <Compass size={13} />
              <span>BTM 2ND STAGE • BENGALURU</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
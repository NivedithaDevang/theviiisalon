import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Sparkles,
  Scissors,
  Sparkle,
  Crown,
  UserCheck,
  Heart,
} from "lucide-react";
import "./Services.css";

interface ServiceCategoryPreview {
  id: "hair" | "skin" | "women" | "men" | "nails";
  title: string;
  subtitle: string;
  highlights: string[];
  startingPrice: string;
  icon: React.ReactNode;
}

const categoryPreviews: ServiceCategoryPreview[] = [
  {
    id: "hair",
    title: "Hair",
    subtitle: "Precision cuts, balayage, keratin smoothening & scalp rituals",
    highlights: [
      "Haircuts & Styling",
      "Global Colour & Balayage",
      "Keratin & Hair Botox",
    ],
    startingPrice: "₹249",
    icon: <Scissors size={20} />,
  },
  {
    id: "skin",
    title: "Skin & Beauty",
    subtitle: "Signature facials, de-tan therapy, threading & waxing",
    highlights: [
      "Gold & Diamond Facials",
      "De-Tan & Face Polishing",
      "Threading & Waxing",
    ],
    startingPrice: "₹40",
    icon: <Sparkle size={20} />,
  },
  {
    id: "women",
    title: "Women's Grooming",
    subtitle: "Complete styling, party hairdos, body waxing & mani-pedi care",
    highlights: [
      "Party Hairstyles & Blow Dry",
      "Full Body Waxing & De-Tan",
      "Classic Manicure & Pedicure",
    ],
    startingPrice: "₹180",
    icon: <Crown size={20} />,
  },
  {
    id: "men",
    title: "Men's Grooming",
    subtitle: "Tailored haircuts, beard styling, hair spa & gentlemen's facials",
    highlights: [
      "Precision Haircut & Beard Styling",
      "Men's Hair Spa & Head Massage",
      "Gentleman's Facial & Cleanup",
    ],
    startingPrice: "₹199",
    icon: <UserCheck size={20} />,
  },
  {
    id: "nails",
    title: "Nails",
    subtitle: "Acrylic & gel extensions, chrome nail art & luxury nail care",
    highlights: [
      "Acrylic, Gel & Polygel Extensions",
      "Chrome, Ombre & 3D Nail Art",
      "Luxury Manicure & Pedicure",
    ],
    startingPrice: "₹149",
    icon: <Heart size={20} />,
  },
];

export default function Services() {
  return (
    <section className="home-services-section" id="services">
      <div className="home-services-container">
        {/* Header */}
        <div className="home-services-header">
          <span className="services-pill-tag">
            <Sparkles size={13} /> CURATED RITUALS
          </span>

          <h2 className="home-services-title">
            Signature Services & <span>Endless Artistry.</span>
          </h2>

          <p className="home-services-subtitle">
            Bespoke hair design, restorative skin therapies, and luxury grooming
            crafted for women and men in BTM Layout.
          </p>
        </div>

        {/* 5 Category Cards Grid */}
        <div className="home-services-grid">
          {categoryPreviews.map((cat) => (
            <Link
              to={`/services?category=${cat.id}`}
              className="home-service-card"
              key={cat.id}
            >
              <div className="card-top-row">
                <div className="service-icon-box">{cat.icon}</div>
                <span className="service-arrow-circle">
                  <ArrowUpRight size={16} />
                </span>
              </div>

              <div className="card-body">
                <h3>{cat.title}</h3>
                <p className="card-desc">{cat.subtitle}</p>

                <ul className="card-highlights">
                  {cat.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="card-footer">
                <span className="starting-label">
                  Starts at <strong>{cat.startingPrice}</strong>
                </span>
                <span className="explore-text">Explore Menu</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Main CTA Button */}
        <div className="home-services-cta">
          <Link to="/services" className="btn-explore-all-services">
            <span>Explore Full Service Menu</span>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
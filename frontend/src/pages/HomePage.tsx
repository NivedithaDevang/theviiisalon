import { ArrowRight, Clock3, MapPin, Scissors, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { About } from "../components/About/About";
import { Hero } from "../components/Hero/Hero";

const highlights = [
  {
    title: "Hair artistry",
    description: "Signature cuts, colour, styling and restorative treatments.",
    icon: Scissors,
  },
  {
    title: "Skin rituals",
    description: "Thoughtful facials and skin treatments tailored to you.",
    icon: Sparkles,
  },
  {
    title: "A moment for you",
    description: "Nails, grooming and little luxuries for every occasion.",
    icon: Clock3,
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <section className="home-discover">
        <div className="home-discover-heading">
          <span className="luxury-tag">THE VIII EXPERIENCE</span>
          <h2>Considered care.<br /><span className="gold-shimmer">Beautifully you.</span></h2>
          <p>From a fresh cut to a full reset, find your next favourite ritual at our BTM sanctuary.</p>
        </div>
        <div className="home-highlight-grid">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article className="home-highlight-card" key={title}>
              <span className="home-highlight-icon"><Icon size={20} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <Link className="home-services-link" to="/services">
          Explore all services <ArrowRight size={16} />
        </Link>
      </section>
      <section className="home-visit">
        <MapPin size={20} />
        <p>Find your moment at <strong>BTM Layout 2nd Stage, Bengaluru</strong></p>
        <Link to="/contact">Plan your visit <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}

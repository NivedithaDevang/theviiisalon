import React, { useState } from "react";
import { ArrowRight, Sparkles, Scissors, Sparkle, Crown, UserCheck, Heart } from "lucide-react";
import { servicesCatalog } from "../../utils/servicesData";
import "./Services.css";

const categoryIcons: Record<string, React.ReactNode> = {
  hair: <Scissors size={15} />,
  skin: <Sparkle size={15} />,
  women: <Crown size={15} />,
  men: <UserCheck size={15} />,
  nails: <Heart size={15} />,
};

interface ServicesProps {
  onSelectService: (serviceName: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectService }) => {
  const [activeTab, setActiveTab] = useState<string>("hair");

  const currentCategory = servicesCatalog.find((c) => c.category === activeTab);

  return (
    <section className="services-section" id="services">
      <div className="services-header">
        <span className="luxury-tag">
          <Sparkles size={14} /> CURATED MENU
        </span>
        <h2>
          Signature Services & <span className="gold-shimmer">Rituals</span>
        </h2>
        <p>
          Bespoke aesthetic therapies tailored for women and men at BTM Layout 2nd Stage.
        </p>

        {/* Category Tabs */}
        <div className="services-tabs">
          {servicesCatalog.map((cat) => (
            <button
              key={cat.category}
              className={`service-tab-btn ${activeTab === cat.category ? "active" : ""}`}
              onClick={() => setActiveTab(cat.category)}
            >
              {categoryIcons[cat.category]}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Services List Grid */}
      <div className="services-content-wrapper">
        {currentCategory?.subCategories.map((subCat) => (
          <div className="service-group" key={subCat.title}>
            <h3 className="subcat-heading">{subCat.title}</h3>

            <div className="items-card-grid">
              {subCat.items.map((item) => (
                <div className="ritual-card" key={item.id}>
                  <div className="ritual-details">
                    <span className="ritual-name">{item.name}</span>
                    <span className="ritual-price">{item.price}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-ritual-reserve"
                    onClick={() => onSelectService(item.name)}
                    title={`Reserve ${item.name}`}
                  >
                    <span>Reserve</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
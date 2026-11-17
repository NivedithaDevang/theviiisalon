import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Sparkles, ArrowUpRight, Plus } from "lucide-react";
import { api } from "../../api";
import { catalogServiceOptions } from "../../utils/servicesData";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";
import "./ServicesPage.css";

export interface ServiceItem {
  id: number;
  name: string;
  category: string;
  price: number;
  duration?: string;
  description?: string;
}

interface ServicesPageProps {
  isAdmin?: boolean;
  onReserveService?: (service: ServiceItem) => void;
}

const CATEGORIES = [
  "All",
  "Hair",
  "Skin & Beauty",
  "Women's Grooming",
  "Men's Grooming",
  "Nails",
];

const CATEGORY_QUERY_MAP: Record<string, string> = {
  hair: "Hair",
  skin: "Skin & Beauty",
  women: "Women's Grooming",
  men: "Men's Grooming",
  nails: "Nails",
};

const CATEGORY_TAGLINES: Record<string, string> = {
  Hair: "Precision cuts, dimensional colour, and restorative scalp & keratin therapies.",
  "Skin & Beauty": "Clinical-grade facials, botanical cleanups, and gentle hair removal.",
  "Women's Grooming": "Complete beauty essentials, occasion styling, and indulgent body care.",
  "Men's Grooming": "Tailored barbering, beard artistry, and revitalising skin & scalp rituals.",
  Nails: "Sculpted extensions, bespoke nail art, and signature spa manicures & pedicures.",
};

export default function ServicesPage({
  isAdmin = false,
  onReserveService,
}: ServicesPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const paramCategory = searchParams.get("category")?.toLowerCase() || "";
  const [activeCategory, setActiveCategory] = useState(
    CATEGORY_QUERY_MAP[paramCategory] || "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Hair",
    price: "",
    duration: "",
    description: "",
  });

  useEffect(() => {
    const mapped = CATEGORY_QUERY_MAP[paramCategory];
    if (mapped) setActiveCategory(mapped);
  }, [paramCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!Array.isArray(list)) throw new Error("Invalid service list.");
      setServices(list);
      setNotice("");
    } catch (err: any) {
      setServices(catalogServiceOptions);
      const message = err.response?.data?.message || "Showing our curated salon menu.";
      setNotice(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        activeCategory === "All" ||
        service.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, activeCategory, searchQuery]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce<Record<string, ServiceItem[]>>((acc, item) => {
      const cat = item.category || "Signature Rituals";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [filteredServices]);

  const openModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        category: service.category || "Hair",
        price: String(service.price),
        duration: service.duration || "",
        description: service.description || "",
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        category: activeCategory !== "All" ? activeCategory : "Hair",
        price: "",
        duration: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      duration: formData.duration.trim(),
      description: formData.description.trim(),
    };

    try {
      setSubmitting(true);
      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
      } else {
        await api.post("/services", payload);
      }
      setIsModalOpen(false);
      await fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not save service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: number, name: string) => {
    if (!window.confirm(`Remove "${name}" from the menu?`)) return;
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete service.");
    }
  };

  const handleReserveService = (service: ServiceItem) => {
    if (onReserveService) {
      onReserveService(service);
      return;
    }

    navigate(`/booking?service=${encodeURIComponent(String(service.id))}`);
  };

  return (
    <div>
      <Header />
    <section className="sp-wrapper">
      {/* Ambient Top Glow */}
      <div className="sp-ambient-glow" />

      <div className="sp-container">
        {/* Hero Header */}
        <header className="sp-hero">
          <div className="sp-badge">
            <Sparkles size={13} />
            <span>CURATED ATELIER MENU</span>
          </div>

          <h1 className="sp-title">
            Signature Services & <span>Rituals</span>
          </h1>

          <p className="sp-subtitle">
            Bespoke hair craft, restorative skin therapies, and luxury grooming tailored for
            women and men at BTM Layout 2nd Stage.
          </p>

          {isAdmin && (
            <div className="sp-admin-bar">
              <button onClick={() => openModal()} className="sp-btn-gold">
                <Plus size={16} />
                <span>Add New Ritual</span>
              </button>
            </div>
          )}
        </header>

        {/* Sticky Frosted Filter & Search Bar */}
        <div className="sp-controls-dock">
          <div className="sp-tabs" role="tablist">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(category)}
                  className={`sp-tab ${isActive ? "is-active" : ""}`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="sp-search-box">
            <Search size={15} className="sp-search-icon" />
            <input
              type="text"
              placeholder="Search rituals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="sp-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {notice && <div className="sp-notice">{notice}</div>}

        {/* Menu Content */}
        {loading ? (
          <div className="sp-empty-state">
            <div className="sp-spinner" />
            <p>Curating Salon Menu...</p>
          </div>
        ) : Object.keys(groupedServices).length === 0 ? (
          <div className="sp-empty-state">
            <p>No treatments match “{searchQuery}”.</p>
            <button
              className="sp-btn-ghost"
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="sp-sections">
            {Object.entries(groupedServices).map(([categoryName, items], sectionIdx) => (
              <div key={categoryName} className="sp-category-section">
                {/* Editorial Section Banner */}
                <div className="sp-category-header">
                  <div className="sp-category-title-row">
                    <span className="sp-roman-num">
                      0{sectionIdx + 1}
                    </span>
                    <div>
                      <h2>{categoryName}</h2>
                      {CATEGORY_TAGLINES[categoryName] && (
                        <p className="sp-category-tagline">
                          {CATEGORY_TAGLINES[categoryName]}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="sp-count-pill">
                    {items.length} {items.length === 1 ? "Ritual" : "Rituals"}
                  </span>
                </div>

                {/* Luxury Menu Cards */}
                <div className="sp-cards-grid">
                  {items.map((service) => (
                    <article key={service.id} className="sp-card">
                      <div className="sp-card-main">
                        <h3 className="sp-card-name">{service.name}</h3>
                        {service.description && (
                          <p className="sp-card-desc">{service.description}</p>
                        )}
                      </div>

                      <div className="sp-card-right">
                        <div className="sp-price-tag">
                          <span className="sp-currency">₹</span>
                          <span className="sp-amount">
                            {Math.round(Number(service.price)).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {isAdmin ? (
                          <div className="sp-admin-actions">
                            <button
                              onClick={() => openModal(service)}
                              className="sp-btn-edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteService(service.id, service.name)
                              }
                              className="sp-btn-del"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReserveService(service)}
                            className="sp-btn-reserve"
                          >
                            <span>Reserve</span>
                            <ArrowUpRight size={14} />
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {isAdmin && isModalOpen && (
        <div className="sp-modal-overlay">
          <div className="sp-modal">
            <h3>{editingService ? "Edit Ritual" : "Add New Ritual"}</h3>

            <form onSubmit={handleSaveService} className="sp-form">
              <div className="sp-field">
                <label>Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Balayage"
                />
              </div>

              <div className="sp-field-row">
                <div className="sp-field">
                  <label>Category *</label>
                  <select
                    className="salon-select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sp-field">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="3499"
                  />
                </div>
              </div>

              <div className="sp-field">
                <label>Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief note on products or benefits..."
                />
              </div>

              <div className="sp-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="sp-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="sp-btn-gold"
                >
                  {submitting
                    ? "Saving..."
                    : editingService
                    ? "Update Ritual"
                    : "Create Ritual"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
    <Footer />
    </div>
  );
}
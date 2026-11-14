import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import { catalogServiceOptions } from "../utils/servicesData";

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

export default function ServicesPage({
  isAdmin = false,
  onReserveService,
}: ServicesPageProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
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

  // Fetch all services (GET /api/services)
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      // Supports both { data: [...] } and direct array responses
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!Array.isArray(list)) throw new Error("The service list response is invalid.");
      setServices(list);
      setNotice("");
    } catch (err: any) {
      setServices(catalogServiceOptions);
      const message = err.response?.data?.message || "The live menu is unavailable.";
      setNotice(`${message} Showing the published salon menu.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filtered & Grouped Services
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

  // Open Modal for Create or Edit
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

  // Create (POST) or Update (PUT) Service
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

  // Delete Service (DELETE)
  const handleDeleteService = async (id: number, name: string) => {
    if (!window.confirm(`Remove "${name}" from the menu?`)) return;
    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete service.");
    }
  };

  return (
    <section className="services-page min-h-screen bg-[#180a0e] text-[#f5efe6] py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37] mb-3">
            Curated Menu
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[#f7f1e8] mb-4">
            Signature Services & Rituals
          </h1>
          <p className="text-sm md:text-base text-[#b8a99a] max-w-xl mx-auto">
            Bespoke aesthetic therapies tailored for women and men at BTM Layout 2nd Stage.
          </p>

          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => openModal()}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#e5c158] to-[#c59b27] text-[#180a0e] font-medium text-sm hover:opacity-90 transition cursor-pointer"
              >
                + Add New Service
              </button>
            </div>
          )}
        </div>

        {/* Category Tabs & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 border-b border-[#381d25] pb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs tracking-wider uppercase transition cursor-pointer ${
                    active
                      ? "bg-[#d4af37] text-[#180a0e] font-semibold"
                      : "bg-[#241016] text-[#c7b8a8] border border-[#3d1f28] hover:border-[#d4af37]/50"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-full bg-[#241016] border border-[#3d1f28] text-sm text-[#f5efe6] placeholder-[#8c7a6b] focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {notice && <p className="services-notice" role="status">{notice}</p>}

        {/* Content States */}
        {loading ? (
          <div className="text-center py-20 text-[#d4af37] tracking-widest text-sm uppercase">
            Loading Curated Rituals...
          </div>
        ) : Object.keys(groupedServices).length === 0 ? (
          <div className="text-center py-16 text-[#9e8e7e]">
            No services found matching your filter.
          </div>
        ) : (
          <div className="space-y-14">
            {Object.entries(groupedServices).map(([categoryName, items]) => (
              <div key={categoryName}>
                <h2 className="font-serif text-2xl text-[#e2c26b] border-b border-[#381d25] pb-3 mb-6">
                  {categoryName}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-5 rounded-2xl bg-[#210e14] border border-[#361b23] hover:border-[#d4af37]/50 transition group"
                    >
                      <div className="pr-4">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-medium text-base text-[#f7f1e8]">
                            {service.name}
                          </h3>
                          {service.duration && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2e151d] text-[#bfa992]">
                              {service.duration}
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-[#9e8e7e] mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-serif text-lg text-[#d4af37]">
                          ₹{service.price.toLocaleString("en-IN")}
                        </span>

                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(service)}
                              className="px-3 py-1.5 text-xs rounded-full border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-[#180a0e] transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteService(service.id, service.name)
                              }
                              className="px-3 py-1.5 text-xs rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onReserveService?.(service)}
                            className="px-4 py-1.5 rounded-full text-xs border border-[#d4af37]/60 text-[#e8cf88] hover:bg-[#d4af37] hover:text-[#180a0e] transition cursor-pointer"
                          >
                            Reserve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Add/Edit Modal */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#210e14] border border-[#47242f] p-6 shadow-2xl">
            <h3 className="font-serif text-2xl text-[#e2c26b] mb-5">
              {editingService ? "Edit Service" : "Add New Service"}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8a99a] mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Balayage"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#180a0e] border border-[#3d1f28] text-sm text-[#f5efe6] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#b8a99a] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#180a0e] border border-[#3d1f28] text-sm text-[#f5efe6] focus:outline-none focus:border-[#d4af37]"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#b8a99a] mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="3499"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#180a0e] border border-[#3d1f28] text-sm text-[#f5efe6] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8a99a] mb-1">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., 60 mins"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#180a0e] border border-[#3d1f28] text-sm text-[#f5efe6] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8a99a] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief details about the ritual..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#180a0e] border border-[#3d1f28] text-sm text-[#f5efe6] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs border border-[#3d1f28] text-[#b8a99a] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#e5c158] to-[#c59b27] text-[#180a0e] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? "Saving..."
                    : editingService
                    ? "Update Service"
                    : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
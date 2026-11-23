export interface FallbackService {
  id: number;
  category_id: number;
  name: string;
  price: number;
  duration: number;
  description: string | null;
  featured: boolean;
  is_active: boolean;
  category: string;
}

export const FALLBACK_SERVICES: FallbackService[] = [
  // 1. Hair
  { id: 101, category_id: 1, name: "Women's Haircut", price: 800, duration: 45, description: "Precision haircut tailored to your style", featured: true, is_active: true, category: "Hair" },
  { id: 102, category_id: 1, name: "Men's Haircut", price: 400, duration: 30, description: "Classic or modern gentleman's cut", featured: true, is_active: true, category: "Hair" },
  { id: 103, category_id: 1, name: "Hair Trimming", price: 350, duration: 25, description: "Split ends removal and shape refresh", featured: false, is_active: true, category: "Hair" },
  { id: 104, category_id: 1, name: "Bangs / Fringe Cut", price: 300, duration: 20, description: "Framing fringe cut", featured: false, is_active: true, category: "Hair" },
  { id: 105, category_id: 1, name: "Hair Wash", price: 300, duration: 20, description: "Deep cleansing scalp and hair wash", featured: false, is_active: true, category: "Hair" },
  { id: 106, category_id: 1, name: "Blow Dry", price: 500, duration: 30, description: "Professional volume blow dry", featured: false, is_active: true, category: "Hair" },
  { id: 107, category_id: 1, name: "Hair Styling", price: 900, duration: 45, description: "Occasion styling and curls", featured: false, is_active: true, category: "Hair" },
  { id: 108, category_id: 1, name: "Curls & Straightening", price: 1000, duration: 45, description: "Thermal styling finish", featured: false, is_active: true, category: "Hair" },
  { id: 109, category_id: 1, name: "Hair Spa", price: 1200, duration: 60, description: "Intensive deep nourishing treatment", featured: true, is_active: true, category: "Hair" },
  { id: 110, category_id: 1, name: "Deep Conditioning", price: 900, duration: 45, description: "Moisture replenishment for dull hair", featured: false, is_active: true, category: "Hair" },
  { id: 111, category_id: 1, name: "Scalp Treatments", price: 1400, duration: 60, description: "Rebalancing and purifying scalp therapy", featured: false, is_active: true, category: "Hair" },
  { id: 114, category_id: 1, name: "Global Hair Colour", price: 2800, duration: 90, description: "All-over rich uniform color", featured: true, is_active: true, category: "Hair" },
  { id: 115, category_id: 1, name: "Root Touch-Up", price: 1200, duration: 45, description: "Regrowth coverage and blending", featured: false, is_active: true, category: "Hair" },
  { id: 117, category_id: 1, name: "Highlights & Lowlights", price: 3500, duration: 120, description: "Dimensional foil highlights", featured: true, is_active: true, category: "Hair" },
  { id: 118, category_id: 1, name: "Balayage", price: 4500, duration: 150, description: "Hand-painted bespoke sun-kissed gradient", featured: true, is_active: true, category: "Hair" },
  { id: 123, category_id: 1, name: "Keratin Treatment", price: 3800, duration: 150, description: "Frizz-free smoothness and mirror shine", featured: true, is_active: true, category: "Hair" },
  { id: 127, category_id: 1, name: "Hair Botox", price: 4200, duration: 120, description: "Anti-ageing, deeply restorative hair filler", featured: true, is_active: true, category: "Hair" },

  // 2. Skin & Beauty
  { id: 201, category_id: 2, name: "Basic Facial", price: 1000, duration: 45, description: "Hydrating clean facial", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 202, category_id: 2, name: "Fruit Facial", price: 1200, duration: 45, description: "Natural fruit extract antioxidant facial", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 203, category_id: 2, name: "Gold Facial", price: 1800, duration: 60, description: "Radiance boosting 24K gold dust ritual", featured: true, is_active: true, category: "Skin & Beauty" },
  { id: 204, category_id: 2, name: "Diamond Facial", price: 2200, duration: 60, description: "Luminous cellular polishing treatment", featured: true, is_active: true, category: "Skin & Beauty" },
  { id: 208, category_id: 2, name: "De-Tan Facial", price: 1500, duration: 50, description: "Sun damage repair and tone restoration", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 210, category_id: 2, name: "Face Cleanup", price: 700, duration: 35, description: "Gentle blackhead and pore clearing", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 214, category_id: 2, name: "Eyebrow Threading", price: 60, duration: 15, description: "Precise arch shaping", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 218, category_id: 2, name: "Full Face Threading", price: 250, duration: 25, description: "Complete gentle facial threading", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 219, category_id: 2, name: "Full Arms Waxing", price: 500, duration: 30, description: "Silky smooth full arm wax", featured: false, is_active: true, category: "Skin & Beauty" },
  { id: 221, category_id: 2, name: "Full Legs Waxing", price: 700, duration: 40, description: "Full leg wax with soothing finish", featured: false, is_active: true, category: "Skin & Beauty" },

  // 3. Women's Grooming
  { id: 301, category_id: 3, name: "Classic Manicure", price: 500, duration: 35, description: "Nail shaping, cuticle care, light massage", featured: false, is_active: true, category: "Women's Grooming" },
  { id: 302, category_id: 3, name: "Classic Pedicure", price: 600, duration: 45, description: "Foot soak, scrub, and nail care", featured: false, is_active: true, category: "Women's Grooming" },
  { id: 303, category_id: 3, name: "Spa Manicure", price: 800, duration: 50, description: "Exfoliation mask with paraffin hydration", featured: true, is_active: true, category: "Women's Grooming" },
  { id: 304, category_id: 3, name: "Spa Pedicure", price: 950, duration: 60, description: "Aromatic therapeutic foot spa", featured: true, is_active: true, category: "Women's Grooming" },

  // 4. Men's Grooming
  { id: 401, category_id: 4, name: "Beard Trim & Shape", price: 250, duration: 20, description: "Line-up and length sculpting", featured: false, is_active: true, category: "Men's Grooming" },
  { id: 402, category_id: 4, name: "Clean Shave", price: 250, duration: 20, description: "Hot towel traditional close shave", featured: false, is_active: true, category: "Men's Grooming" },
  { id: 403, category_id: 4, name: "Head Massage (Oil)", price: 400, duration: 30, description: "Stress-relieving Ayurvedic massage", featured: true, is_active: true, category: "Men's Grooming" },
  { id: 404, category_id: 4, name: "Men's De-Tan Face Cleanup", price: 800, duration: 40, description: "Deep pore cleanse formulated for men", featured: false, is_active: true, category: "Men's Grooming" },

  // 5. Nails
  { id: 501, category_id: 5, name: "Regular Nail Polish", price: 150, duration: 15, description: "Color coat and top shine", featured: false, is_active: true, category: "Nails" },
  { id: 502, category_id: 5, name: "Gel Polish", price: 600, duration: 40, description: "Long-lasting chip-resistant UV polish", featured: true, is_active: true, category: "Nails" },
  { id: 503, category_id: 5, name: "Nail Art (Per Nail)", price: 100, duration: 10, description: "Hand-painted minimal or accent art", featured: false, is_active: true, category: "Nails" }
];

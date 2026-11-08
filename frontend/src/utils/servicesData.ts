export interface ServiceItem {
  id: string;
  name: string;
  price: string;
}

export interface ServiceSubCategory {
  title: string;
  items: ServiceItem[];
}

export interface CategoryData {
  category: "hair" | "skin" | "women" | "men" | "nails";
  label: string;
  subCategories: ServiceSubCategory[];
}

export const servicesCatalog: CategoryData[] = [
  {
    category: "hair",
    label: "Hair",
    subCategories: [
      {
        title: "Haircuts & Styling",
        items: [
          { id: "h1", name: "Women's Haircut", price: "₹699" },
          { id: "h2", name: "Men's Haircut", price: "₹349" },
          { id: "h3", name: "Hair Trimming", price: "₹399" },
          { id: "h4", name: "Bangs / Fringe Cut", price: "₹249" },
          { id: "h5", name: "Hair Wash", price: "₹249" },
          { id: "h6", name: "Blow Dry", price: "₹399" },
          { id: "h7", name: "Hair Styling", price: "₹699" },
          { id: "h8", name: "Curls & Straightening", price: "₹799" },
        ],
      },
      {
        title: "Hair Treatments",
        items: [
          { id: "ht1", name: "Hair Spa", price: "₹1,199" },
          { id: "ht2", name: "Deep Conditioning", price: "₹899" },
          { id: "ht3", name: "Scalp Treatments", price: "₹1,299" },
          { id: "ht4", name: "Anti-Dandruff Treatment", price: "₹1,099" },
          { id: "ht5", name: "Hair Repair Treatments", price: "₹1,499" },
        ],
      },
      {
        title: "Hair Colour",
        items: [
          { id: "hc1", name: "Global Hair Colour", price: "₹2,499" },
          { id: "hc2", name: "Root Touch-Up", price: "₹999" },
          { id: "hc3", name: "Ammonia-Free Hair Colour", price: "₹2,799" },
          { id: "hc4", name: "Highlights & Lowlights", price: "₹1,899" },
          { id: "hc5", name: "Balayage", price: "₹3,499" },
          { id: "hc6", name: "Ombre", price: "₹3,199" },
          { id: "hc7", name: "Fashion / Creative Colours", price: "₹1,999" },
          { id: "hc8", name: "Men's Hair Colour", price: "₹699" },
          { id: "hc9", name: "Beard Colour", price: "₹399" },
        ],
      },
      {
        title: "Hair Smoothening & Texture Treatments",
        items: [
          { id: "hs1", name: "Keratin Treatment", price: "₹3,999" },
          { id: "hs2", name: "Hair Smoothening", price: "₹3,499" },
          { id: "hs3", name: "Hair Rebonding", price: "₹3,999" },
          { id: "hs4", name: "Permanent Hair Straightening", price: "₹4,499" },
          { id: "hs5", name: "Hair Botox", price: "₹4,999" },
        ],
      },
    ],
  },
  {
    category: "skin",
    label: "Skin & Beauty",
    subCategories: [
      {
        title: "Facials",
        items: [
          { id: "f1", name: "Basic Facial", price: "₹799" },
          { id: "f2", name: "Fruit Facial", price: "₹999" },
          { id: "f3", name: "Gold Facial", price: "₹1,499" },
          { id: "f4", name: "Diamond Facial", price: "₹1,899" },
          { id: "f5", name: "Hydrating Facial", price: "₹1,399" },
          { id: "f6", name: "Brightening Facial", price: "₹1,499" },
          { id: "f7", name: "Anti-Ageing Facial", price: "₹1,999" },
          { id: "f8", name: "De-Tan Facial", price: "₹1,299" },
          { id: "f9", name: "Sensitive Skin Facial", price: "₹1,499" },
        ],
      },
      {
        title: "Skin Treatments",
        items: [
          { id: "st1", name: "Face Cleanup", price: "₹599" },
          { id: "st2", name: "De-Tan Treatment", price: "₹699" },
          { id: "st3", name: "Face Bleach", price: "₹449" },
          { id: "st4", name: "Face Polishing", price: "₹1,199" },
        ],
      },
      {
        title: "Threading",
        items: [
          { id: "th1", name: "Eyebrow Threading", price: "₹60" },
          { id: "th2", name: "Upper Lip", price: "₹40" },
          { id: "th3", name: "Forehead", price: "₹50" },
          { id: "th4", name: "Chin", price: "₹40" },
          { id: "th5", name: "Full Face Threading", price: "₹180" },
        ],
      },
      {
        title: "Waxing",
        items: [
          { id: "wx1", name: "Full Arms", price: "₹349" },
          { id: "wx2", name: "Half Arms", price: "₹249" },
          { id: "wx3", name: "Full Legs", price: "₹499" },
          { id: "wx4", name: "Half Legs", price: "₹349" },
          { id: "wx5", name: "Underarms", price: "₹149" },
        ],
      },
    ],
  },
  {
    category: "women",
    label: "Women's Grooming",
    subCategories: [
      {
        title: "Grooming Packages",
        items: [
          { id: "wg1", name: "Haircuts & Trimming", price: "₹599" },
          { id: "wg2", name: "Hair Wash & Blow Dry", price: "₹549" },
          { id: "wg3", name: "Hair Styling", price: "₹699" },
          { id: "wg4", name: "Party Hairstyles", price: "₹1,199" },
          { id: "wg5", name: "Eyebrow & Facial Threading", price: "₹180" },
          { id: "wg6", name: "Full Body Waxing", price: "₹999" },
          { id: "wg7", name: "Bleach & De-Tan", price: "₹799" },
          { id: "wg8", name: "Classic Manicure", price: "₹599" },
          { id: "wg9", name: "Classic Pedicure", price: "₹699" },
          { id: "wg10", name: "Essential Nail Care", price: "₹799" },
        ],
      },
    ],
  },
  {
    category: "men",
    label: "Men's Grooming",
    subCategories: [
      {
        title: "Gentlemen's Rituals",
        items: [
          { id: "mg1", name: "Men's Precision Haircut", price: "₹349" },
          { id: "mg2", name: "Beard Trim & Styling", price: "₹199" },
          { id: "mg3", name: "Beard Colour", price: "₹399" },
          { id: "mg4", name: "Hair Wash & Styling", price: "₹299" },
          { id: "mg5", name: "Men's Hair Spa", price: "₹899" },
          { id: "mg6", name: "Relaxing Head Massage", price: "₹449" },
          { id: "mg7", name: "Men's Face Cleanup", price: "₹549" },
          { id: "mg8", name: "Gentleman's Facial", price: "₹899" },
        ],
      },
    ],
  },
  {
    category: "nails",
    label: "Nails",
    subCategories: [
      {
        title: "Nail Extensions",
        items: [
          { id: "ne1", name: "Acrylic Nail Extensions", price: "₹1,799" },
          { id: "ne2", name: "Gel Nail Extensions", price: "₹1,999" },
          { id: "ne3", name: "Polygel Extensions", price: "₹2,199" },
          { id: "ne4", name: "Nail Refills", price: "₹899" },
          { id: "ne5", name: "Nail Extension Removal", price: "₹499" },
        ],
      },
      {
        title: "Nail Art & Design",
        items: [
          { id: "na1", name: "Basic Nail Art", price: "₹299" },
          { id: "na2", name: "French Nail Art", price: "₹499" },
          { id: "na3", name: "Chrome Nails", price: "₹699" },
          { id: "na4", name: "Ombre Nails", price: "₹699" },
          { id: "na5", name: "Glitter Nails", price: "₹499" },
          { id: "na6", name: "3D Nail Art", price: "₹899" },
          { id: "na7", name: "Custom Nail Designs", price: "₹999" },
        ],
      },
      {
        title: "Nail Care",
        items: [
          { id: "nc1", name: "Regular Nail Polish", price: "₹149" },
          { id: "nc2", name: "Gel Polish", price: "₹599" },
          { id: "nc3", name: "Gel Polish Removal", price: "₹249" },
          { id: "nc4", name: "Luxury Manicure", price: "₹549" },
          { id: "nc5", name: "Luxury Pedicure", price: "₹649" },
          { id: "nc6", name: "Nail Shaping", price: "₹149" },
          { id: "nc7", name: "Cuticle Care", price: "₹199" },
          { id: "nc8", name: "Nail Repair", price: "₹199" },
          { id: "nc9", name: "Nail Strengthening", price: "₹449" },
        ],
      },
    ],
  },
];

// Flat export for dropdown selection in the Booking component
export const allServicesFlat = servicesCatalog.flatMap((cat) =>
  cat.subCategories.flatMap((sub) =>
    sub.items.map((item) => ({
      name: `${item.name} (${cat.label})`,
      rawName: item.name,
      price: item.price,
    }))
  )
);
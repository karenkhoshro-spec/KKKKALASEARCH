import React from "react";

export interface CategoryIconProps {
  id?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export default function CategoryIcon({
  id = "",
  size = 28,
  className = "",
  strokeWidth = 1.8,
  style,
}: CategoryIconProps) {
  const normalizedId = String(id).toLowerCase().trim();

  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: `ks-category-icon ${className}`,
    style,
    "aria-hidden": true,
  };

  switch (normalizedId) {
    // ==========================================
    // 1. PRIMARY CATEGORIES (14 + سایر)
    // ==========================================
    case "shopping-basket":
      return (
        <svg {...svgProps}>
          {/* Handle */}
          <path d="M8 8V5.5C8 3.5 9.8 2 12 2s4 1.5 4 3.5V8" />
          {/* Basket body */}
          <path d="M3.5 8.5h17a1 1 0 0 1 1 1.2l-1.8 9.5a2.5 2.5 0 0 1-2.5 2h-10.4a2.5 2.5 0 0 1-2.5-2L2.5 9.7a1 1 0 0 1 1-1.2z" />
          {/* Weave lines */}
          <path d="M9 12v5.5M12 12v5.5M15 12v5.5" />
          <path d="M4.5 13.5h15" strokeDasharray="1 1.5" strokeWidth={strokeWidth * 0.8} />
          {/* Sparkle accent */}
          <path d="M19.5 5.5v2M18.5 6.5h2" strokeWidth={1.5} />
        </svg>
      );

    case "picnic-basket":
      return (
        <svg {...svgProps}>
          {/* Arch Handle */}
          <path d="M7 9C7 5.5 9.2 3 12 3s5 2.5 5 6" />
          {/* Split Woven Lid */}
          <path d="M3.5 9.5c0-.8.7-1.5 1.5-1.5h14c.8 0 1.5.7 1.5 1.5v1.5H3.5V9.5z" />
          <path d="M12 8v3" />
          {/* Basket Body */}
          <path d="M4.5 11l1.5 8.5a2 2 0 0 0 2 1.5h8a2 2 0 0 0 2-1.5l1.5-8.5" />
          {/* Cross weave lines */}
          <path d="M5.5 14.5h13M6 18h12" strokeDasharray="1 1.5" />
          <circle cx="12" cy="3" r="0.75" fill="currentColor" fillOpacity="0.4" />
        </svg>
      );

    case "stool":
      return (
        <svg {...svgProps}>
          {/* Seat cushion top */}
          <rect x="3.5" y="4.5" width="17" height="4" rx="2" />
          {/* Center handle grip slot */}
          <rect x="10" y="5.8" width="4" height="1.4" rx="0.7" fill="currentColor" fillOpacity="0.3" />
          {/* Outer flared legs */}
          <path d="M6 8.5L4.5 20.5" />
          <path d="M18 8.5L19.5 20.5" />
          {/* Inner legs for depth */}
          <path d="M9.5 8.5L8.5 20.5" strokeOpacity="0.65" />
          <path d="M14.5 8.5L15.5 20.5" strokeOpacity="0.65" />
          {/* Reinforcement cross-bar */}
          <path d="M5.2 15.5h13.6" />
          {/* Anti-slip feet */}
          <path d="M4 20.5h1.5M18.5 20.5h1.5" strokeWidth={strokeWidth + 0.5} />
        </svg>
      );

    case "powder-sponge-holder":
      return (
        <svg {...svgProps}>
          {/* Detergent dispenser box */}
          <rect x="3" y="7" width="9" height="13.5" rx="2" />
          {/* Pour spout cap */}
          <path d="M5.5 7V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V7" />
          {/* Droplet motif */}
          <path d="M7.5 11.5c0-.8.8-1.8 1.5-2.2.7.4 1.5 1.4 1.5 2.2a1.5 1.5 0 0 1-3 0z" fill="currentColor" fillOpacity="0.25" />
          <path d="M5 16h3" />
          {/* Sponge dock & sponge */}
          <rect x="14" y="10.5" width="7" height="10" rx="2" />
          <path d="M14 14.5h7" />
          <circle cx="16.5" cy="12.5" r="0.5" fill="currentColor" />
          <circle cx="18.5" cy="17.5" r="0.5" fill="currentColor" />
          {/* Clean sparkle */}
          <path d="M19 4.5v3M17.5 6h3" strokeWidth={1.5} />
        </svg>
      );

    case "fruit-vegetable-basket":
      return (
        <svg {...svgProps}>
          {/* Fruit basket bowl */}
          <path d="M3 12c0 5 4 8 9 8s9-3 9-8H3z" />
          <path d="M8.5 20h7" />
          {/* Apple & Leaf */}
          <path d="M7.5 12c-.5-3 1.5-5.5 4-5.5 1.5 0 2.8.8 3.5 2" />
          <path d="M16 12c.8-2.5 0-5.5-2.5-5.5" />
          <path d="M13 4.5c-.8.8-1 2.2-1 2.2s1.5-.2 2.2-1c.8-.8 1-2.2 1-2.2s-1.4.2-2.2 1z" fill="currentColor" fillOpacity="0.25" />
          {/* Citrus / carrot slice curve */}
          <path d="M5.5 12c.5-2 2-3.5 4-3.5" />
          {/* Basket vent pattern */}
          <path d="M7 15.5h10M9 18h6" strokeDasharray="1 1.5" />
        </svg>
      );

    case "colander-bowl":
      return (
        <svg {...svgProps}>
          {/* Colander bowl */}
          <path d="M3.5 9.5c0 5.8 3.8 9.5 8.5 9.5s8.5-3.7 8.5-9.5H3.5z" />
          {/* Wide side handles */}
          <path d="M3.5 9.5H2a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1h2" />
          <path d="M20.5 9.5H22a1 1 0 0 0 1-1v-.5a1 1 0 0 0-1-1h-2" />
          {/* Ring base */}
          <path d="M8.5 19h7v1.5a.5.5 0 0 1-.5.5h-6a.5.5 0 0 1-.5-.5V19z" />
          {/* Drainage perforation holes */}
          <circle cx="8.5" cy="13" r="0.8" fill="currentColor" />
          <circle cx="12" cy="13" r="0.8" fill="currentColor" />
          <circle cx="15.5" cy="13" r="0.8" fill="currentColor" />
          <circle cx="10" cy="16" r="0.8" fill="currentColor" />
          <circle cx="14" cy="16" r="0.8" fill="currentColor" />
        </svg>
      );

    case "freezer":
      return (
        <svg {...svgProps}>
          {/* Airtight box body */}
          <rect x="3.5" y="8" width="17" height="12" rx="2.5" />
          {/* Lid rim with locking clips */}
          <path d="M2.5 7.5h19v1.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7.5z" />
          <path d="M1.5 8.5v2a1 1 0 0 0 1 1H3" />
          <path d="M22.5 8.5v2a1 1 0 0 1-1 1H21" />
          {/* Frost crystal snowflake */}
          <path d="M12 11.5v5M9.5 14h5" />
          <path d="M10.2 12.2l3.6 3.6M13.8 12.2l-3.6 3.6" />
          <circle cx="12" cy="14" r="0.75" fill="currentColor" />
        </svg>
      );

    case "soap-dish":
      return (
        <svg {...svgProps}>
          {/* Soap dish base */}
          <path d="M3 15.5c0 3 4 5 9 5s9-2 9-5" />
          {/* Slotted drainage ribs */}
          <path d="M8 17.5v1.2M12 18v1.2M16 17.5v1.2" />
          {/* Floating rounded soap bar */}
          <rect x="5.5" y="8.5" width="13" height="6.5" rx="3.25" />
          {/* Lather bubbles */}
          <circle cx="16.5" cy="5" r="1.8" />
          <circle cx="19.5" cy="3.5" r="1" />
          <circle cx="7.5" cy="6" r="1.3" />
        </svg>
      );

    case "spice":
      return (
        <svg {...svgProps}>
          {/* Left jar */}
          <rect x="3.5" y="8.5" width="7.5" height="11.5" rx="2" />
          <path d="M4.5 8.5V6a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v2.5" />
          <circle cx="6.5" cy="6.5" r="0.4" fill="currentColor" />
          <circle cx="8" cy="6.5" r="0.4" fill="currentColor" />
          <path d="M5.5 15h3.5" strokeDasharray="1 1" />
          {/* Right jar */}
          <rect x="13" y="8.5" width="7.5" height="11.5" rx="2" />
          <path d="M14 8.5V6a1 1 0 0 1 1-1h5.5a1 1 0 0 1 1 1v2.5" />
          <circle cx="16" cy="6.5" r="0.4" fill="currentColor" />
          <circle cx="17.5" cy="6.5" r="0.4" fill="currentColor" />
          <path d="M15 15h3.5" strokeDasharray="1 1" />
          {/* Aroma spice glint */}
          <path d="M12 2.5v2M10.5 3.5h3" strokeWidth={1.5} />
        </svg>
      );

    case "pitcher-glass":
      return (
        <svg {...svgProps}>
          {/* Pitcher */}
          <path d="M4.5 6.5h7.5l-1 13.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20L4.5 6.5z" />
          <path d="M4.5 6.5L3 5.5h3" />
          {/* Pitcher handle */}
          <path d="M11.5 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2.2" />
          <path d="M5.5 13q2.5-1 4.5 0" strokeOpacity="0.7" />
          {/* Glass */}
          <path d="M16 11.5h5l-.8 8.5a1.5 1.5 0 0 1-1.5 1.5h-1.4a1.5 1.5 0 0 1-1.5-1.5L16 11.5z" />
          <path d="M16.5 15.5h4" strokeOpacity="0.7" />
          <path d="M19 8.5l1.2-4.5" strokeWidth={1.5} />
        </svg>
      );

    case "juicer":
      return (
        <svg {...svgProps}>
          {/* Juicer cone reamer */}
          <path d="M12 3l-4 7h8L12 3z" />
          <path d="M12 3.5v6.5M10 6l-.8 4M14 6l.8 4" strokeWidth={1.5} />
          {/* Juicer cup base */}
          <path d="M5 10h14v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-4z" />
          {/* Spout and handle */}
          <path d="M5 11.5L3 10v2.5l2 1" />
          <path d="M19 11.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H19" />
          {/* Seed / droplet */}
          <circle cx="12" cy="14.5" r="1.2" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );

    case "ice-holder":
      return (
        <svg {...svgProps}>
          {/* Ice tray */}
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M3 11h18M3 15h18" />
          <path d="M8.5 7v12M14 7v12" />
          {/* Floating ice cube */}
          <path d="M17.5 2.5l3 1.5v3l-3 1.5-3-1.5v-3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M17.5 5.5v3M14.5 4l3 1.5 3-1.5" />
        </svg>
      );

    case "bucket":
      return (
        <svg {...svgProps}>
          {/* Bucket body */}
          <path d="M5.5 8l1.4 11.5a2 2 0 0 0 2 1.5h6.2a2 2 0 0 0 2-1.5L18.5 8" />
          {/* Lid */}
          <path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1H4V7z" />
          <path d="M10.5 5a1.5 1.5 0 0 1 3 0" />
          {/* Swing wire handle */}
          <path d="M5 8.5C5 4.5 8 2.5 12 2.5s7 2 7 6" />
          {/* Pedal */}
          <path d="M10.5 21h3v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5V21z" />
        </svg>
      );

    case "basin-bathtub":
      return (
        <svg {...svgProps}>
          {/* Basin tub body */}
          <path d="M3 9.5c0 6.5 4 10 9 10s9-3.5 9-10H3z" />
          {/* Molded wide side handles */}
          <path d="M3 9.5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 1.5 1.5v3" />
          <path d="M21 9.5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2.5a1.5 1.5 0 0 0-1.5 1.5v3" />
          <path d="M3 9.5h18" />
          {/* Water ripple */}
          <path d="M7 14q2.5-1.5 5 0t5 0" />
          <circle cx="12" cy="5" r="1" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );

    case "other":
      return (
        <svg {...svgProps}>
          {/* Futuristic 4-tile grid + center spark */}
          <rect x="4" y="4" width="6.5" height="6.5" rx="2" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
          <path d="M12 10.5v3M10.5 12h3" strokeWidth={1.5} />
        </svg>
      );

    // ==========================================
    // 2. "سایر" SUBCATEGORIES
    // ==========================================
    case "butter-holder":
      return (
        <svg {...svgProps}>
          {/* Base platter with tabs */}
          <path d="M2.5 18h19a1 1 0 0 1 1 1v.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V19a1 1 0 0 1 1-1z" />
          {/* Domed cloche lid */}
          <path d="M5 18c0-5.5 3-9 7-9s7 3.5 7 9H5z" />
          {/* Knob */}
          <circle cx="12" cy="7" r="1.75" />
          {/* Butter slice */}
          <rect x="8.5" y="14" width="7" height="3.5" rx="1" fill="currentColor" fillOpacity="0.25" />
        </svg>
      );

    case "spoon-holder":
      return (
        <svg {...svgProps}>
          {/* Perforated holder */}
          <path d="M6 10h12l-1 9.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L6 10z" />
          <circle cx="10" cy="15" r="0.75" fill="currentColor" />
          <circle cx="14" cy="15" r="0.75" fill="currentColor" />
          <circle cx="12" cy="18" r="0.75" fill="currentColor" />
          {/* Spoon emerging */}
          <path d="M9 10V6a2 2 0 1 1 4 0v4" />
          {/* Fork emerging */}
          <path d="M15 10V5M13.5 5v2.5M16.5 5v2.5M13.5 7.5h3" />
        </svg>
      );

    case "flower-pot":
      return (
        <svg {...svgProps}>
          {/* Tapered flower pot */}
          <path d="M6 12l1.3 7.5a2 2 0 0 0 2 1.5h5.4a2 2 0 0 0 2-1.5L18 12" />
          <rect x="5" y="9.5" width="14" height="2.5" rx="1" />
          {/* Blooming flower sprouting */}
          <path d="M12 9.5V5" />
          <path d="M12 7.5c-2 0-3-1.5-3-2.5 1.5 0 3 1 3 2.5z" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 6.5c2 0 3-1.5 3-2.5-1.5 0-3 1-3 2.5z" fill="currentColor" fillOpacity="0.2" />
          <path d="M10 4c0 2 2 3 2 3s2-1 2-3c0-1.5-1-2-2-2s-2 .5-2 2z" fill="currentColor" fillOpacity="0.25" />
        </svg>
      );

    case "plant-saucer":
      return (
        <svg {...svgProps}>
          {/* Shallow saucer */}
          <path d="M2.5 15l1.5 4a2 2 0 0 0 1.9 1.5h12.2a2 2 0 0 0 1.9-1.5l1.5-4" />
          <path d="M2 14.5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v.5H2v-.5z" />
          <path d="M8 16.5l-.5 2M12 16.5v2M16 16.5l.5 2" />
          {/* Sprout droplet */}
          <path d="M12 5a3 3 0 0 0-3 3c0 2 3 4.5 3 4.5s3-2.5 3-4.5a3 3 0 0 0-3-3z" fill="currentColor" fillOpacity="0.25" />
        </svg>
      );

    case "shopping-basket-other":
      return (
        <svg {...svgProps}>
          {/* Long loop straps */}
          <path d="M9 10V5a3 3 0 0 1 6 0v5" />
          {/* Tote body */}
          <path d="M4 10l1.8 10a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 2-1.5L20 10H4z" />
          {/* Woven lattice */}
          <path d="M4.5 14h15M6 18h12" strokeDasharray="1 1.5" />
          <path d="M10 10l2 11M14 10l-2 11" strokeOpacity="0.6" />
        </svg>
      );

    case "oval-basket":
      return (
        <svg {...svgProps}>
          {/* Oval basket */}
          <ellipse cx="12" cy="14.5" rx="8.5" ry="5.5" />
          <ellipse cx="12" cy="12.5" rx="8.5" ry="4" />
          <path d="M5.5 12.5a1 1 0 0 1 2 0M16.5 12.5a1 1 0 0 1 2 0" />
          <path d="M8 15v3M12 16v3M16 15v3" strokeDasharray="1 1" />
        </svg>
      );

    case "janani":
      return (
        <svg {...svgProps}>
          {/* Bread container */}
          <path d="M3.5 19V9.5a5.5 5.5 0 0 1 5.5-5.5h6a5.5 5.5 0 0 1 5.5 5.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
          {/* Roll slats */}
          <path d="M8 7.5h8M7 11h10M6 14.5h12M4 18h16" strokeDasharray="1 1.5" />
          {/* Handle */}
          <rect x="9.5" y="13.5" width="5" height="2" rx="1" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );

    case "organizer":
      return (
        <svg {...svgProps}>
          {/* Top drawer */}
          <rect x="3.5" y="4.5" width="17" height="6.5" rx="2" />
          <rect x="9.5" y="7" width="5" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.3" />
          {/* Bottom drawer */}
          <rect x="3.5" y="13" width="17" height="6.5" rx="2" />
          <rect x="9.5" y="15.5" width="5" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );

    case "laundry-basket":
      return (
        <svg {...svgProps}>
          {/* Tall laundry hamper */}
          <path d="M5.5 6.5l1.6 13.5a2 2 0 0 0 2 1.5h5.8a2 2 0 0 0 2-1.5L18.5 6.5" />
          <rect x="4.5" y="4.5" width="15" height="2.5" rx="1" />
          <rect x="9" y="8.5" width="6" height="1.8" rx="0.9" fill="currentColor" fillOpacity="0.2" />
          {/* Vertical vent slits */}
          <path d="M8.5 12v6M12 12v6M15.5 12v6" />
        </svg>
      );

    case "kitchen-tools":
      return (
        <svg {...svgProps}>
          {/* Crossed rolling pin & spatula */}
          <path d="M15 4l5 5M16 3l5 5-2 2-5-5 2-2zM14 7l-8.5 8.5a1.5 1.5 0 0 0 0 2.1l.4.4a1.5 1.5 0 0 0 2.1 0L16.5 9.5" />
          <path d="M5 6a3 3 0 0 1 4 4L5 14M8 9l11 11" strokeWidth={1.5} />
        </svg>
      );

    case "cleaning-tools":
      return (
        <svg {...svgProps}>
          {/* Broom & dustpan duo */}
          <path d="M16 3L9 14" />
          <path d="M6 14.5l5.5-2.5 3 6-7.5 3.5a1.5 1.5 0 0 1-2-.9l-1-3a1.5 1.5 0 0 1 .9-2.1z" />
          <path d="M7 17l4-2M8 19l4-2" strokeWidth={1.5} />
          {/* Sparkle */}
          <path d="M19 8v3M17.5 9.5h3" strokeWidth={1.5} />
          <circle cx="19.5" cy="16.5" r="1" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );

    case "storage":
      return (
        <svg {...svgProps}>
          {/* Large storage canister */}
          <rect x="3.5" y="6" width="9.5" height="14.5" rx="2.5" />
          <rect x="3" y="4" width="10.5" height="2.5" rx="1" />
          <path d="M6 10h2M6 13h3M6 16h2" />
          {/* Smaller nesting jar */}
          <rect x="15" y="10" width="6" height="10.5" rx="2" />
          <rect x="14.5" y="8" width="7" height="2.5" rx="1" />
        </svg>
      );

    case "tray":
      return (
        <svg {...svgProps}>
          {/* Serving tray */}
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <rect x="5.5" y="8" width="13" height="8" rx="1.5" />
          <rect x="3.8" y="10.5" width="1.2" height="3" rx="0.6" fill="currentColor" />
          <rect x="19" y="10.5" width="1.2" height="3" rx="0.6" fill="currentColor" />
        </svg>
      );

    case "chair":
      return (
        <svg {...svgProps}>
          {/* Bath stool curved seat */}
          <path d="M4 8.5c0-1.5 3.5-2.5 8-2.5s8 1 8 2.5v1.5c0 1.5-3.5 2.5-8 2.5s-8-1-8-2.5V8.5z" />
          <circle cx="10" cy="9" r="0.75" fill="currentColor" />
          <circle cx="14" cy="9" r="0.75" fill="currentColor" />
          {/* Legs & Cross bar */}
          <path d="M6 10l-1.5 10M18 10l1.5 10M8.5 11l-.5 9M15.5 11l.5 9" />
          <path d="M5.5 16h13" />
        </svg>
      );

    case "hanger":
      return (
        <svg {...svgProps}>
          {/* Swivel hook */}
          <path d="M12 6a2 2 0 0 1 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
          {/* Hanger triangle */}
          <path d="M12 6l8 6.5a1.5 1.5 0 0 1-.9 2.5H4.9a1.5 1.5 0 0 1-.9-2.5L12 6z" />
          <path d="M4 15h16" />
          <path d="M8 15v4M16 15v4" strokeWidth={1.5} />
        </svg>
      );

    case "paper-holder":
      return (
        <svg {...svgProps}>
          {/* Wall bracket */}
          <rect x="3.5" y="4" width="17" height="4" rx="1.5" />
          <path d="M6 8v10M18 8v10" />
          <ellipse cx="12" cy="13" rx="5.5" ry="3.5" />
          <path d="M6.5 13v6a1 1 0 0 0 1 1h8M12 16.5v3.5" />
        </svg>
      );

    case "toolbox":
      return (
        <svg {...svgProps}>
          {/* Hardware toolbox */}
          <rect x="3.5" y="8" width="17" height="12" rx="2.5" />
          <rect x="10.5" y="11.5" width="3" height="3" rx="0.75" fill="currentColor" fillOpacity="0.25" />
          <path d="M8.5 8V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V8" />
          <path d="M3.5 13h17" />
          <path d="M6 8v12M18 8v12" strokeOpacity="0.6" />
        </svg>
      );

    case "straw-basket":
      return (
        <svg {...svgProps}>
          {/* Bakery bread basket */}
          <path d="M3.5 12c0 5 3.5 8 8.5 8s8.5-3 8.5-8H3.5z" />
          <path d="M3.5 12q2-1.5 4 0t4 0 4 0 4 0" />
          {/* Baguettes */}
          <path d="M7 11L11 3.5a1.5 1.5 0 0 1 2.5 1L11.5 11" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 11l4-6.5a1.5 1.5 0 0 1 2.5 1L16 11" fill="currentColor" fillOpacity="0.2" />
          <path d="M9 7l2 1M14 7l2 1" strokeWidth={1.5} />
        </svg>
      );

    // Fallback: modern sparkling category emblem
    default:
      return (
        <svg {...svgProps}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M12 8v8M8 12h8" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}

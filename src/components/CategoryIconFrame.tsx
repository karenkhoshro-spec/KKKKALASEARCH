import CategoryIcon from "./CategoryIcon";

const TONES: Record<string, string> = {
  "shopping-basket": "orange",
  "picnic-basket": "green",
  stool: "orange",
  zanbil: "teal",
  "fruit-vegetable-basket": "green",
  "basin-bathtub": "blue",
  "pitcher-glass": "blue",
  freezer: "purple",
  other: "white",
  chair: "green",
  hanger: "purple",
  bucket: "red",
  "flower-pot": "green",
  "plant-saucer": "green",
  organizer: "teal",
  "laundry-basket": "blue",
  storage: "navy",
  toolbox: "orange",
  "soap-dish": "blue",
  "colander-bowl": "teal",
  "powder-sponge-holder": "green",
};

function toneOf(id: string) {
  return TONES[id] ?? "green";
}

export default function CategoryIconFrame({
  id,
  size = 28,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const tone = toneOf(id);
  return (
    <div className={`ks-icon-3d ks-icon-tone-${tone} ks-category-icon-wrapper ${className}`}>
      <svg className="ks-tree-layer" viewBox="0 0 64 64" aria-hidden="true">
        <path className="ks-tree-trunk" d="M32 58c0-10 1-18 0-26" />
        <ellipse className="ks-canopy ks-canopy-a" cx="32" cy="26" rx="18" ry="16" />
        <ellipse className="ks-canopy ks-canopy-b" cx="22" cy="30" rx="12" ry="11" />
        <ellipse className="ks-canopy ks-canopy-c" cx="42" cy="30" rx="12" ry="11" />
        <ellipse className="ks-canopy ks-canopy-d" cx="32" cy="18" rx="10" ry="9" />
      </svg>
      <CategoryIcon id={id} size={size} className="relative z-[1] h-[62%] w-[62%] object-contain" />
    </div>
  );
}

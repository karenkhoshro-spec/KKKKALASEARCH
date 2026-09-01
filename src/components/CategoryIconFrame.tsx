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
      <span className="ks-icon-orbit" aria-hidden="true" />
      <span className="ks-icon-face" aria-hidden="true" />
      <CategoryIcon id={id} size={size} className="relative z-[1] h-[68%] w-[68%] object-contain" />
    </div>
  );
}

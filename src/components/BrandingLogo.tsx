import Logo from "./Logo";

interface BrandingLogoProps {
  compact?: boolean;
  variant?: "vertical" | "horizontal";
}

export default function BrandingLogo({ compact = false, variant }: BrandingLogoProps) {
  return <Logo compact={compact} variant={variant} />;
}

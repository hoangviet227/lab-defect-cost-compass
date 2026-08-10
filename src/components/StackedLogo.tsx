import { forwardRef } from "react";

/** Static SVG logo — 3 stacked rectangles, solid fill, compact */
export const StackedLogo = forwardRef<
  SVGSVGElement,
  { size?: number; color?: string; className?: string }
>(({ size = 16, color = "currentColor", className }, ref) => (
  <svg
    ref={ref}
    className={className}
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="1.5" width="10" height="3.5" rx="0.5" fill={color} />
    <rect x="4.5" y="6.5" width="10" height="3.5" rx="0.5" fill={color} />
    <rect x="2" y="11.5" width="10" height="3.5" rx="0.5" fill={color} />
  </svg>
));

StackedLogo.displayName = "StackedLogo";

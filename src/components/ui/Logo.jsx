/**
 * Single source of truth for the ZXCOM logo mark.
 * Wherever the brand appears (navbar, footer, auth cards, download-app banner),
 * pass a size preset so the logo stays consistent across surfaces.
 */
const HEIGHTS = {
  xs: 'h-8',
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-20',
  xl: 'h-28',
};

export default function Logo({ size = 'md', className = '' }) {
  const h = HEIGHTS[size] || HEIGHTS.md;
  return (
    <img
      src="/zxcom.png"
      alt="ZXCOM"
      className={`${h} w-auto object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

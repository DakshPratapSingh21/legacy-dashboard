'use client';

interface AsblLogoProps {
  className?: string;
  color?: string; // defaults to 'currentColor'
  height?: number;
}

export default function AsblLogo({
  className,
  color = 'currentColor',
  height = 28,
}: AsblLogoProps) {
  // Calculate scale based on height (adjusted for text baseline)
  const scale = height / 32;
  const width = 120 * scale;

  return (
    <svg
      viewBox="0 0 120 32"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Main ASBL text with geometric bold styling */}
      <text
        x="60"
        y="24"
        textAnchor="middle"
        fill={color}
        fontSize="28"
        fontWeight="900"
        fontFamily="Arial Black, Arial, sans-serif"
        letterSpacing="-1"
      >
        ASBL
      </text>

      {/* Registered trademark symbol */}
      <text
        x="104"
        y="8"
        fill={color}
        fontSize="8"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        dominantBaseline="middle"
      >
        ®
      </text>
    </svg>
  );
}

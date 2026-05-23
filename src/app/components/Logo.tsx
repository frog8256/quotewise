export default function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Q Symbol - Dark Navy Circle */}
      <circle cx="60" cy="70" r="28" stroke="#1e3a5f" strokeWidth="10" fill="none" />
      <line x1="80" y1="88" x2="92" y2="100" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" />

      {/* W Symbol - Blue */}
      <path
        d="M100 55 L108 95 L116 65 L124 95 L132 55"
        stroke="#2563eb"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* QuoteWise Text */}
      <text
        x="165"
        y="85"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="48"
        fontWeight="600"
        fill="#1e3a5f"
      >
        Quote<tspan fill="#2563eb">Wise</tspan>
      </text>
    </svg>
  );
}

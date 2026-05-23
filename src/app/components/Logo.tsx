const logoUrl = new URL('../../../logo/로고 png 2.png', import.meta.url).href;

export default function Logo({ className = 'h-14' }: { className?: string }) {
  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ width: 252 }}
      aria-label="QuoteWise"
      role="img"
    >
      <img
        src={logoUrl}
        alt="QuoteWise"
        className="absolute left-0 top-1/2 w-[94%] max-w-none -translate-y-1/2 select-none"
        draggable={false}
      />
    </span>
  );
}

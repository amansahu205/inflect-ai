const InflectLogo = ({ size = 36, className = "" }: { size?: number; className?: string }) => (
  <a href="#" className={`group flex items-center gap-2.5 ${className}`}>
    {/* Lightning bolt SVG with glow node */}
    <svg
      width={size * 0.6}
      height={size}
      viewBox="0 0 24 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-[filter] duration-300"
      style={{ filter: "drop-shadow(0 0 6px rgba(240,165,0,0.7))" }}
      onMouseEnter={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 12px rgba(240,165,0,0.9))")}
      onMouseLeave={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 6px rgba(240,165,0,0.7))")}
    >
      {/* Bolt */}
      <path
        d="M14 2L4 18h7l-3 20L20 16h-7l3-14H14z"
        fill="#F0A500"
        stroke="#F0A500"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* Glow node at inflection point */}
      <circle cx="11" cy="18" r="2.5" fill="#F0A500" />
      <circle cx="11" cy="18" r="4" fill="rgba(240,165,0,0.35)" />
    </svg>

    {/* Wordmark */}
    <div className="flex flex-col">
      <span
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: size === 36 ? 24 : 18,
          letterSpacing: "0.12em",
          color: "#FFFFFF",
          lineHeight: 1,
        }}
      >
        INFLECT
      </span>
      <div
        style={{
          width: "100%",
          height: 1,
          background: "#F0A500",
          marginTop: 3,
        }}
      />
    </div>
  </a>
);

export default InflectLogo;

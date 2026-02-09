  interface OnebeamLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const OnebeamLogo = ({ size = "md", showText = true, className = "" }: OnebeamLogoProps) => {
  const sizes = {
    sm: { icon: 24, text: "text-lg", gap: "gap-2" },
    md: { icon: 32, text: "text-2xl", gap: "gap-3" },
    lg: { icon: 48, text: "text-4xl", gap: "gap-4" },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {/* Beam Icon */}
      <svg
        width={icon}
        height={icon * 1.2}
        viewBox="0 0 40 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="beam-gradient-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="100%" stopColor="#00D4E5" />
          </linearGradient>
          <linearGradient id="beam-gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
          <linearGradient id="beam-gradient-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E040FB" />
            <stop offset="100%" stopColor="#D500F9" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="0%" r="50%">
            <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Glow at top */}
        <circle cx="20" cy="2" r="4" fill="url(#glow)" opacity="0.8" />
        <circle cx="20" cy="2" r="2" fill="#FFFFFF" />
        
        {/* Cyan beam (left) */}
        <polygon
          points="20,2 8,46 16,46"
          fill="url(#beam-gradient-cyan)"
          opacity="0.95"
        />
        
        {/* Green beam (center) */}
        <polygon
          points="20,2 16,46 26,46"
          fill="url(#beam-gradient-green)"
          opacity="0.95"
        />
        
        {/* Magenta beam (right) */}
        <polygon
          points="20,2 26,46 34,46"
          fill="url(#beam-gradient-magenta)"
          opacity="0.95"
        />
      </svg>

      {/* Text */}
      {showText && (
        <span
          className={`font-bold ${text} tracking-tight`}
          style={{
            background: "linear-gradient(90deg, #00F5FF 0%, #00E676 40%, #E040FB 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Onebeam
        </span>
      )}
    </div>
  );
};

export const OnebeamIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size * 1.2}
    viewBox="0 0 40 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="icon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" />
        <stop offset="100%" stopColor="#00D4E5" />
      </linearGradient>
      <linearGradient id="icon-green" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E676" />
        <stop offset="100%" stopColor="#00C853" />
      </linearGradient>
      <linearGradient id="icon-magenta" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E040FB" />
        <stop offset="100%" stopColor="#D500F9" />
      </linearGradient>
      <radialGradient id="icon-glow" cx="50%" cy="0%" r="50%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    <circle cx="20" cy="2" r="4" fill="url(#icon-glow)" opacity="0.8" />
    <circle cx="20" cy="2" r="2" fill="#FFFFFF" />
    
    <polygon points="20,2 8,46 16,46" fill="url(#icon-cyan)" opacity="0.95" />
    <polygon points="20,2 16,46 26,46" fill="url(#icon-green)" opacity="0.95" />
    <polygon points="20,2 26,46 34,46" fill="url(#icon-magenta)" opacity="0.95" />
  </svg>
);

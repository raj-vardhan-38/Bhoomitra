import React from 'react';

/**
 * Subtle Cadastral / Agricultural Field Survey Grid Pattern.
 * Evokes aerial satellite parcel surveys, khesra plot boundaries, and surveyor coordinate markers.
 */
export function CadastralFieldPattern({ className = "opacity-[0.04]" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geo-cadastral-pattern" width="140" height="140" patternUnits="userSpaceOnUse">
            {/* Field boundary plot polygons (Khesra demarcations) */}
            <path d="M 0 0 L 140 0 L 140 140 L 0 140 Z" fill="none" stroke="#064e3b" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 0 55 L 90 55 L 90 140" fill="none" stroke="#064e3b" strokeWidth="1" />
            <path d="M 45 0 L 45 55" fill="none" stroke="#064e3b" strokeWidth="0.75" />
            <path d="M 90 0 L 140 50" fill="none" stroke="#064e3b" strokeWidth="0.75" strokeDasharray="2 2" />
            <path d="M 0 100 L 90 100" fill="none" stroke="#064e3b" strokeWidth="0.6" />
            
            {/* Surveyor coordinate crosshairs (+) at grid intersections */}
            <path d="M -6 0 L 6 0 M 0 -6 L 0 6" stroke="#047857" strokeWidth="1.2" />
            <path d="M 134 140 L 146 140 M 140 134 L 140 146" stroke="#047857" strokeWidth="1.2" />
            <path d="M 39 55 L 51 55 M 45 49 L 45 61" stroke="#047857" strokeWidth="1" />
            <path d="M 84 100 L 96 100 M 90 94 L 90 106" stroke="#047857" strokeWidth="1" />
            
            {/* Plot boundary demarcation vertices */}
            <circle cx="90" cy="55" r="1.5" fill="#047857" />
            <circle cx="45" cy="100" r="1.5" fill="#047857" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo-cadastral-pattern)" />
      </svg>
    </div>
  );
}

/**
 * Subtle Topographic Contour Isolines Pattern.
 * Evokes official GIS topographic maps, terrain contours, and elevation demarcations.
 */
export function TopographicPattern({ className = "opacity-[0.035]" }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geo-topo-pattern" width="260" height="260" patternUnits="userSpaceOnUse">
            {/* Elevation Contour Isolines */}
            <path d="M -20 40 C 40 10, 90 70, 150 30 S 230 65, 280 20" fill="none" stroke="#064e3b" strokeWidth="1.2" />
            <path d="M -20 85 C 30 55, 100 115, 160 75 S 220 105, 280 65" fill="none" stroke="#064e3b" strokeWidth="1" />
            <path d="M -20 130 C 50 100, 80 160, 140 120 S 240 150, 280 110" fill="none" stroke="#064e3b" strokeWidth="0.9" strokeDasharray="5 3" />
            <path d="M -20 175 C 20 145, 110 205, 170 165 S 210 195, 280 155" fill="none" stroke="#064e3b" strokeWidth="1" />
            <path d="M -20 220 C 40 190, 90 250, 150 210 S 230 240, 280 200" fill="none" stroke="#064e3b" strokeWidth="1.2" />
            
            {/* Closed Topographic Elevation Loops (Hill / Ridge / Depression) */}
            <path d="M 65 75 C 85 55, 120 55, 125 80 C 130 105, 100 115, 80 105 C 65 95, 55 85, 65 75 Z" fill="none" stroke="#047857" strokeWidth="0.8" />
            <path d="M 195 185 C 210 170, 235 170, 240 190 C 245 210, 220 220, 205 210 C 190 200, 185 195, 195 185 Z" fill="none" stroke="#047857" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo-topo-pattern)" />
      </svg>
    </div>
  );
}


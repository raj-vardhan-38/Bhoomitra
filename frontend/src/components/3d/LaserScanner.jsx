import React from 'react';

export default function LaserScanner({ isScanning }) {
  if (!isScanning) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl border-2 border-emerald-500/50">
      {/* Moving Emerald Laser Beam */}
      <div 
        className="w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_4px_rgba(52,211,153,0.8)] animate-laser-scan"
        style={{
          animation: 'laserSweep 2.2s ease-in-out infinite alternate',
        }}
      />

      {/* Holographic grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-80" />

      {/* Dynamic corner reticles */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

      {/* Scanning status pill */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-stone-900/85 backdrop-blur-md text-emerald-300 border border-emerald-500/50 text-[10px] font-sans font-bold">
        दस्तावेज़ विश्लेषण जारी...
      </div>
    </div>
  );
}


import React, { useRef } from 'react';

const REST_TRANSFORM = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

export default function TiltCard({ children, className = '', maxTilt = 12 }) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const frameRef = useRef(null);

  // Styles are set directly, at most once a frame. React state here would re-render the whole
  // card and everything inside it on every mouse movement.
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const card = cardRef.current;
      const glare = glareRef.current;
      if (!card || !glare) return;

      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -maxTilt;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      glare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`;
      glare.style.opacity = '0.15';
    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (cardRef.current) cardRef.current.style.transform = REST_TRANSFORM;
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
      className={`relative ${className}`}
    >
      {children}
      {/* Dynamic specular glare overlay */}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

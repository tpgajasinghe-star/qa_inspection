import React, { useState } from 'react';
import bgAsset from '../assets/images/qa_portal_bg_1788969103309.jpg';

export const BackgroundBackdrop: React.FC = () => {
  const [imgSrc, setImgSrc] = useState<string>(bgAsset);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100" 
      aria-hidden="true"
    >
      {/* Background Graphic */}
      <img
        src={imgSrc}
        alt="Luminous tech grid background"
        className="w-full h-full object-cover object-center scale-[1.01] filter brightness-[1.03] contrast-[1.02] transition-opacity duration-700"
        loading="eager"
        onError={() => {
          // Fallback if bundled asset fails
          if (imgSrc !== '/assets/qa-bg.jpg') {
            setImgSrc('/assets/qa-bg.jpg');
          }
        }}
      />
      {/* Soft Ambient Vignette & Dot Mesh Overlay */}
      <div 
        className="absolute inset-0 bg-white/25 backdrop-blur-[0.5px]"
        style={{
          backgroundImage: 'radial-gradient(#64748b 0.65px, transparent 0.65px)',
          backgroundSize: '24px 24px',
          opacity: 0.28,
        }}
      />
      {/* Subtle radial glow matching reference */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(186, 230, 253, 0.45) 0%, rgba(219, 234, 254, 0.25) 45%, transparent 75%)'
        }}
      />
    </div>
  );
};

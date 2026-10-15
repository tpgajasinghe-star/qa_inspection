import React, { useState, useEffect } from 'react';
import { Shield, ClipboardCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    // Smoothly animate progress bar to reach 100% at the end of the duration
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(current);
      if (elapsed >= duration) {
        clearInterval(progressInterval);
      }
    }, 25);

    // Timeout to hide splash screen and reveal the main dashboard
    const hideTimer = setTimeout(() => {
      setIsFading(true);
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, 350); // smooth fade exit

      return () => clearTimeout(exitTimer);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm transition-opacity duration-350 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Loading Quality Assurance Portal"
      role="dialog"
      aria-modal="true"
    >
      {/* Background radial ambient lights for high-tech aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-lg w-full">
        
        {/* Centered Glowing QA Icon Duo: Shield + ClipboardCheck */}
        <div className="relative flex items-center justify-center mb-7">
          {/* Outer glowing pulsing orb */}
          <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-green-400/25 to-cyan-500/25 blur-xl animate-pulse" />
          
          {/* Glass Icon Pod */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gray-950/80 border border-emerald-500/40 flex items-center justify-center shadow-2xl backdrop-blur-md">
            {/* Outer Shield with Neon Green/Cyan Drop Shadow Glow */}
            <Shield 
              className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 stroke-[1.6] drop-shadow-[0_0_25px_rgba(52,211,153,0.85)]" 
            />
            
            {/* Centered Clipboard representing Quality Inspection */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ClipboardCheck 
                className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-300 stroke-[2.2] drop-shadow-[0_0_18px_rgba(6,182,212,0.95)]" 
              />
            </div>

            {/* Corner glowing spark badge */}
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400/80 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Brand Text: QUALITY ASSURANCE PORTAL */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wider text-white font-sans drop-shadow-sm">
          QUALITY ASSURANCE PORTAL
        </h1>

        {/* Corporate subtitle indicator */}
        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold tracking-widest text-slate-400 uppercase">
          <span>Quality Meets Precision</span>
        </div>

        {/* Smaller Loading Text: LOADING QUALITY DATA... */}
        <p className="mt-8 text-xs sm:text-sm font-bold tracking-widest uppercase text-emerald-400 animate-pulse flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
          <span>LOADING QUALITY DATA...</span>
          <span className="text-[11px] font-mono text-cyan-300 ml-1">{progress}%</span>
        </p>

        {/* Animated Progress Bar with Neon Green/Cyan Gradient */}
        <div className="mt-4 w-64 sm:w-80 h-2 sm:h-2.5 bg-gray-800/90 rounded-full overflow-hidden p-0.5 border border-gray-700/60 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-500 transition-all duration-75 ease-out shadow-[0_0_14px_rgba(52,211,153,0.85)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Quick Skip button for immediate entry if desired */}
        <button
          type="button"
          onClick={() => {
            setIsFading(true);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete();
            }, 150);
          }}
          className="mt-6 text-[11px] font-semibold tracking-wider text-slate-500 hover:text-emerald-400 transition-colors uppercase cursor-pointer"
        >
          Skip Intro &rarr;
        </button>
      </div>
    </div>
  );
};

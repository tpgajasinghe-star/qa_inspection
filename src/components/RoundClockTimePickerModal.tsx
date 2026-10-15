import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, X, Sparkles } from 'lucide-react';

export interface RoundClockTimePickerModalProps {
  isOpen: boolean;
  initialValue?: string; // e.g. "08:30 AM", "14:15", "08:30"
  title?: string;
  onClose: () => void;
  onSelectTime: (timeStr: string) => void;
}

export const RoundClockTimePickerModal: React.FC<RoundClockTimePickerModalProps> = ({
  isOpen,
  initialValue = '',
  title = 'Select Inspection Time',
  onClose,
  onSelectTime,
}) => {
  // Parse initial value into hour (1-12), minute (0-59), and period ('AM' | 'PM')
  const parseInitial = () => {
    let h = 8;
    let m = 30;
    let p: 'AM' | 'PM' = 'AM';

    if (initialValue && typeof initialValue === 'string') {
      const trimmed = initialValue.trim();
      const match = trimmed.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
      if (match) {
        const parsedH = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if (match[3]) {
          p = match[3].toUpperCase() as 'AM' | 'PM';
          h = parsedH % 12 || 12;
        } else if (parsedH >= 12) {
          p = 'PM';
          h = parsedH === 12 ? 12 : parsedH - 12;
        } else {
          p = 'AM';
          h = parsedH === 0 ? 12 : parsedH;
        }
      }
    } else {
      // Default to current local time
      const now = new Date();
      const nowH = now.getHours();
      p = nowH >= 12 ? 'PM' : 'AM';
      h = nowH % 12 || 12;
      m = Math.round(now.getMinutes() / 5) * 5;
      if (m >= 60) m = 55;
    }

    return { 
      h: Math.min(Math.max(h || 8, 1), 12), 
      m: Math.min(Math.max(m || 0, 0), 59), 
      p 
    };
  };

  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [pickerMode, setPickerMode] = useState<'hour' | 'minute'>('hour');

  const clockRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitial();
      setSelectedHour(parsed.h);
      setSelectedMinute(parsed.m);
      setPeriod(parsed.p);
      setPickerMode('hour');
    }
  }, [isOpen, initialValue]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Formatted 12-hour time string (e.g., "08:30 AM")
  const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${period}`;

  // Handle setting to current time
  const handleSetCurrentTime = () => {
    const now = new Date();
    const nowH = now.getHours();
    const p: 'AM' | 'PM' = nowH >= 12 ? 'PM' : 'AM';
    const h = nowH % 12 || 12;
    const m = Math.round(now.getMinutes() / 5) * 5 % 60;
    setSelectedHour(h);
    setSelectedMinute(m);
    setPeriod(p);
  };

  // Convert clock face coordinates into hour or minute when dragging/clicking the dial background
  const handleCalculateFromCoordinates = (clientX: number, clientY: number, isFinalRelease: boolean = false) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    // Angle in degrees from top (12 o'clock = 0 deg)
    let deg = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (pickerMode === 'hour') {
      // 12 sectors of 30 degrees each
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 12;
      setSelectedHour(h);

      if (isFinalRelease) {
        // Transition to minute mode
        setPickerMode('minute');
      }
    } else {
      // 60 minutes, 6 degrees per minute (snap to nearest minute or 5-min intervals)
      let m = Math.round(deg / 6);
      if (m >= 60) m = 0;
      setSelectedMinute(m);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag if target is the clock dial itself, not an inner interactive button
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') {
      return;
    }
    isDraggingRef.current = true;
    handleCalculateFromCoordinates(e.clientX, e.clientY, false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    handleCalculateFromCoordinates(e.clientX, e.clientY, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    handleCalculateFromCoordinates(e.clientX, e.clientY, true);
  };

  // Clock calculations (240px diameter clock)
  const centerCoord = 120;
  const clockRadius = 90;

  // Selected angle for hand
  const handAngle = pickerMode === 'hour'
    ? (selectedHour % 12) * 30
    : selectedMinute * 6;

  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handEndX = centerCoord + clockRadius * Math.cos(handRad);
  const handEndY = centerCoord + clockRadius * Math.sin(handRad);

  // 12-hour clock face numbers: 12 at top, 1 to 11 clockwise
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleConfirm = () => {
    onSelectTime(formattedTime);
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Display: Digital Readout & AM/PM */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-4 text-white shadow-md">
          <div className="flex items-center justify-between mb-2 text-blue-100 text-xs font-semibold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-200" />
              <span>{title}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Big Digits for Hour and Minute */}
            <div className="flex items-center text-3xl sm:text-4xl font-black tracking-tight">
              <button
                type="button"
                onClick={() => setPickerMode('hour')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  pickerMode === 'hour'
                    ? 'bg-white text-blue-700 shadow-md font-black ring-2 ring-blue-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Click to set Hour"
              >
                {String(selectedHour).padStart(2, '0')}
              </button>

              <span className="text-white/70 px-1 animate-pulse font-bold">:</span>

              <button
                type="button"
                onClick={() => setPickerMode('minute')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  pickerMode === 'minute'
                    ? 'bg-white text-blue-700 shadow-md font-black ring-2 ring-blue-300'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Click to set Minute"
              >
                {String(selectedMinute).padStart(2, '0')}
              </button>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="flex flex-col bg-black/25 p-1 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => setPeriod('AM')}
                className={`px-3 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  period === 'AM'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod('PM')}
                className={`px-3 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer mt-0.5 ${
                  period === 'PM'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        {/* Mode Indicator & Switcher Tabs */}
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-xs border-b border-slate-100">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>Select {pickerMode === 'hour' ? 'Hour (1 - 12)' : 'Minutes (00 - 59)'}</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setPickerMode('hour')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition ${
                pickerMode === 'hour' 
                  ? 'bg-white text-blue-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hours
            </button>
            <button
              type="button"
              onClick={() => setPickerMode('minute')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition ${
                pickerMode === 'minute' 
                  ? 'bg-white text-blue-700 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Minutes
            </button>
          </div>
        </div>

        {/* 12-Hour Round Clock Face */}
        <div className="p-3 flex items-center justify-center">
          <div
            ref={clockRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-[240px] h-[240px] rounded-full bg-slate-50 border-2 border-slate-200/90 shadow-inner flex items-center justify-center cursor-pointer touch-none select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Center Pivot Point */}
            <div className="absolute w-3 h-3 rounded-full bg-blue-600 z-30 shadow-xs ring-2 ring-white" />

            {/* Clock Hand Pointer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 240 240"
            >
              {/* Hand Line */}
              <line
                x1={centerCoord}
                y1={centerCoord}
                x2={handEndX}
                y2={handEndY}
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Target Knob at Hand End */}
              <circle
                cx={handEndX}
                cy={handEndY}
                r="16"
                fill="#2563eb"
                className="shadow-sm"
              />
              <circle
                cx={handEndX}
                cy={handEndY}
                r="4"
                fill="#ffffff"
              />
            </svg>

            {/* Clock Face Numbers: Hour Mode (12-hour round clock 1-12) */}
            {pickerMode === 'hour' &&
              hoursList.map((hourNum) => {
                const angle = (hourNum % 12) * 30 - 90;
                const rad = angle * (Math.PI / 180);
                const x = centerCoord + clockRadius * Math.cos(rad);
                const y = centerCoord + clockRadius * Math.sin(rad);
                const isSelected = selectedHour === hourNum;

                return (
                  <button
                    key={hourNum}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHour(hourNum);
                      setPickerMode('minute');
                    }}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-20 cursor-pointer ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 hover:bg-blue-100 hover:text-blue-900 active:scale-95'
                    }`}
                    title={`Hour ${hourNum}`}
                  >
                    {hourNum}
                  </button>
                );
              })}

            {/* Clock Face Numbers: Minute Mode (00, 05, 10, ... 55) */}
            {pickerMode === 'minute' &&
              minutesList.map((minNum) => {
                const angle = (minNum / 60) * 360 - 90;
                const rad = angle * (Math.PI / 180);
                const x = centerCoord + clockRadius * Math.cos(rad);
                const y = centerCoord + clockRadius * Math.sin(rad);
                const isSelected = selectedMinute === minNum;

                return (
                  <button
                    key={minNum}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMinute(minNum);
                    }}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-20 cursor-pointer ${
                      isSelected
                        ? 'text-white font-black scale-110'
                        : 'text-slate-700 hover:bg-blue-100 hover:text-blue-900 active:scale-95'
                    }`}
                    title={`Minute ${String(minNum).padStart(2, '0')}`}
                  >
                    {String(minNum).padStart(2, '0')}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Quick Minute Interval Shortcuts */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Min:</span>
          <div className="flex items-center gap-1.5">
            {[0, 15, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setSelectedMinute(m);
                  setPickerMode('minute');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  selectedMinute === m 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'
                }`}
              >
                :{String(m).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Shift Presets Bar */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="font-bold text-slate-400 uppercase">Presets:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: '08:00 AM', h: 8, m: 0, p: 'AM' },
              { label: '08:30 AM', h: 8, m: 30, p: 'AM' },
              { label: '10:30 AM', h: 10, m: 30, p: 'AM' },
              { label: '01:30 PM', h: 1, m: 30, p: 'PM' },
              { label: '03:30 PM', h: 3, m: 30, p: 'PM' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSelectedHour(preset.h);
                  setSelectedMinute(preset.m);
                  setPeriod(preset.p as 'AM' | 'PM');
                }}
                className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 font-mono font-bold cursor-pointer transition"
              >
                {preset.label.replace(' ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSetCurrentTime}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Now</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Set Time ({formattedTime})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

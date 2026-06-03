import { useEffect, useRef } from 'react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

export default function PinPad({
  value,
  onChange,
  onComplete,
  onSubmit,
  disabled = false,
  length = 4,
  shake = false
}) {
  const lastCompletedRef = useRef('');

  function appendDigit(digit) {
    if (disabled || value.length >= length) return;
    onChange(`${value}${digit}`.slice(0, length));
  }

  function removeDigit() {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }

  function clearAll() {
    if (disabled) return;
    onChange('');
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (disabled) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        removeDigit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        clearAll();
      } else if (event.key === 'Enter' && value.length === length) {
        event.preventDefault();
        onSubmit?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, value, length, onSubmit]);

  useEffect(() => {
    if (value.length === length && onComplete && lastCompletedRef.current !== value) {
      lastCompletedRef.current = value;
      const timer = window.setTimeout(() => onComplete(value), 120);
      return () => window.clearTimeout(timer);
    }

    if (value.length < length) {
      lastCompletedRef.current = '';
    }
  }, [value, length, onComplete]);

  return (
    <div className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>
      <div className="flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-5">
        {Array.from({ length }).map((_, index) => (
          <span
            key={index}
            className={`h-4 w-4 rounded-full border transition ${
              index < value.length ? 'border-brand-300 bg-brand-400 shadow-[0_0_20px_rgba(52,211,153,0.45)]' : 'border-white/20 bg-white/5'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => {
          const isAction = key === 'clear' || key === 'back';
          const label = key === 'clear' ? 'Clear' : key === 'back' ? '⌫' : key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (key === 'clear') return clearAll();
                if (key === 'back') return removeDigit();
                appendDigit(key);
              }}
              className={`rounded-3xl border px-4 py-4 text-lg font-bold transition ${
                isAction
                  ? 'border-white/10 bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                  : 'border-brand-400/20 bg-brand-500/10 text-white hover:bg-brand-500/20'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

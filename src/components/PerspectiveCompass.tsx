import React from 'react';
import { NINE_AXES_META } from '../lib/perspectives';
import type { NineAxes } from '../types';

interface PerspectiveCompassProps {
  axes: NineAxes;
  compact?: boolean;
  showDescriptions?: boolean;
}

export function PerspectiveCompass({
  axes,
  compact = false,
  showDescriptions = false,
}: PerspectiveCompassProps) {
  const items = compact ? NINE_AXES_META.slice(0, 5) : NINE_AXES_META;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {items.map((meta) => {
        const value = Math.max(-100, Math.min(100, Math.round(axes[meta.key] ?? 0)));
        const leftPct = ((value + 100) / 200) * 100;
        const absVal = Math.abs(value);
        const leanLabel =
          absVal <= 12
            ? 'Posición equilibrada'
            : value < 0
              ? `${meta.leftLabel} (${absVal}%)`
              : `${meta.rightLabel} (${absVal}%)`;

        return (
          <div key={meta.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#292820]">
                {meta.title}
              </span>
              <span className="font-mono-tabular text-[11px] text-[#79613B]">
                {leanLabel}
              </span>
            </div>

            <div className="relative h-2 bg-[#F3F0E9] border border-[#E8E3D8] rounded-full">
              {/* Eje central */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#D7CEBC]" />
              {/* Tramo desde centro hasta valor */}
              {value !== 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-[#E6D8B9]"
                  style={{
                    left: value < 0 ? `${leftPct}%` : '50%',
                    width: `${Math.abs(leftPct - 50)}%`,
                  }}
                />
              )}
              {/* Marcador */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#A18450] shadow-sm transition-all duration-300"
                style={{ left: `${leftPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#777367]">
              <span>{meta.leftLabel}</span>
              <span>{meta.rightLabel}</span>
            </div>

            {showDescriptions && (
              <p className="text-xs text-[#777367] leading-relaxed pt-0.5">
                {meta.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

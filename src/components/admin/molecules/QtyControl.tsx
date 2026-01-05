"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

interface QtyControlProps {
  value: number;
  onChange: (value: number) => void;
  unit: string;
  minQty?: number;
  maxQty?: number;
  step?: number;
}

export default function QtyControl({
  value,
  onChange,
  unit,
  minQty = 1,
  maxQty = 9999,
  step,
}: QtyControlProps) {
  // STEP LOGIC BASED ON UNIT
  const autoStep =
    step ??
    (unit === "kq" || unit === "litr"
      ? 0.1
      : unit === "qram" || unit === "ml"
      ? 10
      : 1);

  // UPDATE VALUE INTERNALLY
  const applyValue = (v: number) => {
    // Clamp to min/max
    if (v < minQty) v = minQty;
    if (v > maxQty) v = maxQty;

    // Round based on step
    v = Number((Math.round(v / autoStep) * autoStep).toFixed(3));
    onChange(v);
  };

  return (
    <div
      className="
        flex items-center gap-2 
        rounded-2xl border border-gray-200 bg-white
        shadow-sm px-3 py-2
        w-fit
      "
    >
      <button
        className="p-1 rounded-md hover:bg-gray-100 transition"
        onClick={() => applyValue(value - autoStep)}
      >
        <Minus className="w-4 h-4" />
      </button>

      <input
        type="number"
        step={autoStep}
        value={value}
        onChange={(e) => applyValue(parseFloat(e.target.value))}
        className="
          w-16 text-center text-sm font-semibold 
          outline-none bg-transparent
        "
      />

      <button
        className="p-1 rounded-md hover:bg-gray-100 transition"
        onClick={() => applyValue(value + autoStep)}
      >
        <Plus className="w-4 h-4" />
      </button>

      <span className="text-xs font-semibold text-gray-500">{unit}</span>
    </div>
  );
}

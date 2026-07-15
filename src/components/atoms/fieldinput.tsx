// src/components/atoms/array-field-input.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { memo, useState, useCallback } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface ArrayFieldInputProps {
  items: string[];
  setItems: (items: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  label: string;
  limit?: number;
  inputType?: "text" | "url";
  disabled?: boolean;
  className?: string;
}

export const ArrayFieldInput = memo(
  ({
    items,
    setItems,
    placeholder = "Daxil edin...",
    icon,
    label,
    limit,
    inputType = "text",
    disabled = false,
    className = "",
  }: ArrayFieldInputProps) => {
    const [inputValue, setInputValue] = useState("");

    const handleAddItem = useCallback(() => {
      const value = inputValue.trim();
      if (value && !items.includes(value)) {
        if (!limit || items.length < limit) {
          setItems([...items, value]);
          setInputValue("");
        }
      }
    }, [inputValue, items, setItems, limit]);

    const handleRemoveItem = useCallback(
      (itemToRemove: string) => {
        setItems(items.filter((item) => item !== itemToRemove));
      },
      [items, setItems]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddItem();
        }
      },
      [handleAddItem]
    );

    const isLimitReached = limit !== undefined && items.length >= limit;

    return (
      <div className={`space-y-3 ${className}`}>
        <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
          {label}
          {limit && (
            <span className="text-xs text-slate-400 font-normal">
              ({items.length}/{limit})
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <Input
            name={`${label.toLowerCase().replace(/\s/g, "-")}-input`}
            value={inputValue}
            onChange={(value: string) => setInputValue(value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            icon={icon}
            type={inputType}
            className="flex-grow text-slate-800 placeholder:text-slate-400"
            disabled={disabled || isLimitReached}
          />
          <Button
            type="button"
            onClick={handleAddItem}
            variant="secondary"
            size="sm"
            disabled={!inputValue || isLimitReached || disabled}
            aria-label="Əlavə et"
            className="text-slate-600 hover:text-slate-900"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 min-h-[44px] border border-slate-200 rounded-xl p-3 bg-white shadow-inner">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm"
              >
                <span className="select-auto max-w-[200px] truncate">
                  {item.length > 30 ? `${item.substring(0, 30)}...` : item}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item)}
                  className="ml-2 p-0.5 rounded-full hover:bg-emerald-200 transition text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                  aria-label="Sil"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <p className="text-slate-400 text-sm italic self-center select-auto">
              Element yoxdur. Əlavə edin...
            </p>
          )}
        </div>
      </div>
    );
  }
);
ArrayFieldInput.displayName = "ArrayFieldInput";
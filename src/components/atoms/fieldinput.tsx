import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { memo, useState, useCallback } from "react";
import { Button } from "./button";
import { Input } from "./input";

// --- 3.6 Array Field Input (Tags/Images) ---
type ArrayFieldInputProps = {
    items: string[];
    setItems: (items: string[]) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    label: string;
    limit?: number;
    inputType?: 'text' | 'url';
};
export const ArrayFieldInput = memo(({ items, setItems, placeholder, icon, label, limit, inputType = 'text' }: ArrayFieldInputProps) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddItem = useCallback(() => {
        const value = inputValue.trim();
        if (value && !items.includes(value)) {
            if (!limit || items.length < limit) {
                setItems([...items, value]);
                setInputValue('');
            }
        }
    }, [inputValue, items, setItems, limit]);

    const handleRemoveItem = useCallback((itemToRemove: string) => {
        setItems(items.filter(item => item !== itemToRemove));
    }, [items, setItems]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    }, [handleAddItem]);

    // FIX: disabled propunun həmişə boolean tipində olmasını təmin et
    const isDisabled = limit !== undefined && items.length >= limit;

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex justify-between items-center">
                {label} {limit && <span className='text-xs text-gray-500 font-normal'>({items.length}/{limit})</span>}
            </label>
            <div className="flex gap-2">
                <Input
                    name={`${label.toLowerCase().replace(/\s/g, '-')}-input`} // Name propu əlavə edildi
                    value={inputValue}
                    onChange={(value: string) => setInputValue(value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    icon={icon}
                    type={inputType}
                    className="flex-grow"
                    disabled={isDisabled} // FIX: boolean dəyəri
                />
                <Button onClick={handleAddItem} variant="secondary" className='p-3 flex-shrink-0' disabled={!inputValue || isDisabled} title='Əlavə et'>
                    <Plus className="w-5 h-5" />
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 min-h-[40px] border border-gray-200 rounded-xl p-3 bg-white shadow-inner">
                <AnimatePresence>
                    {items.map((item) => (
                        <motion.div
                            key={item}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm"
                        >
                            <span>{item.length > 30 ? `${item.substring(0, 30)}...` : item}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                className="ml-2 p-0.5 rounded-full hover:bg-emerald-200 transition"
                                title="Sil"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {items.length === 0 && <p className='text-gray-400 text-sm italic self-center'>Element yoxdur. Əlavə edin...</p>}
            </div>
        </div>
    );
});
ArrayFieldInput.displayName = 'ArrayFieldInput';


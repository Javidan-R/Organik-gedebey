import { memo } from "react";
import { Button } from "./button";

// --- 3.7 Tab Button ---
type TabButtonProps = {
    label: string;
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    count?: number;
};
export const TabButton = memo(({ label, active, onClick, icon, count }: TabButtonProps) => (
    <Button
        variant={active ? 'primary' : 'soft'}
        onClick={onClick}
        className={`w-full justify-start shadow-none ${active ? 'ring-2 ring-offset-2 ring-emerald-500' : ''}`}
    >
        {icon}
        <span className='flex-grow text-left'>{label}</span>
        {count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white text-emerald-600' : 'bg-gray-300 text-gray-800'}`}>
                {count}
            </span>
        )}
    </Button>
));
TabButton.displayName = 'TabButton';

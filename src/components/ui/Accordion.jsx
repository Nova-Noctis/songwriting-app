import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Accordion = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="glass-panel rounded-2xl">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-200 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center">
                    <Icon className="mr-3 h-6 w-6 text-gray-300" />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && <div className="p-4 border-t border-white/10">{children}</div>}
        </div>
    );
};

export default Accordion;

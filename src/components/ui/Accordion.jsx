import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Accordion = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-200 hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center">
                    <Icon className="mr-3 h-6 w-6 text-indigo-400" />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {isOpen && <div className="p-4 border-t border-gray-700">{children}</div>}
        </div>
    );
};

export default Accordion;

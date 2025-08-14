import React from 'react';
import Spinner from './Spinner.jsx';

const CustomButton = ({ children, onClick, isLoading, className = '', icon: Icon }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className={`flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed ${className}`}
    >
        {isLoading ? <Spinner size={20} /> : (Icon && <Icon className="mr-2 h-5 w-5" />)}
        {children}
    </button>
);

export default CustomButton;

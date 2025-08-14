import React from 'react';

const MessageBox = ({ message, type = 'info' }) => {
    const baseClasses = "p-4 rounded-lg my-4 text-sm";
    const typeClasses = {
        info: "bg-blue-900/50 text-blue-200 border border-blue-700",
        success: "bg-green-900/50 text-green-200 border border-green-700",
        error: "bg-red-900/50 text-red-200 border border-red-700",
    };
    if (!message) return null;
    return <div className={`${baseClasses} ${typeClasses[type]}`}>{message}</div>;
};

export default MessageBox;
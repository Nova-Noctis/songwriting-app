import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 24 }) => (
    <Loader2 size={size} className="animate-spin text-indigo-400" />
);

export default Spinner;

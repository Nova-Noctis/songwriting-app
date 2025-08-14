import React, { useState, useCallback } from 'react';
import { callGeminiAPI } from '/src/api/gemini.js';
import CustomButton from '/src/components/ui/Button.jsx';
import { Wand2, RotateCcw } from 'lucide-react';

const CreativeTool = ({ title, placeholder, promptTemplate }) => {
    // ... restlicher Code bleibt unverändert
    const [input, setInput] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const generate = useCallback(async () => {
        if (!input) return;
        setIsLoading(true);
        const prompt = promptTemplate(input);
        const response = await callGeminiAPI(prompt);
        setResults(response.split('\n').filter(line => line.trim() !== '' && /^\d+\.\s/.test(line)));
        setIsLoading(false);
    }, [input, promptTemplate]);

    const handleReset = () => {
        setInput('');
        setResults([]);
    };

    return (
        <div className="space-y-2 mb-4">
             <h4 className="font-semibold text-gray-300">{title}</h4>
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200" />
            <div className="flex space-x-2">
                <CustomButton onClick={generate} isLoading={isLoading} className="w-full" icon={Wand2}>Generieren</CustomButton>
                <button onClick={handleReset} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" aria-label="Zurücksetzen"><RotateCcw size={20}/></button>
            </div>
            {results.length > 0 && <ul className="p-2 bg-gray-900 rounded-md text-gray-300 list-disc list-inside">{results.map((r, i) => <li key={i}>{r.replace(/^\d+\.\s/, '')}</li>)}</ul>}
        </div>
    );
};

export default CreativeTool;
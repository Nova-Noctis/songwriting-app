import React, { useState, useCallback } from 'react';
import { callGeminiAPI } from '/src/api/gemini.js';
import CustomButton from '/src/components/ui/Button.jsx';
import { Search, RotateCcw } from 'lucide-react';

const RhymeFinder = () => {
    // ... restlicher Code bleibt unverändert
    const [word, setWord] = useState('');
    const [rhymes, setRhymes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const findRhymes = useCallback(async () => {
        if (!word) return;
        setIsLoading(true);
        const prompt = `Finde eine Liste von 10-15 kreativen Reimen (Endreime und Assonanzen, für Rap geeignet) für das deutsche Wort "${word}". Gib nur die Wörter als kommagetrennte Liste zurück.`;
        const response = await callGeminiAPI(prompt);
        setRhymes(response.split(',').map(r => r.trim()));
        setIsLoading(false);
    }, [word]);
    
    const handleReset = () => {
        setWord('');
        setRhymes([]);
    };

    return (
        <div className="space-y-2">
            <input type="text" value={word} onChange={e => setWord(e.target.value)} placeholder="Wort eingeben..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200" />
            <div className="flex space-x-2">
                <CustomButton onClick={findRhymes} isLoading={isLoading} className="w-full" icon={Search}>Reime finden</CustomButton>
                <button onClick={handleReset} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" aria-label="Zurücksetzen"><RotateCcw size={20}/></button>
            </div>
            {rhymes.length > 0 && <div className="p-2 bg-gray-900 rounded-md text-gray-300">{rhymes.join(', ')}</div>}
        </div>
    );
};

export default RhymeFinder;
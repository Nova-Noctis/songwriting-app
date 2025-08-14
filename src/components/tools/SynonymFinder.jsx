import React, { useState, useCallback } from 'react';
import { fetchSynonyms } from '/src/api/thesaurus.js';
import CustomButton from '/src/components/ui/Button.jsx';
import { Search, RotateCcw } from 'lucide-react';

const SynonymFinder = () => {
    // ... restlicher Code bleibt unverändert
    const [word, setWord] = useState('');
    const [synonyms, setSynonyms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const findSynonyms = useCallback(async () => {
        if (!word) return;
        setIsLoading(true);
        const response = await fetchSynonyms(word);
        setSynonyms(response);
        setIsLoading(false);
    }, [word]);

    const handleReset = () => {
        setWord('');
        setSynonyms([]);
    };

    return (
        <div className="space-y-2">
            <input type="text" value={word} onChange={e => setWord(e.target.value)} placeholder="Wort eingeben..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200" />
             <div className="flex space-x-2">
                <CustomButton onClick={findSynonyms} isLoading={isLoading} className="w-full" icon={Search}>Synonyme finden</CustomButton>
                <button onClick={handleReset} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" aria-label="Zurücksetzen"><RotateCcw size={20}/></button>
            </div>
            {synonyms.length > 0 && <div className="p-2 bg-gray-900 rounded-md text-gray-300">{synonyms.join(', ')}</div>}
        </div>
    );
};

export default SynonymFinder;
import React, { useState, useCallback } from 'react';
import { callGeminiAPI } from '@/api/gemini.js';
import CustomButton from '@/components/ui/Button.jsx';
import { Search, RotateCcw } from 'lucide-react';

const RhymeFinder = () => {
    const [word, setWord] = useState('');
    // Zustand erweitert, um mehrsilbige Reime zu speichern
    const [rhymes, setRhymes] = useState({ endreime: [], assonanzen: [], mehrsilbigeReime: [] });
    const [isLoading, setIsLoading] = useState(false);

    const findRhymes = useCallback(async () => {
        if (!word) return;
        setIsLoading(true);
        setRhymes({ endreime: [], assonanzen: [], mehrsilbigeReime: [] }); // Ergebnisse bei neuer Suche zurücksetzen

        // **ÄNDERUNG 1: Der Prompt wurde um eine dritte Kategorie erweitert**
        const prompt = `
            Erstelle eine Liste von Reimen für das deutsche Wort "${word}". Die Liste soll für Songwriting im modernen Pop & Rap geeignet sein.
            Gib die Antwort in drei klar getrennten Abschnitten zurück. Verwende exakt die folgenden Überschriften und formatiere die Wörter als kommagetrennte Liste:

            ### Endreime
            [Hier eine kommagetrennte Liste von 5-10 exakten Endreimen.]

            ### Assonanzen
            [Hier eine kommagetrennte Liste von 5-10 passenden Assonanzen (Halbreime, bei denen sich die Vokale reimen).]

            ### Mehrsilbige Reime
            [Hier eine kommagetrennte Liste von 3-5 mehrsilbigen Reimen oder zusammengesetzten Wörtern, die sich auf "${word}" reimen. Achte hierbei besonders auf die Übereinstimmung der Vokale und der Silbenanzahl, z.B. "Sommernacht" auf "Kontrabass".]
        `;

        const response = await callGeminiAPI(prompt);

        // **ÄNDERUNG 2: Verarbeiten der erweiterten Antwort**
        const endreimeMatch = response.match(/### Endreime\s*([\s\S]*?)(?:\s*### Assonanzen|$)/);
        const assonanzenMatch = response.match(/### Assonanzen\s*([\s\S]*?)(?:\s*### Mehrsilbige Reime|$)/);
        const mehrsilbigeMatch = response.match(/### Mehrsilbige Reime\s*([\s\S]*)/);


        const endreime = endreimeMatch && endreimeMatch[1].trim() ? endreimeMatch[1].trim().split(',').map(r => r.trim()) : [];
        const assonanzen = assonanzenMatch && assonanzenMatch[1].trim() ? assonanzenMatch[1].trim().split(',').map(r => r.trim()) : [];
        const mehrsilbigeReime = mehrsilbigeMatch && mehrsilbigeMatch[1].trim() ? mehrsilbigeMatch[1].trim().split(',').map(r => r.trim()) : [];

        setRhymes({ endreime, assonanzen, mehrsilbigeReime });
        setIsLoading(false);
    }, [word]);
    
    const handleReset = () => {
        setWord('');
        setRhymes({ endreime: [], assonanzen: [], mehrsilbigeReime: [] });
    };

    return (
        <div className="space-y-2">
            <input type="text" value={word} onChange={e => setWord(e.target.value)} placeholder="Wort eingeben..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200" />
            <div className="flex space-x-2">
                <CustomButton onClick={findRhymes} isLoading={isLoading} className="w-full" icon={Search}>Reime finden</CustomButton>
                <button onClick={handleReset} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" aria-label="Zurücksetzen"><RotateCcw size={20}/></button>
            </div>
            
            {/* **ÄNDERUNG 3: Angepasste Anzeige der Ergebnisse** */}
            {(rhymes.endreime.length > 0 || rhymes.assonanzen.length > 0 || rhymes.mehrsilbigeReime.length > 0) && (
                <div className="p-3 mt-2 bg-gray-900 rounded-md text-gray-300 space-y-3">
                    {rhymes.endreime.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-indigo-400 text-sm">Endreime:</h4>
                            <p className="text-sm">{rhymes.endreime.join(', ')}</p>
                        </div>
                    )}
                    {rhymes.assonanzen.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-indigo-400 text-sm">Assonanzen:</h4>
                            <p className="text-sm">{rhymes.assonanzen.join(', ')}</p>
                        </div>
                    )}
                    {rhymes.mehrsilbigeReime.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-indigo-400 text-sm">Mehrsilbige Reime:</h4>
                            <p className="text-sm">{rhymes.mehrsilbigeReime.join(', ')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RhymeFinder;
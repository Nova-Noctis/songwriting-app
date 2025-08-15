import React, { useState, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { callGeminiAPI } from '@/api/gemini.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { BrainCircuit, Sparkles, Save, Wand2, RefreshCw, Lightbulb } from 'lucide-react';

const appId = 'default-songwriting-app';

// Hilfsfunktion: Parst den Songtext in ein Array aus Objekten für die Darstellung
const parseSongtextForDisplay = (songtext) => {
    if (!songtext) return [];
    const parts = songtext.split(/(\[.*?\])/).filter(Boolean);
    const structuredText = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('[') && part.endsWith(']')) {
            const headerContent = part.slice(1, -1);
            const lyricsContent = parts[i + 1] ? parts[i + 1].trim() : '';
            structuredText.push({
                type: 'section',
                header: headerContent,
                lyrics: lyricsContent,
            });
            i++;
        } else {
            structuredText.push({ type: 'lyricsOnly', lyrics: part.trim() });
        }
    }
    return structuredText;
};


const Generator = ({ userId, myLyrics, externalLyrics, setActiveTab }) => {
    // State für die Eingabefelder
    const [idea, setIdea] = useState('');
    const [perspective, setPerspective] = useState('Keine');
    const [genre, setGenre] = useState('Freie Wahl');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [instructions, setInstructions] = useState('');

    // State für den Generierungsprozess
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingPart, setRegeneratingPart] = useState(null);
    const [isLoadingInspire, setIsLoadingInspire] = useState(false); // NEU: Ladezustand für "Inspiriere mich"

    // State für die Ergebnisse
    const [generatedSong, setGeneratedSong] = useState(null);
    const [generatedIdeas, setGeneratedIdeas] = useState([]);
    const [message, setMessage] = useState(null);

    const genres = [
        'Freie Wahl', 'Urban-Pop / Rap', 'Indie-Folk', 'Rock / Punk', '80er Synth-Pop',
        'East Coast Hip-Hop', 'West Coast Hip-Hop', 'Trap', 'Gangsta-Rap', 'Conscious Hip-Hop',
        'Lo-Fi Hip-Hop', 'Drill', 'Grime', 'Dance-Pop', 'Synth-Pop', 'Indie-Pop', 'Pop-Rock',
        'Power-Pop', 'J-Pop (Japanischer Pop)', 'K-Pop (Koreanischer Pop)', 'Schlager',
        'Contemporary R&B', 'Neo-Soul', 'Funk', 'Soul', 'Motown', 'EDM', 'Techno'
    ];

    const perspectives = [
        'Keine', 'Ich-Perspektive', 'Du-Perspektive', 'Er/Sie/Es-Perspektive (Dritte-Person-Perspektive)',
        'Wir-Perspektive', 'Ihr-Perspektive', 'Auktoriale (allwissende) Perspektive',
        'Neutrale (beobachtende) Perspektive', 'Wechselnde Perspektiven'
    ];

    const generateRandomIdeas = async () => {
        setIsLoadingIdeas(true);
        setGeneratedIdeas([]);
        const prompt = "Erstelle 5 äußerst kreative und thematisch vielfältige Song-Ideen für einen modernen deutschen Pop- oder Rap-Song. Decke eine breite Palette an Themen ab, wie zum Beispiel Natur (ein Sturm zieht auf), Gesellschaftskritik (die Stille in einer lauten Stadt), Science-Fiction (der letzte Mensch auf der Erde findet eine alte Schallplatte) oder historische Ereignisse (ein Brief aus dem Krieg). Vermeide alltägliche, persönliche Beziehungsthemen oder Ideen, die sich nur um Social Media und das digitale Leben drehen. Jede Idee sollte nur ein kurzer, inspirierender Satz sein. Gib nur die 5 Sätze zurück, getrennt durch einen Zeilenumbruch, ohne Nummerierung oder zusätzliche Erklärungen.";
        
        const response = await callGeminiAPI(prompt);
        
        if (typeof response === 'string' && !response.startsWith('Fehler:')) {
            const ideas = response.split('\n').filter(line => line.trim() !== '');
            setGeneratedIdeas(ideas);
        } else {
            setMessage({ type: 'error', text: response });
        }
        setIsLoadingIdeas(false);
    };

    // NEUE FUNKTION: Füllt alle Felder zufällig aus
    const handleInspireMe = async () => {
        setIsLoadingInspire(true);
        setMessage(null);
        setGeneratedSong(null);
        setGeneratedIdeas([]);

        // Zufälliges Genre und Perspektive auswählen
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
        
        setGenre(randomGenre);
        setPerspective(randomPerspective);

        // Zufällige Idee von der KI holen
        const ideaPrompt = "Gib mir eine einzige, äußerst kreative und unerwartete Song-Idee für das Genre '" + randomGenre + "'. Die Idee sollte nur ein kurzer, inspirierender Satz sein.";
        const randomIdea = await callGeminiAPI(ideaPrompt);
        
        if (typeof randomIdea === 'string' && !randomIdea.startsWith('Fehler:')) {
            setIdea(randomIdea.trim());
        } else {
            setIdea("Ein unerwarteter Moment der Stille"); // Fallback
            setMessage({ type: 'error', text: randomIdea });
        }

        // Andere Felder zurücksetzen
        setInstructions('');
        setNegativePrompt('');

        setIsLoadingInspire(false);
    };

    const handleGenerateSong = async () => {
        // ... (handleGenerateSong Funktion bleibt unverändert)
    };

    const handleRegeneratePart = async (partToRegen) => {
        // ... (handleRegeneratePart Funktion bleibt unverändert)
    };

    const saveSong = async () => {
        // ... (saveSong Funktion bleibt unverändert)
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-100 flex items-center"><BrainCircuit className="mr-3 text-indigo-400"/>Song-Generator</h2>
                 {/* NEUER BUTTON */}
                 <CustomButton onClick={handleInspireMe} isLoading={isLoadingInspire} className="bg-amber-600 hover:bg-amber-700" icon={Lightbulb}>
                    Inspiriere mich
                 </CustomButton>
            </div>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="space-y-4">
                    {/* Song-Idee */}
                    <div>
                        <label htmlFor="song-idea" className="block text-sm font-medium text-gray-300 mb-1">Song-Idee</label>
                        <textarea id="song-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Z.B. Zwei Freunde treffen sich nach langer Zeit wieder..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md" rows="3"></textarea>
                        <CustomButton onClick={generateRandomIdeas} isLoading={isLoadingIdeas} className="mt-2 bg-gray-700 hover:bg-gray-600" icon={Wand2}>5 Ideen vorschlagen</CustomButton>
                    </div>

                    {generatedIdeas.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <h4 className="font-semibold text-gray-300 mb-2">Wähle eine Idee aus:</h4>
                            <ul className="space-y-2">{generatedIdeas.map((genIdea, index) => (<li key={index}><button onClick={() => { setIdea(genIdea); setGeneratedIdeas([]); }} className="w-full text-left p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300">{genIdea}</button></li>))}</ul>
                        </div>
                    )}
                    
                    {/* Genre / Stil */}
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-1">Genre / Stil</label>
                        <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md">
                            <option>Freie Wahl</option>
                            <optgroup label="Hip-Hop / Rap">
                                <option>Urban-Pop / Rap</option>
                                <option>East Coast Hip-Hop</option>
                                <option>West Coast Hip-Hop</option>
                                <option>Trap</option>
                                <option>Gangsta-Rap</option>
                                <option>Conscious Hip-Hop</option>
                                <option>Lo-Fi Hip-Hop</option>
                                <option>Drill</option>
                                <option>Grime</option>
                            </optgroup>
                            <optgroup label="Pop">
                                <option>Dance-Pop</option>
                                <option>Synth-Pop</option>
                                <option>Indie-Pop</option>
                                <option>Pop-Rock</option>
                                <option>Power-Pop</option>
                                <option>J-Pop (Japanischer Pop)</option>
                                <option>K-Pop (Koreanischer Pop)</option>
                                <option>Schlager</option>
                            </optgroup>
                            <optgroup label="R&B / Soul">
                                <option>Contemporary R&B</option>
                                <option>Neo-Soul</option>
                                <option>Funk</option>
                                <option>Soul</option>
                                <option>Motown</option>
                            </optgroup>
                             <optgroup label="Electronic">
                                <option>EDM</option>
                                <option>Techno</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Perspektive */}
                    <div>
                        <label htmlFor="perspective" className="block text-sm font-medium text-gray-300 mb-1">Perspektive</label>
                        <select id="perspective" value={perspective} onChange={(e) => setPerspective(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md">
                            <option>Keine</option>
                            <option>Ich-Perspektive</option>
                            <option>Du-Perspektive</option>
                            <option>Er/Sie/Es-Perspektive (Dritte-Person-Perspektive)</option>
                            <option>Wir-Perspektive</option>
                            <option>Ihr-Perspektive</option>
                            <option>Auktoriale (allwissende) Perspektive</option>
                            <option>Neutrale (beobachtende) Perspektive</option>
                            <option>Wechselnde Perspektiven</option>
                        </select>
                    </div>

                    {/* Negativ-Prompt */}
                    <div>
                        <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-1">Was soll vermieden werden?</label>
                        <textarea id="negative-prompt" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Z.B. Keine Tränen, kein Regen, keine gebrochenen Herzen..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md" rows="2"></textarea>
                    </div>

                    {/* Zusätzliche Anweisungen */}
                    <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-1">Zusätzliche Anweisungen</label>
                        <textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Z.B. Der Refrain soll sich wiederholen..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md" rows="2"></textarea>
                    </div>
                    <CustomButton onClick={handleGenerateSong} isLoading={isLoading} className="w-full" icon={Sparkles}>Songtext generieren</CustomButton>
                </div>
            </div>

            {isLoading && <div className="flex justify-center p-8"><Spinner size={48} /></div>}
            {message && <MessageBox message={message.text} type={message.type} />}

            {generatedSong && (
                <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-6">
                    {generatedSong.storyline && ( <div> <h3 className="text-xl font-semibold text-indigo-400 mb-2">Storyline</h3> <p className="text-gray-300 whitespace-pre-wrap">{generatedSong.storyline}</p> </div> )}
                    {generatedSong.arrangement && ( <div> <h3 className="text-xl font-semibold text-indigo-400 mb-2">Arrangement</h3> <p className="text-gray-300 whitespace-pre-wrap">{generatedSong.arrangement}</p> </div> )}
                    
                    <div>
                        <h3 className="text-xl font-semibold text-indigo-400 mb-2">Songtext</h3>
                        <div className="p-4 bg-gray-900 rounded-md font-mono text-gray-200 space-y-4">
                            {parseSongtextForDisplay(generatedSong.songtext).map((part, index) => (
                                <div key={index}>
                                    {part.type === 'section' && (
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-indigo-300">[{part.header}]</h4>
                                            <button
                                                onClick={() => handleRegeneratePart(part.header)}
                                                disabled={isRegenerating}
                                                className="flex items-center px-2 py-1 bg-gray-700 text-xs text-gray-300 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                            >
                                                {isRegenerating && regeneratingPart === part.header ? <Spinner size={14} /> : <RefreshCw size={12} className="mr-1.5"/>}
                                                Neu generieren
                                            </button>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{part.lyrics}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <CustomButton onClick={saveSong} icon={Save}>Generierten Song speichern</CustomButton>
                </div>
            )}
        </div>
    );
};

export default Generator;

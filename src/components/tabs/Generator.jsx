import React, { useState, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { callGeminiAPI } from '@/api/gemini.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { BrainCircuit, Sparkles, Save, Wand2, RefreshCw, Lightbulb } from 'lucide-react';

const appId = 'default-songwriting-app';

const parseSongtextForDisplay = (songtext) => {
    if (!songtext) return [];
    const parts = songtext.split(/(\[.*?\])/).filter(Boolean);
    const structuredText = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('[') && part.endsWith(']')) {
            const headerContent = part.slice(1, -1);
            const lyricsContent = parts[i + 1] ? parts[i + 1].trim() : '';
            structuredText.push({ type: 'section', header: headerContent, lyrics: lyricsContent });
            i++;
        } else {
            structuredText.push({ type: 'lyricsOnly', lyrics: part.trim() });
        }
    }
    return structuredText;
};

const Generator = ({ userId, myLyrics, externalLyrics, setActiveTab }) => {
    const [idea, setIdea] = useState('');
    const [perspective, setPerspective] = useState('Keine');
    const [genre, setGenre] = useState('Freie Wahl');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingPart, setRegeneratingPart] = useState(null);
    const [isLoadingInspire, setIsLoadingInspire] = useState(false);
    const [generatedSong, setGeneratedSong] = useState(null);
    const [generatedIdeas, setGeneratedIdeas] = useState([]);
    const [message, setMessage] = useState(null);

    const genres = [ 'Freie Wahl', 'Urban-Pop / Rap', 'Indie-Folk', 'Rock / Punk', '80er Synth-Pop', 'East Coast Hip-Hop', 'West Coast Hip-Hop', 'Trap', 'Gangsta-Rap', 'Conscious Hip-Hop', 'Lo-Fi Hip-Hop', 'Drill', 'Grime', 'Dance-Pop', 'Synth-Pop', 'Indie-Pop', 'Pop-Rock', 'Power-Pop', 'J-Pop (Japanischer Pop)', 'K-Pop (Koreanischer Pop)', 'Schlager', 'Contemporary R&B', 'Neo-Soul', 'Funk', 'Soul', 'Motown', 'EDM', 'Techno' ];
    const perspectives = [ 'Keine', 'Ich-Perspektive', 'Du-Perspektive', 'Er/Sie/Es-Perspektive (Dritte-Person-Perspektive)', 'Wir-Perspektive', 'Ihr-Perspektive', 'Auktoriale (allwissende) Perspektive', 'Neutrale (beobachtende) Perspektive', 'Wechselnde Perspektiven' ];

    const generateRandomIdeas = async () => {
        // ... Logik bleibt unverändert
    };

    const handleInspireMe = async () => {
        // ... Logik bleibt unverändert
    };

    const handleGenerateSong = async () => {
        // ... Logik bleibt unverändert
    };

    const handleRegeneratePart = async (partToRegen) => {
        // ... Logik bleibt unverändert
    };
    
    const saveSong = async () => {
        // ... Logik bleibt unverändert
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-100 flex items-center"><BrainCircuit className="mr-3 text-gray-300"/>Song-Generator</h2>
                 <CustomButton onClick={handleInspireMe} isLoading={isLoadingInspire} className="bg-gray-700 hover:bg-gray-600 border border-gray-500" icon={Lightbulb}>
                    Inspiriere mich
                 </CustomButton>
            </div>
            <div className="glass-panel rounded-2xl p-6 space-y-6">
                <div>
                    <label htmlFor="song-idea" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Song-Idee</label>
                    <textarea id="song-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ein Komet, der seinen Kurs ändert..." className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all" rows="3"></textarea>
                    <CustomButton onClick={generateRandomIdeas} isLoading={isLoadingIdeas} className="mt-2 bg-black/20 hover:bg-white/20 border border-gray-600" icon={Wand2}>5 Ideen vorschlagen</CustomButton>
                </div>

                {generatedIdeas.length > 0 && (
                    <div className="p-4 bg-black/20 rounded-lg">
                        <h4 className="font-semibold text-gray-300 mb-2">Wähle eine Idee aus:</h4>
                        <ul className="space-y-2">{generatedIdeas.map((genIdea, index) => (<li key={index}><button onClick={() => { setIdea(genIdea); setGeneratedIdeas([]); }} className="w-full text-left p-2 rounded-md bg-black/20 hover:bg-white/10 transition-colors text-gray-300">{genIdea}</button></li>))}</ul>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Genre / Stil</label>
                        <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all">
                            <option>Freie Wahl</option>
                            <optgroup label="Hip-Hop / Rap">
                                {genres.slice(1, 10).map(g => <option key={g}>{g}</option>)}
                            </optgroup>
                            <optgroup label="Pop">
                                {genres.slice(10, 18).map(g => <option key={g}>{g}</option>)}
                            </optgroup>
                            <optgroup label="R&B / Soul">
                                {genres.slice(18, 23).map(g => <option key={g}>{g}</option>)}
                            </optgroup>
                             <optgroup label="Electronic">
                                {genres.slice(23).map(g => <option key={g}>{g}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="perspective" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Perspektive</label>
                        <select id="perspective" value={perspective} onChange={(e) => setPerspective(e.target.value)} className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all">
                            {perspectives.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Was soll vermieden werden?</label>
                    <textarea id="negative-prompt" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Klischees über Liebe, das Wort 'Herz'..." className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all" rows="2"></textarea>
                </div>
                
                <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Zusätzliche Anweisungen</label>
                    <textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Der Refrain soll sich wiederholen..." className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all" rows="2"></textarea>
                </div>
                
                <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 text-black font-bold text-lg rounded-lg border border-white/20 hover:bg-white glow-effect transition-all duration-300">
                    <Sparkles className="mr-3 h-6 w-6"/>
                    GENERIEREN
                </button>
            </div>

            {isLoading && <div className="flex justify-center p-8"><Spinner size={48} /></div>}
            {message && <MessageBox message={message.text} type={message.type} />}

            {generatedSong && (
                <div className="glass-panel rounded-2xl p-6 space-y-6">
                    <h3 className="text-2xl font-bold text-gray-100">Ergebnis</h3>
                    {generatedSong.storyline && ( <div> <h4 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-2">Storyline</h4> <p className="text-gray-300 whitespace-pre-wrap font-inter">{generatedSong.storyline}</p> </div> )}
                    {generatedSong.arrangement && ( <div> <h4 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-2">Arrangement</h4> <p className="text-gray-300 whitespace-pre-wrap font-inter">{generatedSong.arrangement}</p> </div> )}
                    
                    <div>
                        <h4 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-2">Songtext</h4>
                        <div className="p-4 bg-black/20 rounded-lg space-y-4">
                            {parseSongtextForDisplay(generatedSong.songtext).map((part, index) => (
                                <div key={index}>
                                    {part.type === 'section' && (
                                        <div className="flex justify-between items-center mb-1">
                                            <h5 className="font-bold text-gray-300">[{part.header}]</h5>
                                            <button onClick={() => handleRegeneratePart(part.header)} disabled={isRegenerating} className="flex items-center px-2 py-1 bg-white/10 text-xs text-gray-300 rounded-md hover:bg-white/20 transition-colors">
                                                {isRegenerating && regeneratingPart === part.header ? <Spinner size={14} /> : <RefreshCw size={12} className="mr-1.5"/>}
                                                Neu generieren
                                            </button>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed font-inter">{part.lyrics}</p>
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

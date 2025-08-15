import React, { useState, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { callGeminiAPI } from '@/api/gemini.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { BrainCircuit, Sparkles, Save, Wand2, RefreshCw } from 'lucide-react';

const appId = 'default-songwriting-app';

const Generator = ({ userId, myLyrics, externalLyrics, setActiveTab }) => {
    // State für die Eingabefelder
    const [idea, setIdea] = useState('');
    const [perspective, setPerspective] = useState('Keine');
    const [genre, setGenre] = useState('Urban-Pop / Rap'); // NEU: Genre-Auswahl
    const [negativePrompt, setNegativePrompt] = useState(''); // NEU: Negativ-Prompt
    const [instructions, setInstructions] = useState('');

    // State für den Generierungsprozess
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regeneratingPart, setRegeneratingPart] = useState(null);

    // State für die Ergebnisse
    const [generatedSong, setGeneratedSong] = useState(null);
    const [generatedIdeas, setGeneratedIdeas] = useState([]);
    const [message, setMessage] = useState(null);

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

    const handleGenerateSong = async () => {
        if (!idea) {
            setMessage({ type: 'error', text: 'Bitte gib eine Song-Idee ein.' });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        setGeneratedSong(null);

        const myLyricsReference = myLyrics.map(lyric => `Titel: ${lyric.title}\nText:\n${lyric.content}`).join('\n\n---\n\n');
        const externalLyricsReference = externalLyrics.map(lyric => lyric.content).join('\n\n---\n\n');

        const genreInstructions = {
            'Urban-Pop / Rap': "Du bist ein erfahrener und vielseitiger Songwriter für deutschen Pop und Urban-Pop. Deine Stärke ist es, spezifische Stimmungen und klare Geschichten in eine moderne, authentische Sprache zu gießen, die direkt ins Herz trifft. Deine Texte sind mal tanzbar und ironisch, mal tief melancholisch und verletzlich.",
            'Indie-Folk': "Du bist ein Singer-Songwriter im Stil des deutschen Indie-Folk. Dein Fokus liegt auf ehrlicher, einfacher Sprache, akustischen Stimmungen und Natur-Metaphern. Schreibe einen Text, der sich anfühlt, als würde er am Lagerfeuer erzählt.",
            'Rock / Punk': "Du bist ein Texter für eine deutsche Rock/Punk-Band. Deine Sprache ist energiegeladen, direkt und roh. Behandle gesellschaftskritische Themen oder persönliche Wut. Die Struktur sollte einfach und kraftvoll sein.",
            '80er Synth-Pop': "Du schreibst Texte im Stil des 80er-Jahre Synth-Pop. Erzeuge eine cineastische Nacht-Atmosphäre. Behandle Themen wie Sehnsucht, Eskapismus und Großstadtlichter. Die Sprache ist oft nostalgisch und bildhaft.",
            'Trap / Cloud Rap': "Du bist ein Künstler im Bereich Trap und Cloud Rap. Dein Stil ist Vibe-orientiert, oft mit Fokus auf materialistischen Themen, aber auch auf emotionaler Leere und Drogen. Nutze Ad-Libs und einen fragmentarischen, melodischen Flow.",
        };
        
        const selectedGenreInstruction = genreInstructions[genre] || genreInstructions['Urban-Pop / Rap'];

        const prompt = `
            ${selectedGenreInstruction}

            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine besonderen."}
            - **Inhalte, die vermieden werden sollen:** ${negativePrompt || "Keine besonderen."}

            **DEIN KREATIVES REGELWERK:**
            // ... (Hier bleibt das detaillierte Regelwerk aus der vorherigen Version)
            **1. Thematische Umschreibung (Wichtigste Regel):**
            - Das Kernthema der Song-Idee darf im Text **niemals direkt genannt** werden. Es muss ausschließlich durch Bilder, Handlungen und Gefühle umschrieben werden.

            **2. Storytelling & Emotion (Das Herz):**
            - **Geschichte > Poesie:** Eine klare, nachvollziehbare Geschichte oder Situation steht im Mittelpunkt.
            - **Dynamische Szenen & Entwicklung:** Die Geschichte darf nicht statisch sein. Sie muss sich durch verschiedene Momente oder emotionale Zustände bewegen.
            - **Der Twist:** Baue ein überraschendes Element oder einen unerwarteten Perspektivwechsel ein, idealerweise in der Bridge.
            - **Konkretes "Show, Don't Tell":** Zeige Emotionen durch präzise, alltägliche Beobachtungen und Handlungen.

            **3. Lyrische Technik & Originalität:**
            - **Intelligente & Effiziente Bildsprache:** Nutze eine anspruchsvolle, intelligente Wortwahl und male detailreiche Bilder durch starke Verben und prägnante Adjektive.
            - **Kraftvolle Umschreibungen statt Klischees:** Vermeide abgedroschene Darstellungen wie "Die Luft ist schwer".
            - **Wort-Tabus:** Vermeide klischeehafte Bilder und die Worte: Schatten, Echo, Kälte, Glanz, zerbricht, rast, kalt, Asphalt.
            - **Dynamische Wortwahl:** Achte aktiv auf Wortwiederholungen und ersetze generische Wörter.

            **4. Flow & Musikalität (Struktur von Strophe und Refrain):**
            - **Verse (Strophen) - Anspruchsvolle Reimketten:** Baue in den Strophen gezielt anspruchsvolle, mehrsilbige Reimketten ein, die sich über mehrere Zeilen erstrecken.
            - **Hook (Refrain) - Eingängige Melodik:** Der Refrain muss im starken Kontrast zur Strophe stehen: extrem eingängig (catchy), melodisch und sofort singbar.
            - **Rhythmusgefühl:** Variiere die Satzlänge stark, um Dynamik zu erzeugen.
            
            **AUSGABEFORMAT (EXAKT EINZUHALTEN):**
            Gib deine Antwort in drei klar getrennten Abschnitten zurück: ### Storyline, ### Arrangement, ### Songtext.
        `;

        const response = await callGeminiAPI(prompt);
        
        const storylineMatch = response.match(/### Storyline\s*([\s\S]*?)\s*### Arrangement/);
        const arrangementMatch = response.match(/### Arrangement\s*([\s\S]*?)\s*### Songtext/);
        const songtextMatch = response.match(/### Songtext\s*([\s\S]*)/);

        if (storylineMatch && arrangementMatch && songtextMatch) {
            setGeneratedSong({
                storyline: storylineMatch[1].trim(),
                arrangement: arrangementMatch[1].trim(),
                songtext: songtextMatch[1].trim(),
            });
        } else {
            setGeneratedSong({ songtext: response });
            setMessage({type: 'info', text: 'Die KI-Antwort konnte nicht vollständig strukturiert werden, hier ist das Ergebnis.'})
        }
        
        setIsLoading(false);
    };

    // NEUE FUNKTION: Iterative Bearbeitung einzelner Songteile
    const handleRegeneratePart = async (partToRegen) => {
        setIsRegenerating(true);
        setRegeneratingPart(partToRegen);

        const prompt = `
            Aufgabe: Überarbeite einen bestimmten Teil eines vorhandenen Songtextes.
            
            **Vorhandener Songtext:**
            ${generatedSong.songtext}

            **Anweisung:**
            Schreibe NUR den Abschnitt "${partToRegen}" neu. Der neue Text für "${partToRegen}" muss stilistisch, thematisch und inhaltlich perfekt zum Rest des Songs passen. Behalte die ursprüngliche Stimmung bei, aber versuche, die Wortwahl und die Bilder zu variieren und zu verbessern. Gib NUR den neu geschriebenen, vollständigen Abschnitt inklusive der Kennzeichnung (z.B. "[Refrain]") zurück, sonst nichts.
        `;

        const newPartText = await callGeminiAPI(prompt);

        // Ersetzt den alten Teil durch den neuen im Songtext
        const regex = new RegExp(`(\\[${partToRegen}\\][\\s\\S]*?)(?=\\[|$)`, 'i');
        const updatedSongtext = generatedSong.songtext.replace(regex, newPartText.trim() + '\n\n');

        setGeneratedSong(prev => ({ ...prev, songtext: updatedSongtext }));
        
        setIsRegenerating(false);
        setRegeneratingPart(null);
    };


    const saveSong = async () => {
        // ... (saveSong Funktion bleibt unverändert)
    };

    // Hilfsfunktion, um die Songteile für die Buttons zu extrahieren
    const getSongParts = () => {
        if (!generatedSong || !generatedSong.songtext) return [];
        const parts = generatedSong.songtext.match(/\[(.*?)\]/g);
        return parts ? parts.map(p => p.replace(/\[|\]/g, '')) : [];
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center"><BrainCircuit className="mr-3 text-indigo-400"/>Song-Generator</h2>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="space-y-4">
                    {/* Song-Idee */}
                    <div>
                        <label htmlFor="song-idea" className="block text-sm font-medium text-gray-300 mb-1">Song-Idee</label>
                        <textarea id="song-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Z.B. Zwei Freunde treffen sich nach langer Zeit wieder..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md" rows="3"></textarea>
                        <CustomButton onClick={generateRandomIdeas} isLoading={isLoadingIdeas} className="mt-2 bg-gray-700 hover:bg-gray-600" icon={Wand2}>Zufällige Idee generieren</CustomButton>
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
                            <option>Urban-Pop / Rap</option>
                            <option>Indie-Folk</option>
                            <option>Rock / Punk</option>
                            <option>80er Synth-Pop</option>
                            <option>Trap / Cloud Rap</option>
                        </select>
                    </div>

                    {/* Perspektive */}
                    <div>
                        <label htmlFor="perspective" className="block text-sm font-medium text-gray-300 mb-1">Perspektive</label>
                        <select id="perspective" value={perspective} onChange={(e) => setPerspective(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md">
                            <option>Keine</option><option>Ich</option><option>Du</option><option>3. Person</option>
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
                    <div> <h3 className="text-xl font-semibold text-indigo-400 mb-2">Songtext</h3> <div className="p-4 bg-gray-900 rounded-md whitespace-pre-wrap text-gray-200 font-mono">{generatedSong.songtext}</div> </div>

                    {/* Iterative Bearbeitungs-Buttons */}
                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-300 mb-2">Abschnitt überarbeiten:</h4>
                        <div className="flex flex-wrap gap-2">
                            {getSongParts().map(part => (
                                <button
                                    key={part}
                                    onClick={() => handleRegeneratePart(part)}
                                    disabled={isRegenerating}
                                    className="flex items-center px-3 py-1 bg-gray-700 text-sm text-gray-200 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isRegenerating && regeneratingPart === part ? <Spinner size={16} /> : <RefreshCw size={14} className="mr-2"/>}
                                    {part}
                                </button>
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

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { callGeminiAPI } from '@/api/gemini.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { BrainCircuit, Sparkles, Save, Wand2 } from 'lucide-react';

const appId = 'default-songwriting-app';

const Generator = ({ userId, myLyrics, externalLyrics, setActiveTab }) => {
    const [idea, setIdea] = useState('');
    const [perspective, setPerspective] = useState('Keine');
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [generatedSong, setGeneratedSong] = useState(null);
    const [message, setMessage] = useState(null);

    const generateRandomIdeas = async () => {
        setIsLoadingIdeas(true);
        const prompt = "Erstelle 5 kreative und unterschiedliche Song-Ideen für einen modernen deutschen Pop- oder Rap-Song. Jede Idee sollte nur ein kurzer Satz sein. Gib nur die 5 Sätze zurück, getrennt durch einen Zeilenumbruch, ohne Nummerierung oder zusätzliche Erklärungen.";
        const response = await callGeminiAPI(prompt);
        
        // KORREKTUR: Prüft, ob die Antwort ein gültiger String ist, bevor .split() aufgerufen wird.
        if (typeof response === 'string' && !response.startsWith('Fehler:')) {
            const ideas = response.split('\n').filter(line => line.trim() !== '');
            if (ideas.length > 0) {
                setIdea(ideas[0]);
            }
        } else {
            // Zeigt die Fehlermeldung von der API in der UI an.
            setMessage({ type: 'error', text: response });
        }
        setIsLoadingIdeas(false);
    };

    // ... Der Rest der Komponente bleibt unverändert ...
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

        const prompt = `
            Du bist ein hochkreativer Songwriting-Assistent. Deine Aufgabe ist es, einen anspruchsvollen und emotional tiefgründigen Songtext zu erstellen, der sich an den folgenden, sehr spezifischen Regeln orientiert.
            
            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Nicht spezifiziert, wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine."}

            **REGELWERK (STRIKT EINZUHALTEN):**

            **1. Stilistische Parameter und Lyrik-Regeln:**
            - **Originalität der Wortwahl:** Verwende eine breite Vielfalt an Wörtern. VERMEIDE UNBEDINGT die folgenden Wörter: "Schatten", "Echo", "Kälte", "Glanz", "zerbricht", "rast", "kalt".
            - **Vermeidung von Klischees:** Benutze keine abgedroschenen Phrasen, Floskeln oder Klischees. Sei in jeder Zeile originell und unerwartet.
            - **Emotionale Darstellung ("Show, don't tell"):** Beschreibe Gefühle durch konkrete Handlungen, sensorische Details und Metaphern. Statt "Ich bin traurig", schreibe "Die Regentropfen strichen langsam über das Fenster".
            - **Sprachstil:** Orientiere dich am modernen deutschen Pop- und Rap-Stil. Nutze Umgangssprache authentisch. Anglizismen nur sparsam und gezielt einsetzen.
            - **Emotionaler Ton (Künstler-Inspiration):** Kombiniere die folgenden Stimmungen: Billie Eilish, Ed Sheeran, Joji, Tarantino-Vibe.

            **2. Storytelling-Struktur und -Techniken:**
            - **Narrative Struktur:** Der Song muss einem klaren "roten Faden" folgen.
            - **Wiederkehrende Motive:** Verwende eine feststehende, bildhafte Phrase (z.B. "die Stadt mit dem Atem aus Beton").
            - **Atmosphärische Schauplätze:** Erschaffe lebendige, multisensorische Umgebungen.
            - **Dialoge und Perspektiven:** Integriere Verse, die wie ein Dialog klingen.
            - **Paradoxa:** Verwende paradoxe Aussagen (z.B. "Ich fand die Freiheit erst, als du meine Fesseln warst.").

            **3. Metrik und Reim-Regeln:**
            - **Reimschema:** Setze Reimschemata (AABB, ABAB, ABBA) präzise um.
            - **Assonanz-Regel:** Vokal und Silbenanzahl müssen bei Assonanzen entsprechen.
            - **Flow und Rhythmus:** Variiere die Metrik durch unterschiedliche Silbenzahlen pro Zeile.

            **STILISTISCHE REFERENZTEXTE (ALS INSPIRATION NUTZEN, NICHT KOPIEREN):**
            --- EIGENE TEXTE DES NUTZERS ---
            ${myLyricsReference || "Keine vorhanden."}
            --- EXTERNE REFERENZTEXTE (ÖFFENTLICH) ---
            ${externalLyricsReference || "Keine vorhanden."}
            
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

    const saveSong = async () => {
        if (!generatedSong || !userId) return;
        try {
            const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
            await addDoc(lyricsCollection, { title: idea, content: generatedSong.songtext, createdAt: new Date() });
            setMessage({type: 'success', text: 'Song erfolgreich gespeichert! Du wirst weitergeleitet...'});
            
            setTimeout(() => {
                setIdea('');
                setPerspective('Keine');
                setInstructions('');
                setGeneratedSong(null);
                setMessage(null);
                setActiveTab('Eigene Texte');
            }, 1500);

        } catch (error) {
            console.error("Fehler beim Speichern des Songs:", error);
            setMessage({type: 'error', text: 'Fehler beim Speichern des Songs.'});
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center"><BrainCircuit className="mr-3 text-indigo-400"/>Song-Generator</h2>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="song-idea" className="block text-sm font-medium text-gray-300 mb-1">Song-Idee</label>
                        <textarea id="song-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Z.B. Zwei Freunde treffen sich nach langer Zeit wieder..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-200" rows="3"></textarea>
                         <CustomButton onClick={generateRandomIdeas} isLoading={isLoadingIdeas} className="mt-2 bg-gray-700 hover:bg-gray-600" icon={Wand2}>Zufällige Idee generieren</CustomButton>
                    </div>
                    <div>
                        <label htmlFor="perspective" className="block text-sm font-medium text-gray-300 mb-1">Perspektive</label>
                        <select id="perspective" value={perspective} onChange={(e) => setPerspective(e.target.value)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-200">
                            <option>Keine</option>
                            <option>Ich</option>
                            <option>Du</option>
                            <option>3. Person</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-1">Zusätzliche Anweisungen</label>
                        <textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Z.B. Der Refrain soll sich wiederholen..." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-200" rows="2"></textarea>
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
                    <CustomButton onClick={saveSong} icon={Save}>Generierten Song speichern</CustomButton>
                </div>
            )}
        </div>
    );
};

export default Generator;

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
    const [generatedIdeas, setGeneratedIdeas] = useState([]);

    const generateRandomIdeas = async () => {
        setIsLoadingIdeas(true);
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

        // **ÄNDERUNG: Der Prompt wurde überarbeitet, um die Quintessenz der Künstlerstile abzubilden.**
        const prompt = `
            Du bist ein erfahrener und vielseitiger Songwriter für deutschen Pop, Urban-Pop und Indie. Deine Stärke ist es, spezifische Stimmungen und klare Geschichten in eine moderne, authentische Sprache zu gießen, die direkt ins Herz trifft. Deine Texte sind mal tanzbar und ironisch, mal tief melancholisch und verletzlich.

            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine besonderen."}

            **DEIN KREATIVES REGELWERK:**

            **1. Tonalität & Vibe (Der Sound):**
            - **Grundstimmung:** Erzeuge eine cineastische, oft nächtliche Atmosphäre. Denk an einen Film: vorbeiziehende Lichter, fragmentarische Gedanken, die Spannung zwischen dem Gesagten und Ungesagten. Die Stimmung ist entscheidend.
            - **Emotionale Bandbreite:** Dein Ton kann variieren. Sei mal lässig, selbstbewusst und ironisch, dann wieder verletzlich, nachdenklich und roh. Wechsle die Emotionen, wenn es zur Geschichte passt.
            - **Sprache:** Schreibe in einer klaren, direkten und modernen Umgangssprache. Der Text muss sich anfühlen wie ein echter Gedanke oder ein belauschtes Gespräch. Authentischer Slang (z.B. "viben", "lost") ist erlaubt, aber nicht erzwungen.

            **2. Storytelling & Emotion (Das Herz):**
            - **Geschichte > Poesie:** Eine klare, nachvollziehbare Geschichte oder Situation steht im Mittelpunkt. Vermeide zu abstrakte oder rein poetische Formulierungen. Jede Zeile dient der Erzählung.
            - **Konkretes "Show, Don't Tell":** Zeige Emotionen durch präzise, alltägliche Beobachtungen und Handlungen. Statt "ich bin einsam", schreibe "der fünfte Anruf bei deiner Mailbox heute" oder "die Pizza für zwei ess ich wieder allein".
            - **Detailverliebtheit:** Baue kleine, spezifische Details ein, die die Welt lebendig machen – eine bestimmte Zigarettenmarke, ein Lied im Radio, der Geruch von Regen auf heißem Asphalt.

            **3. Lyrische Technik & Originalität:**
            - **Sinnvolle Bildsprache:** Metaphern müssen kreativ, aber logisch nachvollziehbar sein. Kein "die Stadt atmet Licht".
            - **Wort-Tabus:** Vermeide klischeehafte Bilder und die Worte: Schatten, Echo, Kälte, Glanz, zerbricht, rast, kalt. Finde originelle Umschreibungen.
            - **Dynamische Wortwahl:** Achte aktiv auf Wortwiederholungen. Ersetze generische Wörter durch stärkere Synonyme, um einen reichen und nicht-roboterhaften Wortschatz zu gewährleisten.

            **4. Flow & Musikalität (Struktur von Strophe und Refrain):**
            - **Verse (Strophen):** Die Strophen sollen einen entspannten, melodischen und fast gesungenen Rap-Stil haben. Der Flow ist Vibe-orientiert, oft introspektiv und nachdenklich, mit Fokus auf Gefühlen und Beobachtungen aus dem Alltag. Nutze hierfür einen lockeren, gesprächsartigen Rhythmus mit mehrsilbigen Reimen und Assonanzen.
            - **Hook (Refrain):** Der Refrain muss im starken Kontrast zur Strophe stehen. Er muss extrem eingängig (catchy), melodisch und sofort singbar sein, wie in einem reinen Popsong. Hier sind einfache, klare Reime (AABB, ABAB) und eine prägnante, emotionale Kernaussage perfekt.
            - **Rhythmusgefühl:** Variiere die Satzlänge stark, um Dynamik und Spannung zu erzeugen.

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
                setGeneratedIdeas([]);
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

                    {generatedIdeas.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <h4 className="font-semibold text-gray-300 mb-2">Wähle eine Idee aus:</h4>
                            <ul className="space-y-2">
                                {generatedIdeas.map((genIdea, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                setIdea(genIdea);
                                                setGeneratedIdeas([]);
                                            }}
                                            className="w-full text-left p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300"
                                        >
                                            {genIdea}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
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

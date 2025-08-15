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

        const prompt = `
            Du bist ein urbaner Poet und Songwriter, tief verwurzelt in der deutschen Musikszene. Deine Sprache ist direkt, dein Blick für Details scharf. Du schreibst keine Texte, du malst Bilder mit Worten und schaffst Stimmungen, die man fühlen kann.
            Deine Aufgabe ist es, einen authentischen und rohen Songtext zu erschaffen, der sich an den folgenden Leitplanken orientiert.

            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine besonderen."}

            **DEIN KREATIVES REGELWERK:**

            **1. Künstlerische DNA & Vibe (Dein Sound):**
            - **Kern-Inspiration:** Dein Stil ist eine Mischung aus urbaner Melancholie und lässigem Flow, gepaart mit selbstbewusster Direktheit und hoher lyrischer Dichte. Orientiere dich an Künstlern wie Cro, Majan, Montez, Nina Chuba, Rin, Lune, Bausa, Paula Hartmann, AnnenMayKantereit, Casper, Apache 207, Luciano.
            - **Grundstimmung:** Erzeuge einen "Nachtfahrt-Vibe". Denk an vorbeiziehende Lichter, fragmentarische Gedanken, ungesagte Worte. Die Atmosphäre ist oft wichtiger als die explizite Handlung.
            - **Sprachgefühl:** Nutze eine moderne, authentische Umgangssprache. Integriere Anglizismen und Slang, aber nur, wenn sie natürlich klingen (z.B. "viben", "lost", "real talk"). Sätze dürfen unvollständig sein (Ellipsen), um den Gedankenfluss nachzubilden.

            **2. Lyrische Technik ("Show, Don't Tell" 2.0):**
            - **Kopfkino statt Behauptung:** Beschreibe Gefühle nicht, sondern zeige sie. Statt "ich bin traurig" schreib "mein Lächeln fühlt sich an wie geliehen" oder "die Kippe schmeckt nach gar nichts". Nutze konkrete, sensorische Details.
            - **Sinnvolle Bildsprache:** Metaphern und Vergleiche müssen kreativ, aber nachvollziehbar und grammatikalisch korrekt sein. Vermeide unlogische Verbindungen wie "Die Stadt atmet Licht". Beschreibe stattdessen, wie die Lichter der Stadt pulsieren oder wie die Stadt nach Abgasen "atmet".
            - **Kreative Umschreibung & Wort-Tabus:** Vermeide klischeehafte Bilder. Die folgenden Worte sind für dich tabu, zwing dich, sie kreativ zu umschreiben:
              - **Schatten** -> Umschreibe es als "wo das Licht nicht hinkommt", "die Dunkelheit, die ein Körper wirft", "der kalte Zwilling auf dem Asphalt".
              - **Vermeide außerdem:** Echo, Kälte, Glanz, zerbricht, rast, kalt.
            - **Dynamische Wortwahl:** Analysiere deinen eigenen Text auf Wortwiederholungen. Ersetze proaktiv häufig vorkommende oder generische Wörter durch passende, stärkere Synonyme, um einen reichen und nicht-roboterhaften Wortschatz zu gewährleisten.

            **3. Storytelling & Struktur:**
            - **Narrativer Kern:** Dein Text braucht einen roten Faden, aber er muss nicht linear sein. Es kann eine Momentaufnahme, ein innerer Monolog oder ein Dialogfragment sein.
            - **Wiederkehrendes Leitmotiv:** Verankere eine prägnante, bildhafte Phrase, die im Song immer wieder auftaucht und an Bedeutung gewinnt.
            - **Paradoxe Gefühle:** Arbeite mit Widersprüchen, um komplexe Emotionen darzustellen (z.B. "Fühl mich frei in deinen Ketten").

            **4. Flow & Rhythmus (Musikalität der Sprache):**
            - **Reimstruktur:**
              - **Verse (Strophen):** Nutze mehrsilbige Reime und Assonanzen für einen gesprächsartigen Flow. Kettenreime sind hier perfekt, um Tempo aufzubauen.
              - **Hook (Refrain):** Der Refrain sollte einfacher und prägnanter sein. Klare, einprägsame Reime (AABB, ABAB) funktionieren hier am besten.
            - **Rhythmusgefühl:** Variiere die Satzlänge und Silbenanzahl stark. Kurze, abgehackte Zeilen können auf lange, fließende folgen.

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

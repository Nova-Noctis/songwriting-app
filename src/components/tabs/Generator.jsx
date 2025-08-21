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
    const [textType, setTextType] = useState('Freie Wahl');
    const [performanceStyle, setPerformanceStyle] = useState('Gesungen');
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

    const textTypes = ['Freie Wahl', 'Uplifting Pop Song', 'Urbane Melancholie', 'Trap Representer', 'Sad Lovesong', 'Sexual Lovesong', 'Poetry'];
    const performanceStyles = ['Gesungen', 'Rap', 'Spoken Word', 'Gesang (Chorus) & Rap (Verse)'];
    const perspectives = [ 'Keine', 'Ich-Perspektive', 'Du-Perspektive', 'Er/Sie/Es-Perspektive (Dritte-Person-Perspektive)', 'Wir-Perspektive', 'Ihr-Perspektive', 'Auktoriale (allwissende) Perspektive', 'Neutrale (beobachtende) Perspektive', 'Wechselnde Perspektiven' ];

    const generateRandomIdeas = useCallback(async () => {
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
    }, []);

    const handleInspireMe = useCallback(async () => {
        setIsLoadingInspire(true);
        setMessage(null);
        setGeneratedSong(null);
        setGeneratedIdeas([]);
        const randomTextType = textTypes[Math.floor(Math.random() * textTypes.length)];
        const randomPerformanceStyle = performanceStyles[Math.floor(Math.random() * performanceStyles.length)];
        const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
        setTextType(randomTextType);
        setPerformanceStyle(randomPerformanceStyle);
        setPerspective(randomPerspective);
        const ideaPrompt = `Gib mir eine einzige, äußerst kreative und unerwartete Song-Idee für einen Text mit dem Thema "${randomTextType}". Die Idee sollte nur ein kurzer, inspirierender Satz sein.`;
        const randomIdea = await callGeminiAPI(ideaPrompt);
        if (typeof randomIdea === 'string' && !randomIdea.startsWith('Fehler:')) {
            setIdea(randomIdea.trim());
        } else {
            setIdea("Ein unerwarteter Moment der Stille");
            setMessage({ type: 'error', text: randomIdea });
        }
        setInstructions('');
        setNegativePrompt('');
        setIsLoadingInspire(false);
    }, []);

    const handleGenerateSong = useCallback(async () => {
        if (!idea) {
            setMessage({ type: 'error', text: 'Bitte gib eine Song-Idee ein.' });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        setGeneratedSong(null);

        const myLyricsReference = myLyrics.map(lyric => `Titel: ${lyric.title}\nText:\n${lyric.content}`).join('\n\n---\n\n');
        const externalLyricsReference = externalLyrics.map(lyric => lyric.content).join('\n\n---\n\n');

        const textTypeInstructions = {
            'Freie Wahl': "Wähle basierend auf der Song-Idee eine passende emotionale Ausrichtung (z.B. melancholisch, euphorisch, aggressiv etc.) und setze diese konsequent um.",
            'Uplifting Pop Song': "Fokus auf eine positive, energetische und hoffnungsvolle Botschaft. Der Text soll Mut machen und eine eingängige, helle Atmosphäre schaffen.",
            'Urbane Melancholie': "Fokus auf eine nachdenkliche, melancholische Stimmung im Kontext einer nächtlichen, urbanen Szenerie. Themen sind oft Einsamkeit, verpasste Gelegenheiten und die Schönheit im Vergänglichen.",
            'Trap Representer': "Fokus auf Selbstbewusstsein, Erfolg und den Weg dorthin. Die Sprache ist direkt, oft prahlerisch, aber mit einem Hauch von Verletzlichkeit über die Vergangenheit.",
            'Sad Lovesong': "Fokus auf Herzschmerz, Sehnsucht und den Schmerz einer verlorenen Liebe. Der Ton ist verletzlich, introspektiv und emotional roh.",
            'Sexual Lovesong': "Fokus auf Anziehung, Verlangen und Intimität. Die Sprache ist sinnlich, bildhaft und kann explizit sein, sollte aber elegant bleiben.",
            'Poetry': "Fokus auf eine besonders hohe lyrische Dichte, komplexe Metaphern und eine kunstvolle Sprache. Die 'Geschichte > Poesie'-Regel wird hier gelockert, aber der Text muss dennoch einen emotionalen roten Faden haben."
        };

        const performanceStyleInstructions = {
            'Gesungen': "Der Text sollte durchgehend melodiös und singbar sein. Achte auf fließende Vokal-Übergänge und einen klaren Rhythmus, der sich für eine Gesangsmelodie eignet.",
            'Rap': "Der Text sollte einen klaren Rap-Flow ermöglichen. Nutze rhythmische Betonungen, Binnenreime und einen eher sprechnahen Duktus, besonders in den Strophen.",
            'Spoken Word': "Der Text sollte sich wie ein vorgetragenes Gedicht oder ein intensiver Monolog anfühlen. Der Rhythmus ist freier und wird stark vom Inhalt und der Emotion bestimmt, weniger von einem festen Takt.",
            'Gesang (Chorus) & Rap (Verse)': "Kombiniere beide Stile: Die Strophen (Verse) sollen einen klaren Rap-Flow haben (rhythmisch, sprechnah). Der Refrain (Chorus/Hook) hingegen muss extrem eingängig, melodisch und gesungen sein."
        };

        const selectedTextTypeInstruction = textTypeInstructions[textType];
        const selectedPerformanceStyleInstruction = performanceStyleInstructions[performanceStyle];

        const prompt = `
            **Simulationsbefehl:**
            Du bist ein Songwriter für das Hier und Jetzt. Dein Stil ist die Schnittmenge aus urbaner Poesie und eingängigem Pop und Rap, der die Grundstimmung des Songs präzise an das jeweilige Thema anpasst und sich dabei souverän zwischen den Polen von nächtlicher Melancholie und tanzbarer, sonniger Leichtigkeit bewegt.
            Deine Superkraft: Du verpackst rohe, ehrliche Emotionen und messerscharfe Alltagsbeobachtungen in Melodien, die sofort ins Ohr gehen. Du schreibst Songs, die man nachts allein mit Kopfhörern im Bus hören kann, zu denen man aber auch am Wochenende im Club tanzen will.

            **ÜBERGEORDNETE ANWEISUNG:**
            - **Art des Textes:** ${selectedTextTypeInstruction}
            - **Performance-Stil:** ${selectedPerformanceStyleInstruction}

            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine besonderen."}
            - **Inhalte, die vermieden werden sollen:** ${negativePrompt || "Keine besonderen."}

                **DEIN KREATIVES REGELWERK (DIESE REGELN GELTEN IMMER):**

            **1. Der kreative Anker (Wichtigste Regel zur Vermeidung von Generik):**
            - Wähle zu Beginn ein einziges, spezifisches und ungewöhnliches Sinnesdetail als zentralen Anker für den gesamten Song (z.B. der Geruch von Ozon nach einem Sommerregen, das Geräusch einer flackernden Leuchtstoffröhre, das Gefühl von Samt auf der Haut).
            - Jede Metapher, jedes Bild und jede Beschreibung im Text muss sich auf diesen einen, spezifischen Anker beziehen oder durch ihn gefiltert werden. Dies verhindert generische Bilder.

            **2. Bildsprache & Metaphern:**
            - **Verankere Emotionen in Konkretem:** Beschreibe Gefühle nicht direkt, sondern durch ihre Auswirkungen auf die physische Welt.
            - **Nutze paradoxe Handlungen:** Verbinde Zärtlichkeit mit Zerstörung.
            - **Verwende viszerale, körperliche Bilder:** Beschreibe emotionale Zustände durch körperliche Empfindungen.
            - **Schaffe filmreife, hyper-dramatische Szenen:** Male kurze, extreme Bilder, die im Kopf bleiben.
            - **Integriere Alltagsbeobachtungen und urbane Details:** Nutze Elemente wie 'Neonröhren', 'Kopfsteinpflaster', 'Flaschen klirren', 'Bierdunst', um eine raue, authentische Atmosphäre zu schaffen.
            - **Aktive Vermeidung von Klischees:** Erkenne und ersetze aktiv generische Bilder. STRIKT VERMEIDEN: "Der Wind flüstert", "leere Straßen", "kalter Beton", "Herz aus Eis". ERSETZE DURCH: "Der Wind zerrt an den Jalousien", "Straßen, auf denen nur noch die Ampeln wach sind", "Beton, der die Kälte des Winters gespeichert hat".
            - **Achte auf Musikalische und einfache Klangstruktur:** Der Text muss sich gut singen oder Rappen lassen. Achte auf den Rhytmus und die Silbenstruktur.
            - **Achte auf korrekte deutschte Grammatik und Rechtschreibung:** Der Text muss grammatikalisch korrekt sein, umd eine klare Verständlichkeit der Zeilen zu gewährleisten.

            **3. Lyrische Technik & Flow (Fortgeschritten):**
            - **WICHTIG: Die Story führt den Reim, nicht umgekehrt.** Der erzählerische Fluss hat immer Vorrang.
            - **Anspruchsvolle Reimketten (Verse):** Baue gezielt mehrsilbige, assonante Reimketten ein, die sich über mehrere Zeilen erstrecken.
            - **Eingängiger Hook (Refrain):** Der Refrain muss einfacher, prägnanter und melodischer sein.

            **4. Narrative Struktur & Dramaturgie (Der rote Faden):**
            - **Definiere einen klaren Handlungsbogen:** Jeder Songtext muss einer nachvollziehbaren emotionalen oder physischen Reise folgen (Exposition -> Eskalation -> Wendepunkt -> Auflösung).
            - **Entwickle die zentrale Metapher:** Die Hauptmetapher darf nicht statisch sein. Zeige ihre Entwicklung über den Song hinweg.

            **5. Selbstkorrektur:**
            - Überprüfe deinen fertigen Text. Wenn du feststellst, dass du generische Bilder wie 'Neonlichter' oder 'Staub' verwendet hast, überarbeite diese Zeilen, um sie spezifischer und einzigartiger zu machen.

            **AUSGABEFORMAT (EXAKT EINZUHALTEN):**
            Gib deine Antwort in drei klar getrennten Abschnitten zurück: ### Storyline, ### Arrangement, ### Songtext.
        `;

        const response = await callGeminiAPI(prompt);
        const storylineMatch = response.match(/### Storyline\s*([\s\S]*?)\s*### Arrangement/);
        const arrangementMatch = response.match(/### Arrangement\s*([\s\S]*?)\s*### Songtext/);
        const songtextMatch = response.match(/### Songtext\s*([\s\S]*)/);
        if (storylineMatch && arrangementMatch && songtextMatch) {
            setGeneratedSong({ storyline: storylineMatch[1].trim(), arrangement: arrangementMatch[1].trim(), songtext: songtextMatch[1].trim() });
        } else {
            setGeneratedSong({ songtext: response });
            setMessage({ type: 'info', text: 'Die KI-Antwort konnte nicht vollständig strukturiert werden, hier ist das Ergebnis.' });
        }
        setIsLoading(false);
    }, [idea, perspective, textType, performanceStyle, negativePrompt, instructions, myLyrics, externalLyrics]);

    const handleRegeneratePart = useCallback(async (partToRegen) => {
        setIsRegenerating(true);
        setRegeneratingPart(partToRegen);
        const prompt = `Aufgabe: Überarbeite einen bestimmten Teil eines vorhandenen Songtextes.\n\n**Vorhandener Songtext als Kontext:**\n${generatedSong.songtext}\n\n**Anweisung:**\nSchreibe NUR den Abschnitt "${partToRegen}" neu. Der neue Text für "${partToRegen}" muss stilistisch, thematisch und inhaltlich perfekt zum Rest des Songs passen. Behalte die ursprüngliche Stimmung bei, aber versuche, die Wortwahl und die Bilder zu variieren und zu verbessern. Gib NUR den neu geschriebenen, vollständigen Abschnitt inklusive der Kennzeichnung (z.B. "[Refrain]") zurück, sonst nichts.`;
        const newPartText = await callGeminiAPI(prompt);
        const regex = new RegExp(`(\\[${partToRegen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\][\\s\\S]*?)(?=\\[|$)`, 'i');
        const updatedSongtext = generatedSong.songtext.replace(regex, newPartText.trim() + '\n\n');
        setGeneratedSong(prev => ({ ...prev, songtext: updatedSongtext.trim() }));
        setIsRegenerating(false);
        setRegeneratingPart(null);
    }, [generatedSong]);
    
    const saveSong = useCallback(async () => {
        if (!generatedSong || !userId) return;
        try {
            const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
            await addDoc(lyricsCollection, { title: idea, content: generatedSong.songtext, createdAt: new Date() });
            setMessage({ type: 'success', text: 'Song erfolgreich gespeichert! Du wirst weitergeleitet...' });
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
            setMessage({ type: 'error', text: 'Fehler beim Speichern des Songs.' });
        }
    }, [generatedSong, userId, idea, setActiveTab]);

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
                        <label htmlFor="text-type" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Art des Textes</label>
                        <select id="text-type" value={textType} onChange={(e) => setTextType(e.target.value)} className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all">
                            {textTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="performance-style" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Performance-Stil</label>
                        <select id="performance-style" value={performanceStyle} onChange={(e) => setPerformanceStyle(e.target.value)} className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all">
                            {performanceStyles.map(p => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="perspective" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Perspektive</label>
                    <select id="perspective" value={perspective} onChange={(e) => setPerspective(e.target.value)} className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all">
                        {perspectives.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>

                <div>
                    <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Was soll vermieden werden?</label>
                    <textarea id="negative-prompt" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Klischees über Liebe, das Wort 'Herz'..." className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all" rows="2"></textarea>
                </div>
                
                <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Zusätzliche Anweisungen</label>
                    <textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Der Refrain soll sich wiederholen..." className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all" rows="2"></textarea>
                </div>
                
                <button onClick={handleGenerateSong} className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 text-black font-bold text-lg rounded-lg border border-white/20 hover:bg-white glow-effect transition-all duration-300">
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

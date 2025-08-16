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
    const [isLoadingInspire, setIsLoadingInspire] = useState(false);

    // State für die Ergebnisse
    const [generatedSong, setGeneratedSong] = useState(null);
    const [generatedIdeas, setGeneratedIdeas] = useState([]);
    const [message, setMessage] = useState(null);

    const genres = [ 'Freie Wahl', 'Urban-Pop / Rap', 'Indie-Folk', 'Rock / Punk', '80er Synth-Pop', 'East Coast Hip-Hop', 'West Coast Hip-Hop', 'Trap', 'Gangsta-Rap', 'Conscious Hip-Hop', 'Lo-Fi Hip-Hop', 'Drill', 'Grime', 'Dance-Pop', 'Synth-Pop', 'Indie-Pop', 'Pop-Rock', 'Power-Pop', 'J-Pop (Japanischer Pop)', 'K-Pop (Koreanischer Pop)', 'Schlager', 'Contemporary R&B', 'Neo-Soul', 'Funk', 'Soul', 'Motown', 'EDM', 'Techno' ];
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
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
        setGenre(randomGenre);
        setPerspective(randomPerspective);
        const ideaPrompt = `Gib mir eine einzige, äußerst kreative und unerwartete Song-Idee für das Genre '${randomGenre}'. Die Idee sollte nur ein kurzer, inspirierender Satz sein.`;
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
        const genreInstructions = { 'Freie Wahl': "Du bist ein vielseitiger Songwriter. Wähle einen passenden Stil für die gegebene Song-Idee und gib dein Bestes, einen herausragenden Text zu schreiben.", 'Urban-Pop / Rap': "Du bist ein erfahrener Songwriter für deutschen Pop und Urban-Pop. Deine Stärke ist es, klare Geschichten und Emotionen in eine moderne, authentische Sprache zu gießen.", 'Indie-Folk': "Du bist ein Singer-Songwriter im Stil des deutschen Indie-Folk. Dein Fokus liegt auf ehrlicher, einfacher Sprache, akustischen Stimmungen und Natur-Metaphern.", 'Rock / Punk': "Du bist ein Texter für eine deutsche Rock/Punk-Band. Deine Sprache ist energiegeladen, direkt und roh. Behandle gesellschaftskritische Themen oder persönliche Wut.", '80er Synth-Pop': "Du schreibst Texte im Stil des 80er-Jahre Synth-Pop. Erzeuge eine cineastische Nacht-Atmosphäre mit Themen wie Sehnsucht und Eskapismus.", 'East Coast Hip-Hop': "Dein Stil ist der des East Coast Hip-Hop: lyrisch dicht, komplex gereimt, oft mit Fokus auf Storytelling und sozialkritischen Beobachtungen.", 'West Coast Hip-Hop': "Schreibe im G-Funk-Stil des West Coast Hip-Hop: entspannter, funkiger Vibe, oft mit Geschichten über das Leben auf der Straße, Parties und Autos.", 'Trap': "Dein Text ist im Trap-Stil: rhythmisch, oft mit Triolen-Flows, Ad-Libs und Fokus auf Themen wie Geld, Drogen und dem Aufstieg aus ärmlichen Verhältnissen.", 'Gangsta-Rap': "Du schreibst einen rohen, ungefilterten Gangsta-Rap-Text. Die Sprache ist hart, die Themen sind Gewalt, Kriminalität und das Überleben im Ghetto.", 'Conscious Hip-Hop': "Dein Text ist Conscious Hip-Hop: politisch, sozialkritisch und introspektiv. Du regst zum Nachdenken an und thematisierst Ungerechtigkeit.", 'Lo-Fi Hip-Hop': "Schreibe einen entspannten, melancholischen Lo-Fi Hip-Hop Text. Der Vibe ist nostalgisch, die Sprache einfach und die Stimmung nachdenklich und beruhigend.", 'Drill': "Dein Stil ist Drill: düstere, bedrohliche Atmosphäre, oft mit expliziten Texten über Gewalt und das Straßenleben. Der Flow ist rhythmisch und aggressiv.", 'Grime': "Du schreibst einen Grime-Text: schneller, energiegeladener Flow über schnelle, elektronische Beats. Die Sprache ist direkt und oft konfrontativ.", 'Dance-Pop': "Dein Ziel ist ein Dance-Pop-Hit: extrem eingängig, tanzbar, mit einem einfachen, positiven Text über Liebe, Feiern oder Freiheit.", 'Synth-Pop': "Schreibe einen Synth-Pop-Text: melodiös, oft melancholisch, mit elektronischen Klängen und Themen wie Technologie, Entfremdung oder futuristischer Romantik.", 'Indie-Pop': "Dein Stil ist Indie-Pop: charmant, oft etwas quirky, mit cleveren Texten über persönliche Erfahrungen und Beobachtungen.", 'Pop-Rock': "Schreibe einen Pop-Rock-Text: eingängige Melodien treffen auf Gitarrenriffs. Die Themen sind oft hymnisch und behandeln große Gefühle wie Liebe oder Herzschmerz.", 'Power-Pop': "Dein Text ist Power-Pop: kurze, energiegeladene Songs mit lauten Gitarren und extrem eingängigen Melodien.", 'J-Pop (Japanischer Pop)': "Schreibe einen Text im Stil des J-Pop: oft sehr melodisch, energetisch und positiv, mit Themen, die von Liebe bis zu fantasievollen Geschichten reichen.", 'K-Pop (Koreanischer Pop)': "Dein Text ist für eine K-Pop-Gruppe: eine Mischung aus Gesang und Rap, oft mit englischen Phrasen. Die Themen sind Liebe, Selbstbewusstsein und Empowerment.", 'Schlager': "Schreibe einen modernen Schlagertext: einfache, positive Sprache, klare Reime und Themen wie Liebe, Sehnsucht und heile Welt.", 'Contemporary R&B': "Dein Stil ist Contemporary R&B: geschmeidig, sinnlich, mit Fokus auf modernen Liebes- und Beziehungsthemen. Der Gesang ist melodiös und oft emotional.", 'Neo-Soul': "Schreibe einen Neo-Soul-Text: tiefgründig, poetisch, mit Einflüssen aus Jazz und Funk. Die Themen sind oft philosophisch oder sozialkritisch.", 'Funk': "Dein Text ist Funk: rhythmisch, tanzbar und voller Energie. Der Fokus liegt auf dem Groove und oft auf positiven, lebensbejahenden Botschaften.", 'Soul': "Schreibe einen klassischen Soul-Text: voller Gefühl und Leidenschaft, oft über Herzschmerz, Liebe und soziale Themen.", 'Motown': "Dein Stil ist Motown: eingängiger Pop mit Soul-Einflüssen. Die Texte sind oft optimistisch und erzählen einfache Liebesgeschichten.", 'EDM': "Schreibe einen EDM-Text: einfache, hymnische und repetitive Vocals, die sich perfekt für große Festivals eignen. Das Thema ist meist Euphorie, Einheit oder Feiern.", 'Techno': "Dein Text für einen Techno-Track ist minimalistisch, oft nur einzelne Worte oder kurze Phrasen, die hypnotisch wiederholt werden und die düstere, treibende Atmosphäre unterstützen." };
        const selectedGenreInstruction = genreInstructions[genre] || genreInstructions['Freie Wahl'];
        const prompt = `
            ${selectedGenreInstruction}

            **BENUTZEREINGABEN:**
            - **Song-Idee:** ${idea}
            - **Perspektive:** ${perspective === 'Keine' ? 'Wähle die passendste.' : perspective}
            - **Zusätzliche Anweisungen:** ${instructions || "Keine besonderen."}
            - **Inhalte, die vermieden werden sollen:** ${negativePrompt || "Keine besonderen."}

            **DEIN KREATIVES REGELWERK:**
            **1. Thematische Umschreibung (Wichtigste Regel):**
            - Das Kernthema der Song-Idee darf im Text **niemals direkt genannt** werden. Es muss ausschließlich durch Bilder, Handlungen und Gefühle umschrieben werden.

            **2. Tonalität & Vibe (Der Sound):**
            - **Grundstimmung:** Erzeuge eine cineastische Atmosphäre. Denk an einen Film: die Spannung zwischen dem Gesagten und Ungesagten. Die Stimmung ist entscheidend.
            - **Sprache:** Schreibe in einer klaren, direkten und modernen Umgangssprache. Der Text muss sich anfühlen wie ein echter Gedanke oder ein belauschtes Gespräch.

            **3. Storytelling & Emotion (Das Herz):**
            - **Geschichte > Poesie:** Eine klare, nachvollziehbare Geschichte oder Situation steht im Mittelpunkt.
            - **Dynamische Szenen & Entwicklung:** Die Geschichte darf nicht statisch sein. Sie muss sich durch verschiedene Momente oder emotionale Zustände bewegen.
            - **Der Twist:** Baue ein überraschendes Element oder einen unerwarteten Perspektivwechsel ein, idealerweise in der Bridge.
            - **Konkretes "Show, Don't Tell":** Zeige Emotionen durch präzise, alltägliche Beobachtungen und Handlungen.

            **4. Lyrische Technik & Originalität:**
            - **Intelligente & Effiziente Bildsprache:** Nutze eine anspruchsvolle, intelligente Wortwahl (z.B. "Petrichor" statt "Regengeruch"). Male detailreiche Bilder durch den gezielten Einsatz von starken Verben und prägnanten Adjektiven, ohne die Zeilen unnötig lang werden zu lassen.
            - **Kraftvolle Umschreibungen statt Klischees:** Vermeide abgedroschene Darstellungen wie "Die Luft ist schwer". Formuliere stattdessen ungewöhnliche, kraftvolle Umschreibungen.
            - **Wort-Tabus:** Vermeide klischeehafte Bilder und die Worte: Schatten, Echo, Kälte, Glanz, zerbricht, rast, kalt, Asphalt.
            - **Dynamische Wortwahl:** Achte aktiv auf Wortwiederholungen. Ersetze generische Wörter durch stärkere Synonyme.

            **5. Flow & Musikalität (Struktur von Strophe und Refrain):**
            - **Verse (Strophen) - Anspruchsvolle Reimketten:** Baue in den Strophen gezielt anspruchsvolle, mehrsilbige Reimketten ein, die sich über mehrere Zeilen erstrecken.
            - **Hook (Refrain) - Eingängige Melodik:** Der Refrain muss im starken Kontrast zur Strophe stehen: extrem eingängig (catchy), melodisch und sofort singbar.
            - **Rhythmusgefühl:** Variiere die Satzlänge stark, um Dynamik und Spannung zu erzeugen.
            
            **AUSGABEFORMAT (EXAKT EINZUHALTEN):**
            Gib deine Antwort in drei klar getrennten Abschnitten zurück: ### Storyline, ### Arrangement, ### Songtext. Der Songtext muss Abschnitte wie [Strophe 1], [Refrain], [Bridge] etc. enthalten.
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
    }, [idea, perspective, genre, negativePrompt, instructions, myLyrics, externalLyrics]);

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

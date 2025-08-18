import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, MonitorPlay } from 'lucide-react';

const Teleprompter = ({ myLyrics }) => {
    const [selectedLyricId, setSelectedLyricId] = useState('');
    const [selectedLyric, setSelectedLyric] = useState(null);
    const [speed, setSpeed] = useState(25); // Startgeschwindigkeit (1-100)
    const [isScrolling, setIsScrolling] = useState(false);
    
    const textContainerRef = useRef(null);
    const scrollAnimationRef = useRef(null);

    // Handler für die Auswahl eines Textes aus dem Dropdown
    const handleSelectChange = (e) => {
        const lyricId = e.target.value;
        setSelectedLyricId(lyricId);
        if (lyricId) {
            const lyric = myLyrics.find(l => l.id === lyricId);
            setSelectedLyric(lyric);
        } else {
            setSelectedLyric(null);
        }
        handleReset(); // Setzt den Scroll-Vorgang bei Textwechsel zurück
    };

    // **ÄNDERUNG 1: Die Logik zum Stoppen und die Scroll-Geschwindigkeit wurde korrigiert.**
    const scrollStep = useCallback(() => {
        if (textContainerRef.current) {
            const container = textContainerRef.current;
            
            // Die Scroll-Distanz wurde erhöht, um eine sichtbare Bewegung zu erzeugen.
            const scrollAmount = (speed / 100) * 1.5; 
            container.scrollTop += scrollAmount;

            // Stoppt, wenn das Ende erreicht ist und bricht die Animation ab.
            if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
                setIsScrolling(false);
                cancelAnimationFrame(scrollAnimationRef.current);
            } else {
                scrollAnimationRef.current = requestAnimationFrame(scrollStep);
            }
        }
    }, [speed]);

    // Startet das Scrollen
    const handlePlay = () => {
        if (!isScrolling && selectedLyric) {
            setIsScrolling(true);
            scrollAnimationRef.current = requestAnimationFrame(scrollStep);
        }
    };

    // Pausiert das Scrollen
    const handlePause = () => {
        if (isScrolling) {
            setIsScrolling(false);
            cancelAnimationFrame(scrollAnimationRef.current);
        }
    };

    // Setzt die Scroll-Position auf den Anfang zurück
    const handleReset = () => {
        setIsScrolling(false);
        cancelAnimationFrame(scrollAnimationRef.current);
        if (textContainerRef.current) {
            textContainerRef.current.scrollTop = 0;
        }
    };

    // Stellt sicher, dass die Animation gestoppt wird, wenn die Komponente verlassen wird
    useEffect(() => {
        return () => cancelAnimationFrame(scrollAnimationRef.current);
    }, []);

    const isDisabled = !selectedLyric;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center">
                <MonitorPlay className="mr-3 text-gray-300"/>Teleprompter
            </h2>

            <div className="glass-panel rounded-2xl p-6 space-y-6">
                <div>
                    <label htmlFor="lyric-select" className="block text-sm font-medium text-gray-300 mb-2 tracking-wider">Gespeicherten Text auswählen</label>
                    <select 
                        id="lyric-select" 
                        value={selectedLyricId} 
                        onChange={handleSelectChange}
                        className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all"
                    >
                        <option value="">-- Bitte Text auswählen --</option>
                        {myLyrics.map(lyric => (
                            <option key={lyric.id} value={lyric.id}>{lyric.title}</option>
                        ))}
                    </select>
                </div>

                {/* Teleprompter-Anzeige */}
                <div className="bg-black/50 rounded-lg p-4 h-[50vh] flex flex-col">
                    <div 
                        ref={textContainerRef}
                        className="flex-grow overflow-hidden text-center"
                    >
                        {selectedLyric ? (
                            <p className="whitespace-pre-wrap text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold text-white py-24 font-inter">
                                {selectedLyric.content}
                            </p>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 font-orbitron">Kein Text ausgewählt.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Steuerungsleiste */}
                <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        {/* **ÄNDERUNG 2: Buttons werden deaktiviert, wenn kein Text ausgewählt ist.** */}
                        <button onClick={isScrolling ? handlePause : handlePlay} disabled={isDisabled} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isScrolling ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button onClick={handleReset} disabled={isDisabled} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <RotateCcw size={24} />
                        </button>
                    </div>
                    <div className="flex items-center w-full md:w-1/2">
                        <label htmlFor="speed-slider" className="mr-4 text-sm whitespace-nowrap">Geschwindigkeit</label>
                        <input 
                            id="speed-slider"
                            type="range" 
                            min="1" 
                            max="100" 
                            value={speed} 
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            disabled={isDisabled}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Teleprompter;

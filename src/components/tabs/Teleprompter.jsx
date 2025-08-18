import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, MonitorPlay } from 'lucide-react';

const parseSongForNavigation = (songtext) => {
    if (!songtext) return [];
    const parts = songtext.split(/(\[.*?\])/).filter(Boolean);
    const structuredText = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('[') && parts[i].endsWith(']')) {
            structuredText.push({
                header: parts[i].slice(1, -1),
                content: parts[i + 1] ? parts[i + 1].trim() : ''
            });
            i++;
        }
    }
    return structuredText;
};

const Teleprompter = ({ myLyrics }) => {
    const [selectedLyricId, setSelectedLyricId] = useState('');
    const [selectedLyricContent, setSelectedLyricContent] = useState('');
    const [structuredSong, setStructuredSong] = useState([]);
    const [speed, setSpeed] = useState(25);
    const [isScrolling, setIsScrolling] = useState(false);
    
    const textContainerRef = useRef(null);
    const scrollAnimationRef = useRef(null);
    const sectionRefs = useRef([]);
    const speedRef = useRef(speed);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    const handleSelectChange = (e) => {
        const lyricId = e.target.value;
        setSelectedLyricId(lyricId);
        if (lyricId) {
            const lyric = myLyrics.find(l => l.id === lyricId);
            if (lyric) {
                setSelectedLyricContent(lyric.content);
                setStructuredSong(parseSongForNavigation(lyric.content));
            }
        } else {
            setSelectedLyricContent('');
            setStructuredSong([]);
        }
        handleReset();
    };

    const scrollStep = useCallback(() => {
        if (textContainerRef.current) {
            const container = textContainerRef.current;
            const scrollAmount = (speedRef.current / 50); 
            container.scrollTop += scrollAmount;

            if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
                setIsScrolling(false);
                cancelAnimationFrame(scrollAnimationRef.current);
            } else {
                scrollAnimationRef.current = requestAnimationFrame(scrollStep);
            }
        }
    }, []);

    const handleNavClick = (index) => {
        if (sectionRefs.current[index]) {
            sectionRefs.current[index].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handlePlay = () => {
        if (!isScrolling && selectedLyricId) {
            setIsScrolling(true);
            scrollAnimationRef.current = requestAnimationFrame(scrollStep);
        }
    };

    const handlePause = () => {
        if (isScrolling) {
            setIsScrolling(false);
            cancelAnimationFrame(scrollAnimationRef.current);
        }
    };

    const handleReset = () => {
        setIsScrolling(false);
        cancelAnimationFrame(scrollAnimationRef.current);
        if (textContainerRef.current) {
            textContainerRef.current.scrollTop = 0;
        }
    };

    useEffect(() => {
        return () => cancelAnimationFrame(scrollAnimationRef.current);
    }, []);
    
    useEffect(() => {
        sectionRefs.current = sectionRefs.current.slice(0, structuredSong.length);
     }, [structuredSong]);

    const isDisabled = !selectedLyricId;

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
                        {Array.isArray(myLyrics) && myLyrics.map(lyric => (
                            <option key={lyric.id} value={lyric.id}>{lyric.title}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-black/50 rounded-lg h-[60vh] flex">
                    {/* **ÄNDERUNG: Die Navigationsleiste wird nur angezeigt, wenn Abschnitte vorhanden sind.** */}
                    {structuredSong.length > 0 && (
                        <div className="w-48 flex-shrink-0 border-r border-white/10 overflow-y-auto p-2">
                            <h3 className="font-orbitron text-gray-400 text-sm p-2">Abschnitte</h3>
                            <ul className="space-y-1">
                                {structuredSong.map((part, index) => (
                                    <li key={index}>
                                        <button 
                                            onClick={() => handleNavClick(index)}
                                            className="w-full text-left text-sm text-gray-300 px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                                        >
                                            {part.header}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div 
                        ref={textContainerRef}
                        className="flex-grow overflow-y-auto text-center"
                    >
                        {selectedLyricId ? (
                            <div className="py-24 px-8">
                                {structuredSong.length > 0 ? (
                                    structuredSong.map((part, index) => (
                                        <div 
                                            key={index} 
                                            ref={el => sectionRefs.current[index] = el} 
                                            className="mb-16"
                                        >
                                            <p className="whitespace-pre-wrap text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold text-white font-inter">
                                                {part.content}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="whitespace-pre-wrap text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold text-white font-inter">
                                        {selectedLyricContent}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 font-orbitron">Kein Text ausgewählt.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
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

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import { BookOpen, Mic2, Search, Wand2 } from 'lucide-react';
import Accordion from '@/components/ui/Accordion.jsx';
import RhymeFinder from '@/components/tools/RhymeFinder.jsx';
import SynonymFinder from '@/components/tools/SynonymFinder.jsx';
import CreativeTool from '@/components/tools/CreativeTool.jsx';
import LyricsList from './LyricsList.jsx'; // Korrigierter Pfad (gleicher Ordner)

const appId = 'default-songwriting-app';

const MyLyrics = ({ userId }) => {
    const [lyrics, setLyrics] = useState([]);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setIsLoadingLyrics(false);
            return;
        }
        
        setIsLoadingLyrics(true);
        const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
        const q = query(lyricsCollection);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const lyricsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLyrics(lyricsData);
            setIsLoadingLyrics(false);
        }, (err) => {
            console.error("Fehler beim Abrufen der Texte:", err);
            setError("Konnte Texte nicht laden.");
            setIsLoadingLyrics(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center"><BookOpen className="mr-3 text-indigo-400"/>Dein Arbeitsbereich</h2>
            <Accordion title="Deine eigenen Texte" icon={Mic2}>
                <LyricsList userId={userId} lyrics={lyrics} isLoading={isLoadingLyrics} error={error} setError={setError} />
            </Accordion>
            <Accordion title="Reim- & Synonym-Suchmaschine" icon={Search}>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Reimaschine</h3>
                        <RhymeFinder />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-200">Synonym-Suchmaschine</h3>
                        <SynonymFinder />
                    </div>
                </div>
            </Accordion>
            <Accordion title="Kreativ-Werkzeuge" icon={Wand2}>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <CreativeTool 
                        title="Metaphern-Generator"
                        placeholder="Wort/Konzept eingeben..."
                        promptTemplate={(input) => `Erstelle 5 kreative und originelle Metaphern für das folgende Wort/Konzept: "${input}". Gib nur die 5 Metaphern als nummerierte Liste zurück.`}
                    />
                    <CreativeTool 
                        title="Zeilen-Variationen"
                        placeholder="Songzeile eingeben..."
                        promptTemplate={(input) => `Erstelle 5 alternative Formulierungen für die folgende Songzeile: "${input}". Behalte die ursprüngliche Bedeutung bei, aber variiere Wortwahl und Stil. Gib nur die 5 Variationen als nummerierte Liste zurück.`}
                    />
                     <CreativeTool 
                        title="Satzvervollständiger"
                        placeholder="Angefangenen Satz eingeben..."
                        promptTemplate={(input) => `Vervollständige den folgenden Satz auf 5 kreative und unerwartete Weisen: "${input}". Gib nur die 5 vollständigen Sätze als nummerierte Liste zurück.`}
                    />
                </div>
            </Accordion>
        </div>
    );
};

export default MyLyrics;

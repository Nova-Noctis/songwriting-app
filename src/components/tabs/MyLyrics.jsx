import React from 'react';
import { BookOpen, Mic2, Search, Wand2, Lightbulb } from 'lucide-react';
import Accordion from '@/components/ui/Accordion.jsx';
// Platzhalter für die tatsächlichen Komponenten
const LyricsList = () => <div className="font-inter text-gray-400">Hier wird die Liste deiner Texte angezeigt.</div>;
const LineCollection = () => <div className="font-inter text-gray-400">Hier wird deine Zeilensammlung angezeigt.</div>;
const RhymeFinder = () => <div className="font-inter text-gray-400">Hier kommt die Reimsuchmaschine hin.</div>;
const SynonymFinder = () => <div className="font-inter text-gray-400">Hier kommt die Synonymsuche hin.</div>;
const CreativeTool = ({title}) => <div className="font-inter text-gray-400">{title}</div>;


const MyLyrics = ({ userId }) => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center">
                <BookOpen className="mr-3 text-gray-300"/>Dein Arbeitsbereich
            </h2>
            
            <Accordion title="Deine eigenen Texte" icon={Mic2}>
                <LyricsList />
            </Accordion>

            <Accordion title="Line Sammlung" icon={Lightbulb}>
                <LineCollection />
            </Accordion>

            <Accordion title="Reim- & Synonym-Suchmaschine" icon={Search}>
                <div className="grid md:grid-cols-2 gap-8 p-4 bg-black/20 rounded-lg">
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
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 bg-black/20 rounded-lg">
                    <CreativeTool title="Metaphern-Generator" />
                    <CreativeTool title="Zeilen-Variationen" />
                    <CreativeTool title="Satzvervollständiger" />
                </div>
            </Accordion>
        </div>
    );
};

export default MyLyrics;

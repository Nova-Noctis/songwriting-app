import React from 'react';
import { ExternalLink, Save } from 'lucide-react';
import CustomButton from '@/components/ui/Button.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';

// Die Logik für diese Komponente kann hier eingefügt werden, falls sie benötigt wird.
// Fürs Erste erstellen wir nur das UI-Layout.

const ExternalLyrics = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center">
                <ExternalLink className="mr-3 text-gray-300"/>Externe Texte
            </h2>
            <div className="glass-panel rounded-2xl p-6 space-y-4">
                <p className="text-gray-400 font-inter">
                    Füge hier Songtexte von anderen Künstlern ein. Diese Texte werden in einer öffentlichen Datenbank gespeichert und dienen der KI als zusätzliche stilistische Referenz.
                </p>
                <textarea
                    placeholder="Songtext hier einfügen..."
                    className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all"
                    rows="10"
                ></textarea>
                <CustomButton icon={Save} className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500">
                    Referenztext speichern
                </CustomButton>
            </div>
        </div>
    );
};

export default ExternalLyrics;

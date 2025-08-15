import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import CustomButton from '@/components/ui/Button.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { ExternalLink, Save } from 'lucide-react';

const appId = 'default-songwriting-app';

const ExternalLyrics = () => {
    const [newLyric, setNewLyric] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    async function digestMessage(message) {
      const msgUint8 = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }

    const saveExternalLyric = async () => {
        if (!newLyric.trim()) return;
        setIsLoading(true);
        setMessage(null);
        try {
            const externalLyricsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'externalLyrics');
            const docId = await digestMessage(newLyric.trim().toLowerCase());
            const docRef = doc(externalLyricsCollection, docId);
            await setDoc(docRef, { content: newLyric, createdAt: new Date() });
            setNewLyric('');
            setMessage({type: 'success', text: 'Referenztext erfolgreich gespeichert.'});
        } catch (error) {
            console.error("Fehler beim Speichern des externen Textes:", error);
            setMessage({type: 'error', text: 'Fehler beim Speichern des Textes.'});
        }
        setIsLoading(false);
    };

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
                    value={newLyric}
                    onChange={(e) => setNewLyric(e.target.value)}
                    placeholder="Songtext hier einfügen..."
                    className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all"
                    rows="10"
                ></textarea>
                <CustomButton onClick={saveExternalLyric} isLoading={isLoading} icon={Save} className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500">
                    Referenztext speichern
                </CustomButton>
                {message && <MessageBox message={message.text} type={message.type} />}
            </div>
        </div>
    );
};

export default ExternalLyrics;
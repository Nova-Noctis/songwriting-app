import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import CustomButton from '../ui/Button.jsx';
import MessageBox from '../ui/MessageBox.jsx';
import { ExternalLink, Save } from 'lucide-react';

const appId = 'default-songwriting-app';

const ExternalLyrics = ({ externalLyrics }) => {
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
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-100 flex items-center"><ExternalLink className="mr-3 text-indigo-400"/>Externe Referenztexte</h2>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400 mb-4">
                    Füge hier Songtexte von anderen Künstlern ein. Diese Texte werden in einer öffentlichen Datenbank gespeichert und dienen der KI als zusätzliche stilistische Referenz.
                </p>
                <textarea
                    value={newLyric}
                    onChange={(e) => setNewLyric(e.target.value)}
                    placeholder="Songtext hier einfügen..."
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                    rows="10"
                ></textarea>
                <CustomButton onClick={saveExternalLyric} isLoading={isLoading} className="mt-4" icon={Save}>
                    Referenztext speichern
                </CustomButton>
                {message && <MessageBox message={message.text} type={message.type} />}
            </div>
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Bereits hinzugefügte Referenzen ({externalLyrics.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {externalLyrics.map(lyric => (
                        <p key={lyric.id} className="text-gray-400 text-sm p-2 bg-gray-900/50 rounded truncate">
                            {lyric.content}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExternalLyrics;
import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import CustomButton from '@/components/ui/Button.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { ExternalLink, Save } from 'lucide-react';

const appId = 'default-songwriting-app';

// Die Prop `externalLyrics` wird nicht mehr benötigt und wurde entfernt.
const ExternalLyrics = () => {
    const [newLyric, setNewLyric] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Hilfsfunktion zur Erstellung eines Hashs aus dem Textinhalt,
    // um das mehrfache Speichern identischer Texte zu vermeiden.
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
            setMessage({type: 'success', text: 'Referenztext erfolgreich gespeichert. Er steht nun allen Nutzern zur Verfügung.'});
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
                    Füge hier Songtexte von anderen Künstlern ein. Diese Texte werden in einer öffentlichen Datenbank gespeichert und dienen der KI als zusätzliche stilistische Referenz für den Songtext-Generator. Sie helfen, die Qualität der generierten Texte für alle Nutzer zu verbessern.
                </p>
                <textarea
                    value={newLyric}
                    onChange={(e) => setNewLyric(e.target.value)}
                    placeholder="Songtext von einem anderen Künstler hier einfügen..."
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                    rows="10"
                ></textarea>
                <CustomButton onClick={saveExternalLyric} isLoading={isLoading} className="mt-4" icon={Save}>
                    Referenztext speichern
                </CustomButton>
                {message && <MessageBox message={message.text} type={message.type} />}
            </div>
            {/* Der Block zur Anzeige der gespeicherten Texte wurde entfernt. */}
        </div>
    );
};

export default ExternalLyrics;
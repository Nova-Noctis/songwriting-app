import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { Save, Trash2, Lightbulb } from 'lucide-react';

const appId = 'default-songwriting-app';

const LineCollection = ({ userId }) => {
    const [lines, setLines] = useState([]);
    const [newLine, setNewLine] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Daten aus Firestore laden
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        
        const linesCollection = collection(db, 'artifacts', appId, 'users', userId, 'lines');
        const q = query(linesCollection);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const linesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLines(linesData);
            setIsLoading(false);
        }, (err) => {
            console.error("Fehler beim Abrufen der Lines:", err);
            setError("Konnte die Zeilen nicht laden.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    // Neue Zeile hinzufügen
    const addLine = async () => {
        if (!newLine.trim() || !userId) return;
        try {
            const linesCollection = collection(db, 'artifacts', appId, 'users', userId, 'lines');
            await addDoc(linesCollection, { content: newLine, createdAt: new Date() });
            setNewLine('');
        } catch (error) {
            console.error("Fehler beim Hinzufügen der Zeile:", error);
            setError("Fehler beim Hinzufügen der Zeile.");
        }
    };

    // Zeile löschen
    const deleteLine = async (id) => {
        if (!userId) return;
        try {
            const lineDoc = doc(db, 'artifacts', appId, 'users', userId, 'lines', id);
            await deleteDoc(lineDoc);
        } catch (error) {
            console.error("Fehler beim Löschen der Zeile:", error);
            setError("Fehler beim Löschen der Zeile.");
        }
    };

    return (
        <div>
            <div className="space-y-2 p-4 bg-gray-900/50 rounded-lg mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200">Neue Zeile hinzufügen</h3>
                <input 
                    type="text" 
                    value={newLine} 
                    onChange={e => setNewLine(e.target.value)} 
                    placeholder="Eine brillante Zeile..." 
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200"
                />
                <CustomButton onClick={addLine} icon={Save}>Sammeln</CustomButton>
            </div>

            <h3 className="text-lg font-semibold text-gray-200 mb-2">Gesammelte Zeilen</h3>
            {isLoading && <Spinner />}
            {error && <p className="text-red-400">{error}</p>}
            <div className="space-y-2">
                {lines.map(line => (
                    <div key={line.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-300">{line.content}</p>
                        <button onClick={() => deleteLine(line.id)} className="p-2 text-gray-400 hover:text-red-500">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
                {lines.length === 0 && !isLoading && (
                    <p className="text-gray-500">Noch keine Zeilen gesammelt.</p>
                )}
            </div>
        </div>
    );
};

export default LineCollection;
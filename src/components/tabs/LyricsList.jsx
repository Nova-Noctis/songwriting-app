import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { Edit, Save, Trash2, X } from 'lucide-react';

const appId = 'default-songwriting-app';

// MODAL-KOMPONENTE FÜR DIE BEARBEITUNG
const EditModal = ({ lyric, onSave, onClose }) => {
    const [editText, setEditText] = useState(lyric.content);

    const handleSave = () => {
        onSave(lyric.id, editText);
        onClose();
    };
// Finale Version des Modal
    return (
        // Backdrop / Overlay
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
            onClick={onClose} // Schließt das Modal bei Klick auf den Hintergrund
        >
            {/* Modal-Container */}
            <div 
                className="glass-panel rounded-2xl shadow-xl p-6 w-11/12 md:w-2/3 lg:w-1/2 space-y-4"
                onClick={e => e.stopPropagation()} // Verhindert, dass Klicks im Modal es schließen
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-100">Text bearbeiten: <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">{lyric.title}</span></h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Große Textarea für die Bearbeitung */}
                <textarea 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)} 
                    rows="15" 
                    className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all font-inter"
                ></textarea>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-black/20 text-white font-semibold rounded-lg hover:bg-white/20 border border-gray-600 font-orbitron">
                        Abbrechen
                    </button>
                    <CustomButton onClick={handleSave} icon={Save}>
                        Änderungen speichern
                    </CustomButton>
                </div>
            </div>
        </div>
    );
};


const LyricsList = ({ userId }) => {
    const [lyrics, setLyrics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    // State, um das zu bearbeitende Lied im Modal zu speichern
    const [editingLyric, setEditingLyric] = useState(null);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
        const q = query(lyricsCollection);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setLyrics(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (err) => {
            console.error("Fehler beim Abrufen der Texte:", err);
            setError("Konnte Texte nicht laden.");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    const addLyric = async () => {
        if (!newTitle || !newContent || !userId) return;
        try {
            const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
            await addDoc(lyricsCollection, { title: newTitle, content: newContent, createdAt: new Date() });
            setNewTitle('');
            setNewContent('');
        } catch (err) {
            setError("Fehler beim Hinzufügen des Textes.");
        }
    };

    const deleteLyric = async (id) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'lyrics', id));
        } catch (err) {
            setError("Fehler beim Löschen des Textes.");
        }
    };
    
    const saveEdit = async (id, newContent) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'lyrics', id), { content: newContent });
        } catch (err) {
            setError("Fehler beim Speichern der Änderungen.");
        }
    };
    
    return (
        <div>
             <div className="space-y-4 p-4 bg-black/20 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-200">Neuen Text hinzufügen</h3>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titel" className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all font-inter" />
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Songtext hier einfügen..." rows="5" className="w-full p-3 bg-black/30 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all font-inter"></textarea>
                <CustomButton onClick={addLyric} icon={Save}>Speichern</CustomButton>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Gespeicherte Texte</h3>
            {isLoading && <Spinner />}
            {error && <MessageBox message={error} type="error" />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lyrics.map(lyric => (
                     <div key={lyric.id} className="glass-panel rounded-xl p-4 flex flex-col justify-between hover:border-white/40 transition-all">
                        <div>
                            <h4 className="font-bold text-gray-100 truncate">{lyric.title}</h4>
                            <p className="text-gray-400 mt-2 text-sm h-24 overflow-hidden text-ellipsis font-inter">
                                {lyric.content}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                            <button onClick={() => setEditingLyric(lyric)} className="flex-grow flex items-center justify-center p-2 text-sm bg-white/10 hover:bg-white/20 rounded-md text-gray-200 transition-colors font-orbitron"><Edit size={16} className="mr-2"/>Bearbeiten</button>
                            <button onClick={() => deleteLyric(lyric.id)} className="p-2 bg-white/10 text-gray-400 hover:bg-red-500/50 hover:text-white rounded-md transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {lyrics.length === 0 && !isLoading && (
                <p className="text-gray-500 font-inter">Noch keine Texte gespeichert.</p>
            )}

            {/* Das Bearbeitungs-Modal wird hier gerendert, wenn ein Text ausgewählt wurde */}
            {editingLyric && (
                <EditModal 
                    lyric={editingLyric}
                    onSave={saveEdit}
                    onClose={() => setEditingLyric(null)}
                />
            )}
        </div>
    )
};

export default LyricsList;

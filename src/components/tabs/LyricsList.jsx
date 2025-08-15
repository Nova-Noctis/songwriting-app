import React, { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config.js';
import CustomButton from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import MessageBox from '@/components/ui/MessageBox.jsx';
import { Edit, Save, Trash2, X } from 'lucide-react';

const appId = 'default-songwriting-app';

// NEUE MODAL-KOMPONENTE FÜR DIE BEARBEITUNG
// In einem echten Projekt würde diese in einer eigenen Datei liegen (z.B. ui/EditModal.jsx)
const EditModal = ({ lyric, onSave, onClose }) => {
    const [editText, setEditText] = useState(lyric.content);

    const handleSave = () => {
        onSave(lyric.id, editText);
        onClose();
    };

    return (
        // Backdrop / Overlay
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
            onClick={onClose} // Schließt das Modal bei Klick auf den Hintergrund
        >
            {/* Modal-Container */}
            <div 
                className="bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 md:w-2/3 lg:w-1/2 space-y-4 border border-gray-700"
                onClick={e => e.stopPropagation()} // Verhindert, dass Klicks im Modal es schließen
            >
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-indigo-400">Text bearbeiten: <span className="text-white">{lyric.title}</span></h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Große Textarea für die Bearbeitung */}
                <textarea 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)} 
                    rows="15" 
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
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


const LyricsList = ({ userId, lyrics, isLoading, error, setError }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    // State, um das zu bearbeitende Lied im Modal zu speichern
    const [editingLyric, setEditingLyric] = useState(null);

    const addLyric = async () => {
        if (!newTitle || !newContent || !userId) return;
        try {
            const lyricsCollection = collection(db, 'artifacts', appId, 'users', userId, 'lyrics');
            await addDoc(lyricsCollection, { title: newTitle, content: newContent, createdAt: new Date() });
            setNewTitle('');
            setNewContent('');
        } catch (error) {
            console.error("Fehler beim Hinzufügen des Textes:", error);
            setError("Fehler beim Hinzufügen des Textes.");
        }
    };

    const deleteLyric = async (id) => {
        if (!userId) return;
        try {
            const lyricDoc = doc(db, 'artifacts', appId, 'users', userId, 'lyrics', id);
            await deleteDoc(lyricDoc);
        } catch (error) {
            console.error("Fehler beim Löschen des Textes:", error);
            setError("Fehler beim Löschen des Textes.");
        }
    };
    
    const saveEdit = async (id, newContent) => {
        if (!userId) return;
        try {
            const lyricDoc = doc(db, 'artifacts', appId, 'users', userId, 'lyrics', id);
            await updateDoc(lyricDoc, { content: newContent });
        } catch (error) {
            console.error("Fehler beim Speichern der Änderungen:", error);
            setError("Fehler beim Speichern der Änderungen.");
        }
    };
    
    return (
        <div>
             <div className="space-y-2 p-4 bg-gray-900/50 rounded-lg mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200">Neuen Text hinzufügen</h3>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titel" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200" />
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Songtext hier einfügen..." rows="5" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200"></textarea>
                <CustomButton onClick={addLyric} icon={Save}>Speichern</CustomButton>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Gespeicherte Texte</h3>
            {isLoading && <Spinner />}
            {error && <MessageBox message={error} type="error" />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lyrics.map(lyric => (
                     <div key={lyric.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col justify-between hover:border-indigo-500 transition-all">
                        <div>
                            <h4 className="font-bold text-indigo-400 truncate">{lyric.title}</h4>
                            <p className="text-gray-400 mt-2 text-sm h-24 overflow-hidden text-ellipsis">
                                {lyric.content}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                            <button onClick={() => setEditingLyric(lyric)} className="flex-grow flex items-center justify-center p-2 text-sm bg-gray-700 hover:bg-indigo-600 rounded-md text-gray-200 transition-colors"><Edit size={16} className="mr-2"/>Bearbeiten</button>
                            <button onClick={() => deleteLyric(lyric.id)} className="p-2 bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white rounded-md transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
            {lyrics.length === 0 && !isLoading && (
                <p className="text-gray-500">Noch keine Texte gespeichert.</p>
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
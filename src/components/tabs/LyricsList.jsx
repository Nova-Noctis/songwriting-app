import React, { useState } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import CustomButton from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import MessageBox from '../ui/MessageBox.jsx';
import { Edit, Save, Trash2 } from 'lucide-react';

const appId = 'default-songwriting-app';

const LyricsList = ({ userId, lyrics, isLoading, error, setError }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [expandedId, setExpandedId] = useState(null);

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

    const startEditing = (lyric) => {
        setEditingId(lyric.id);
        setEditingText(lyric.content);
        setExpandedId(lyric.id);
    };
    
    const saveEdit = async (id) => {
        if (!userId) return;
        try {
            const lyricDoc = doc(db, 'artifacts', appId, 'users', userId, 'lyrics', id);
            await updateDoc(lyricDoc, { content: editingText });
            setEditingId(null);
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
                     <div key={lyric.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-indigo-400 truncate cursor-pointer" onClick={() => setExpandedId(expandedId === lyric.id ? null : lyric.id)}>{lyric.title}</h4>
                            {expandedId === lyric.id && (
                                editingId === lyric.id ? (
                                    <textarea value={editingText} onChange={e => setEditingText(e.target.value)} rows="5" className="w-full mt-2 p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200"></textarea>
                                ) : (
                                    <p className="text-gray-300 mt-2 whitespace-pre-wrap text-sm">{lyric.content}</p>
                                )
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                            {editingId === lyric.id ? (
                                <CustomButton onClick={() => saveEdit(lyric.id)} icon={Save} className="text-sm py-1 px-2">Speichern</CustomButton>
                            ) : (
                                <button onClick={() => startEditing(lyric)} className="p-2 text-gray-400 hover:text-white"><Edit size={16}/></button>
                            )}
                            <button onClick={() => deleteLyric(lyric.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default LyricsList;

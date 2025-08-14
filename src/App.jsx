import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase/config.js';
import Spinner from '@/components/ui/Spinner.jsx';
import Generator from '@/components/tabs/Generator.jsx';
import MyLyrics from '@/components/tabs/MyLyrics.jsx';
import ExternalLyrics from '@/components/tabs/ExternalLyrics.jsx';

const appId = 'default-songwriting-app';

export default function App() {
    const [activeTab, setActiveTab] = useState('Generator');
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [myLyrics, setMyLyrics] = useState([]);
    const [externalLyrics, setExternalLyrics] = useState([]);

    useEffect(() => {
        let unsubscribeMyLyrics = () => {};
        let unsubscribeExternalLyrics = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);

                const myLyricsCollection = collection(db, 'artifacts', appId, 'users', user.uid, 'lyrics');
                unsubscribeMyLyrics = onSnapshot(myLyricsCollection, (snapshot) => {
                    setMyLyrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                const externalLyricsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'externalLyrics');
                unsubscribeExternalLyrics = onSnapshot(externalLyricsCollection, (snapshot) => {
                    setExternalLyrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                setIsAuthReady(true);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Fehler bei der anonymen Anmeldung:", error);
                }
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeMyLyrics();
            unsubscribeExternalLyrics();
        };
    }, []);

    const tabs = {
        Generator: <Generator userId={userId} myLyrics={myLyrics} externalLyrics={externalLyrics} setActiveTab={setActiveTab} />,
        'Eigene Texte': <MyLyrics userId={userId} />,
        'Externe Texte': <ExternalLyrics externalLyrics={externalLyrics} />,
    };

    const TabButton = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === name
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {name}
        </button>
    );

    if (!isAuthReady) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Spinner size={48} />
                    <p className="mt-4">Authentifizierung läuft...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-center text-white mb-2">Songwriter-Werkzeug AI</h1>
                    <p className="text-center text-indigo-300">Dein kreativer Partner für den nächsten Hit</p>
                </header>
                <nav className="flex justify-center space-x-2 md:space-x-4 mb-8 p-2 bg-gray-800 rounded-lg">
                    {Object.keys(tabs).map(tabName => <TabButton key={tabName} name={tabName} />)}
                </nav>
                <main>
                    {tabs[activeTab]}
                </main>
                <footer className="text-center mt-12 text-gray-500 text-sm">
                    <p>UserID: {userId || 'wird geladen...'}</p>
                    <p>Powered by React, Firebase & Google Gemini.</p>
                </footer>
            </div>
        </div>
    );
}

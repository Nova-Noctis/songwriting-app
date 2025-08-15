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
            className={`font-orbitron px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                activeTab === name
                    ? 'bg-white/90 text-black shadow-lg'
                    : 'text-gray-300 hover:bg-white/20'
            }`}
        >
            {name}
        </button>
    );

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Spinner size={48} />
                    <p className="mt-4 font-orbitron">Authentifizierung läuft...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-50 to-gray-400 mb-2 tracking-widest">
                        SONGWRITER AI
                    </h1>
                    <p className="text-gray-400 text-lg tracking-wider font-orbitron">Dein kreativer Partner für den nächsten Hit</p>
                </header>
                <nav className="flex justify-center space-x-2 md:space-x-4 mb-8 p-2 glass-panel rounded-xl">
                    {Object.keys(tabs).map(tabName => <TabButton key={tabName} name={tabName} />)}
                </nav>
                <main>
                    {tabs[activeTab]}
                </main>
                <footer className="text-center mt-12 text-gray-500 text-sm font-orbitron">
                    <p>UserID: {userId || 'wird geladen...'}</p>
                    <p>Powered by React, Firebase & Google Gemini.</p>
                </footer>
            </div>
        </div>
    );
}

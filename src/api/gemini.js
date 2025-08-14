export const callGeminiAPI = async (prompt, retries = 3, delay = 1000) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
    
    // Test-Log, um zu prüfen, ob der Key geladen wird. Kann später entfernt werden.
    console.log("API-Funktion hat folgenden Schlüssel erhalten:", apiKey);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Gibt die Fehlermeldung des Servers zurück, falls vorhanden
                const errorData = await response.json();
                throw new Error(`API-Fehler: ${response.statusText} - ${errorData?.error?.message || ''}`);
            }

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                 // Fängt den Fall ab, dass die Antwort-Struktur gültig ist, aber keinen Text enthält
                 throw new Error("Unerwartete, aber gültige Antwortstruktur von der API erhalten.");
            }
        } catch (error) {
            if (i === retries - 1) {
                console.error("Fehler beim Aufrufen der Gemini API nach mehreren Versuchen:", error);
                // Gibt immer einen String zurück, um .split() Fehler zu vermeiden
                return `Fehler: Konnte keine Antwort von der KI erhalten. Grund: ${error.message}`;
            }
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
};

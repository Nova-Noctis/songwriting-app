export const callGeminiAPI = async (prompt, retries = 3, delay = 1000) => {
    // HINWEIS: In einer echten Anwendung sollte der API-Schlüssel sicher
    // über Umgebungsvariablen geladen werden (z.B. VITE_GEMINI_API_KEY).
    const apiKey = ""; 
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

            if (!response.ok) throw new Error(`API-Fehler: ${response.statusText}`);

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                 throw new Error("Unerwartete Antwortstruktur von der API.");
            }
        } catch (error) {
            if (i === retries - 1) {
                console.error("Fehler beim Aufrufen der Gemini API nach mehreren Versuchen:", error);
                return `Fehler: Konnte keine Antwort von der KI erhalten. Grund: ${error.message}`;
            }
            await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        }
    }
};

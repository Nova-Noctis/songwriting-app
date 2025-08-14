export const fetchSynonyms = async (word) => {
    try {
        const response = await fetch(`https://www.openthesaurus.de/synonyme/search?q=${encodeURIComponent(word)}&format=application/json`);
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok.');
        }
        const data = await response.json();
        return data.synsets.flatMap(synset => synset.terms.map(term => term.term));
    } catch (error) {
        console.error("Fehler beim Abrufen von Synonymen:", error);
        return ["Fehler beim Laden der Synonyme."];
    }
};

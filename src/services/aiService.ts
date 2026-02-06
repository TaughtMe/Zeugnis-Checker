import { AnalysisResults } from '../types/student';

const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

const SYSTEM_PROMPT = `
Du bist ein präziser "Zeugnis-Scanner". Deine Aufgabe ist es, Informationen aus deutschen Schulzeugnissen zu extrahieren.

EXTRAKTIONS-REGELN:
1. Name des Schülers: Suche vorrangig nach Mustern wie "Zeugnis für [Vorname] [Nachname]" oder nach der Zeile direkt unter dem Briefkopf/Schulnamen. Der Name ist das wichtigste Feld.
2. Fächer und Noten: Extrahiere alle Fächer und die dazugehörigen Noten als Ganzzahlen (1-6).
3. Zeitform: Analysiere die Verben im Fließtext der Beurteilung. 
   - 'bringt', 'lässt', 'reflektiert', 'ist', 'kann' = Präsens. 
   - 'brachte', 'ließ', 'reflektierte', 'war', 'konnte' = Präteritum.
   Gib "Präsens" nur zurück, wenn die absolute Mehrheit der Verben in der Gegenwartsform steht. Ansonsten wähle "Präteritum" oder "Bunt gemischt".
4. LRS/Notenschutz: Suche nach Hinweisen auf Lese-Rechtschreib-Schwäche (LRS), Legasthenie oder Notenschutz.

CONSTRAINT:
- Erzeuge ZWINGEND reines JSON.
- Keine Interpretation, nur Fakten-Extraktion.
- Wenn keine Informationen gefunden werden, gib leere Arrays oder null zurück.

JSON-FORMAT:
{
  "studentName": "Vorname Nachname",
  "subjects": [{"name": "Mathematik", "grade": 2}, ...],
  "tense": "Präsens" | "Präteritum" | "Bunt gemischt",
  "lrsHints": ["Hinweistext 1", ...],
  "reportType": "ZWISCHENZEUGNIS" | "JAHRESZEUGNIS" | "UNBEKANNT"
}
`;

export const aiService = {
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch('http://localhost:1234/v1/models');
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    async analyzeReport(text: string): Promise<AnalysisResults> {
        try {
            const response = await fetch(LM_STUDIO_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "local-model", // LM Studio uses whatever is loaded
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1,
                }),
            });

            if (!response.ok) {
                throw new Error('LM Studio API returned an error');
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            try {
                return this.parseAIResponse(content);
            } catch (parseError) {
                console.warn('Initial JSON parse failed, trying fallback...', parseError);
                return this.fallbackParser(content);
            }
        } catch (error) {
            console.error('AI Analysis failed:', error);
            throw error;
        }
    },

    parseAIResponse(content: string): AnalysisResults {
        // Find JSON block if AI wrapped it in markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonStr);

        return {
            subjects: parsed.subjects || [],
            tense: parsed.tense || 'Bunt gemischt',
            lrsHints: parsed.lrsHints || [],
            promotionAtRisk: false,
            reportType: parsed.reportType || 'UNBEKANNT',
            aiStudentName: parsed.studentName || null
        };
    },

    fallbackParser(content: string): AnalysisResults {
        // Very basic fallback if JSON is completely broken
        return {
            subjects: [],
            tense: 'Bunt gemischt',
            lrsHints: ['Fehler bei der Datenextraktion: Ungültiges Format'],
            promotionAtRisk: false,
            reportType: 'UNBEKANNT',
            aiStudentName: null
        };
    }
};

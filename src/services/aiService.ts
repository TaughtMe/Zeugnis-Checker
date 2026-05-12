import { AnalysisResults } from '../types/student';

const LM_STUDIO_BASE = 'http://localhost:1234/v1';
const LM_STUDIO_URL = `${LM_STUDIO_BASE}/chat/completions`;

const SYSTEM_PROMPT = `
Du bist ein präziser "Zeugnis-Scanner". Deine Aufgabe ist es,
Informationen aus deutschen Schulzeugnissen zu extrahieren.

EXTRAKTIONS-REGELN:
1. studentName: Suche vorrangig nach Mustern wie "Zeugnis für [Vorname] [Nachname]"
   oder nach der Zeile direkt unter dem Briefkopf/Schulnamen. Der Name ist das wichtigste Feld.
2. subjects: Extrahiere ALLE Fächer und die dazugehörigen Noten als Ganzzahlen 1 bis 6.
   Notentendenzen wie "2+" oder "2-" auf die jeweilige Ganzzahl runden.
3. tense: Analysiere die Verben im FLIESSTEXT der Beurteilung (Kopfdaten/Tabellen ignorieren).
   - Gegenwart ("ist", "kann", "bringt", "lässt", "reflektiert", "zeigt", "arbeitet") = "Präsens"
   - Vergangenheit ("war", "konnte", "brachte", "ließ", "reflektierte", "zeigte", "arbeitete") = "Präteritum"
   Gib "Präsens" nur zurück, wenn die KLARE Mehrheit (> 70 %) der Verben in der Gegenwart steht.
   Gib "Präteritum" zurück, wenn die klare Mehrheit in der Vergangenheit steht.
   Gib "Bunt gemischt" zurück, wenn beide Zeitformen ähnlich häufig vorkommen.
4. tenseConfidence: Wie sicher bist du bei der Zeitform? 0.0 = unsicher, 1.0 = sehr sicher.
5. reportType: Suche nach "ZWISCHENZEUGNIS" oder "JAHRESZEUGNIS" im Text.
   Wenn nicht gefunden, gib "UNBEKANNT" zurück.
   WICHTIG zum Tempus-Check: Ein ZWISCHENZEUGNIS MUSS im Präsens stehen,
   ein JAHRESZEUGNIS MUSS im Präteritum stehen.
6. lrsHints: NUR explizite Hinweise auf rechtliche/formelle Sonderregelungen
   beim Schreiben/Lesen. Aufnehmen nur, wenn der Text EINEN der folgenden
   Begriffe wortwörtlich enthält:
   - "LRS", "Lese-Rechtschreib-Schwäche", "Lese-Rechtschreib-Störung"
   - "Legasthenie", "Legastheniker"
   - "Notenschutz", "Nachteilsausgleich"
   - "Rechtschreibung wird nicht bewertet", "Rechtschreibleistung wurde nicht
     in die Bewertung einbezogen"
   - "Bewertung der Rechtschreibung ausgesetzt"
   STRIKT VERBOTEN: Reine Beschreibungen des Lernverhaltens, der Reflexion,
   der Mitarbeit, der Konzentration, der Lernfortschritte oder ähnliches
   sind KEINE LRS-Hinweise. Wenn keiner der oben genannten Begriffe
   wortwörtlich vorkommt → leeres Array [].
7. isValidReport: true, wenn der Text wirklich ein deutsches Schulzeugnis-Profil ist
   (mit Schülername UND Noten). false, wenn es z.B. ein Deckblatt, eine Anleitung,
   eine Liste oder sonstiger Müll ist.

CONSTRAINTS:
- Erzeuge AUSSCHLIESSLICH valides JSON nach dem vorgegebenen Schema.
- Keine Interpretation, nur Fakten-Extraktion.
- Wenn keine Information gefunden wird: leere Arrays bzw. null.
`;

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        studentName: { type: ["string", "null"] },
        subjects: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    grade: { type: "integer", minimum: 1, maximum: 6 }
                },
                required: ["name", "grade"]
            }
        },
        tense: { type: "string", enum: ["Präsens", "Präteritum", "Bunt gemischt"] },
        tenseConfidence: { type: "number", minimum: 0, maximum: 1 },
        lrsHints: { type: "array", items: { type: "string" } },
        reportType: { type: "string", enum: ["ZWISCHENZEUGNIS", "JAHRESZEUGNIS", "UNBEKANNT"] },
        isValidReport: { type: "boolean" }
    },
    required: ["studentName", "subjects", "tense", "tenseConfidence", "lrsHints", "reportType", "isValidReport"]
};

export const aiService = {
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${LM_STUDIO_BASE}/models`);
            return response.ok;
        } catch {
            return false;
        }
    },

    async analyzeReport(text: string): Promise<AnalysisResults> {
        const response = await fetch(LM_STUDIO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "local-model",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                temperature: 0.1,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "zeugnis_analysis",
                        strict: true,
                        schema: RESPONSE_SCHEMA
                    }
                }
            }),
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new Error(`LM Studio antwortete mit ${response.status}. ${detail.slice(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Leere KI-Antwort.');

        return parseAIResponse(content);
    },
};

const LRS_KEYWORDS = [
    'lrs',
    'lese-rechtschreib',
    'leserechtschreib',
    'legasthen',
    'notenschutz',
    'nachteilsausgleich',
    'rechtschreibung wird nicht',
    'rechtschreibung nicht bewertet',
    'rechtschreibleistung',
    'bewertung der rechtschreibung'
];

function isRealLrsHint(hint: string): boolean {
    const lower = hint.toLowerCase();
    return LRS_KEYWORDS.some(kw => lower.includes(kw));
}

function parseAIResponse(content: string): AnalysisResults {
    let parsed: Record<string, unknown>;
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error('KI-Antwort konnte nicht als JSON gelesen werden.');
    }

    const rawHints = Array.isArray(parsed.lrsHints) ? parsed.lrsHints as string[] : [];
    // Clientseitiges Safety-Net gegen Halluzinationen: jeder Hint muss eines
    // der LRS-Schlüsselwörter enthalten, sonst wird er verworfen.
    const cleanedHints = rawHints.filter(isRealLrsHint);

    return {
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects as { name: string; grade: number }[] : [],
        tense: (parsed.tense as AnalysisResults['tense']) || 'Bunt gemischt',
        tenseConfidence: typeof parsed.tenseConfidence === 'number' ? parsed.tenseConfidence : undefined,
        lrsHints: cleanedHints,
        promotionAtRisk: false,
        reportType: (parsed.reportType as AnalysisResults['reportType']) || 'UNBEKANNT',
        aiStudentName: (parsed.studentName as string) || null,
        isValidReport: typeof parsed.isValidReport === 'boolean' ? parsed.isValidReport : true
    };
}

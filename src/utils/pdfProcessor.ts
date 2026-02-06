import { StudentProfile, AnalysisResults } from '../types/student';

/**
 * Splits the raw PDF text into individual student segments and extracts their names.
 */
export function processRawPdfText(fullText: string): StudentProfile[] {
    // Regex to split by the keywords "ZWISCHENZEUGNIS" or "JAHRESZEUGNIS"
    // We use lookahead to keep the keyword with the segment
    const rawSegments = fullText.split(/(?=ZWISCHENZEUGNIS|JAHRESZEUGNIS)/i).filter(s => s.trim().length > 0);

    // Filter segments:
    // 1. Must be at least 200 characters long
    // 2. Must contain something that looks like a grade (number 1-6 near a subject or in a list)
    //    Actually, lets look for "Note" or common subject names + a number
    const filteredSegments = rawSegments.filter(segment => {
        const isLongEnough = segment.length > 200;
        // Simple regex to check for numbers 1-6 (often found in grade tables)
        const hasGrades = /[1-6]/.test(segment);

        return isLongEnough && hasGrades;
    });

    return filteredSegments.map((segment, index) => {
        // Provisional name extraction
        const nameMatch = segment.match(/(?:Schüler\/in:|Name:)\s*([^\n\r]+)/i);
        const name = nameMatch ? nameMatch[1].trim() : `Unbekannter Schüler ${index + 1}`;

        // Detect report type
        let reportType: AnalysisResults['reportType'] = 'UNBEKANNT';
        if (/ZWISCHENZEUGNIS/i.test(segment)) {
            reportType = 'ZWISCHENZEUGNIS';
        } else if (/JAHRESZEUGNIS/i.test(segment)) {
            reportType = 'JAHRESZEUGNIS';
        }

        return {
            id: crypto.randomUUID(),
            name,
            rawText: segment.trim(),
            status: 'pending',
            resultStatus: null,
            results: {
                subjects: [],
                tense: 'Präsens', // placeholder
                lrsHints: [],
                promotionAtRisk: false,
                reportType
            },
        };
    });
}

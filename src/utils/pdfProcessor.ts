import { StudentProfile, AnalysisResults } from '../types/student';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Reads a PDF file (selected via <input type="file">) and returns its full text.
 * Runs entirely in the browser — no data leaves the device.
 */
export async function extractPdfText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

/**
 * Splits the raw PDF text into individual student segments and extracts their names.
 */
export function processRawPdfText(fullText: string): StudentProfile[] {
    const rawSegments = fullText.split(/(?=ZWISCHENZEUGNIS|JAHRESZEUGNIS)/i).filter(s => s.trim().length > 0);

    const filteredSegments = rawSegments.filter(segment => {
        const isLongEnough = segment.length > 200;
        const hasGrades = /[1-6]/.test(segment);
        return isLongEnough && hasGrades;
    });

    return filteredSegments.map((segment, index) => {
        const nameMatch = segment.match(/(?:Schüler\/in:|Name:)\s*([^\n\r]+)/i);
        const name = nameMatch ? nameMatch[1].trim() : `Unbekannter Schüler ${index + 1}`;

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
                tense: 'Präsens',
                lrsHints: [],
                promotionAtRisk: false,
                reportType
            },
        };
    });
}

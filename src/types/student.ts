export interface AnalysisResults {
    subjects: { name: string; grade: number }[];
    tense: 'Präsens' | 'Präteritum' | 'Bunt gemischt';
    tenseConfidence?: number;
    lrsHints: string[];
    promotionAtRisk: boolean;
    reportType: 'ZWISCHENZEUGNIS' | 'JAHRESZEUGNIS' | 'UNBEKANNT';
    aiStudentName?: string | null;
    isValidReport?: boolean;
}

export interface StudentProfile {
    id: string;
    name: string;
    className: string;
    uploadOrder: number;
    sourceFile: string;
    rawText: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    resultStatus: 'danger' | 'warning' | 'clear' | null;
    statusReason?: string;
    errorMessage?: string;
    results: AnalysisResults | null;
}

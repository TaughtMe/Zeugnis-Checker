export interface AnalysisResults {
    subjects: { name: string; grade: number }[];
    tense: 'Präsens' | 'Präteritum' | 'Bunt gemischt';
    lrsHints: string[];
    promotionAtRisk: boolean;
    reportType: 'ZWISCHENZEUGNIS' | 'JAHRESZEUGNIS' | 'UNBEKANNT';
    aiStudentName?: string | null;
}

export interface StudentProfile {
    id: string;
    name: string;
    className: string;
    uploadOrder: number;
    sourceFile: string;
    rawText: string;
    status: 'pending' | 'processing' | 'completed';
    resultStatus: 'danger' | 'warning' | 'clear' | null;
    statusReason?: string;
    results: AnalysisResults | null;
}

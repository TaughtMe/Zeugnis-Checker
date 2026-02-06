export type PromotionStatus = 'danger' | 'warning' | 'clear';

export interface SubjectGrades {
    [subject: string]: number;
}

/**
 * Subjects that are not relevant for promotion status.
 */
export const NON_PROMOTION_SUBJECTS = [
    "Sport"
];

/**
 * Checks if a subject is relevant for promotion.
 */
export function isPromotionRelevant(subject: string): boolean {
    return !NON_PROMOTION_SUBJECTS.some(nonSub =>
        subject.toLowerCase().includes(nonSub.toLowerCase())
    );
}

/**
 * Checks the promotion status (Vorrückungsstatus) based on MSO rules.
 * 
 * Rules:
 * - danger: Two or more grades of 5, OR at least one grade of 6 in promotion-relevant subjects.
 * - clear: Otherwise.
 * 
 * @param grades An object containing subject names as keys and grades (1-6) as values.
 * @returns PromotionStatus
 */
export function checkPromotionStatus(grades: SubjectGrades): PromotionStatus {
    const relevantGrades = Object.entries(grades)
        .filter(([subject]) => isPromotionRelevant(subject))
        .map(([, grade]) => grade);

    const countFives = relevantGrades.filter(g => g === 5).length;
    const countSixes = relevantGrades.filter(g => g === 6).length;

    if (countSixes >= 1 || countFives >= 2) {
        return 'danger';
    }

    return 'clear';
}

/**
 * Rules for tense validation.
 */
export function validateTense(detectedTense: string, reportType: string): 'warning' | 'clear' {
    if (reportType === 'ZWISCHENZEUGNIS' && detectedTense !== 'Präsens') {
        return 'warning';
    }
    if (reportType === 'JAHRESZEUGNIS' && detectedTense !== 'Präteritum') {
        return 'warning';
    }
    return 'clear';
}

/**
 * Sanity check for tense. 
 * Looks for common present tense indicators in German.
 */
export function tenseSanityCheck(text: string): 'Präsens' | 'Präteritum' {
    const presentIndicators = [/\bist\b/i, /\bhat\b/i, /\bkann\b/i, /\bzeigt\b/i, /\bsetzt\b/i, /\barbeitet\b/i];
    const matchCount = presentIndicators.filter(regex => regex.test(text)).length;

    // If we find 3 or more strong present tense indicators, we suspect it's Present tense
    return matchCount >= 3 ? 'Präsens' : 'Präteritum';
}

/**
 * Generates a human-readable reason for the status.
 */
export function generateStatusReason(
    status: PromotionStatus,
    results: {
        promotionAtRisk: boolean;
        tenseValid: boolean;
        hasHints: boolean;
        countFives: number;
        countSixes: number;
        reportType: string;
        detectedTense: string;
        allGrades?: SubjectGrades;
    }
): string {
    if (status === 'danger') {
        const parts = [];
        if (results.countSixes > 0) parts.push(`${results.countSixes}x Note 6`);
        if (results.countFives > 0) parts.push(`${results.countFives}x Note 5`);
        return `Versetzungsgefahr: ${parts.join(' & ')}`;
    }

    if (status === 'warning') {
        if (!results.tenseValid) {
            return `Formfehler: Falsche Zeitform (${results.detectedTense} statt ${results.reportType === 'ZWISCHENZEUGNIS' ? 'Präsens' : 'Präteritum'})`;
        }
        if (results.hasHints) {
            return `Hinweise: Auffälligkeiten im Text gefunden`;
        }
    }

    if (status === 'clear') {
        // Let's re-write this more cleanly to avoid 'arguments' confusion and lint issues
        const allGrades = results.allGrades || {};
        const ignoredFailing = Object.entries(allGrades).filter(([subject, grade]) => {
            return !isPromotionRelevant(subject) && (grade as number) >= 5;
        });

        if (ignoredFailing.length > 0) {
            const subjects = ignoredFailing.map(([s]) => s).join(', ');
            const grade = ignoredFailing[0][1];
            return `Hinweis: Die Note ${grade} in ${subjects} ist laut MSO nicht vorrückungsrelevant.`;
        }
    }

    return 'Alles in Ordnung';
}

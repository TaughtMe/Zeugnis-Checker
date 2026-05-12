import { create } from 'zustand';
import { StudentProfile, AnalysisResults } from '../types/student';
import { aiService } from '../services/aiService';
import { whitelistService } from '../services/whitelistService';
import { checkPromotionStatus, SubjectGrades, validateTense, generateStatusReason, tenseSanityCheck, isPromotionRelevant } from '../utils/msoLogic';

interface StudentState {
    students: StudentProfile[];
    selectedStudentId: string | null;
    isAnalyzing: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'checking';
    whitelist: string[];
    excludedFromAverage: string[];
    lastError: string | null;

    setStudents: (students: StudentProfile[]) => void;
    selectStudent: (id: string | null) => void;
    updateStudentStatus: (id: string, status: StudentProfile['status'], results?: AnalysisResults, errorMessage?: string) => void;
    startBatchAnalysis: () => Promise<void>;
    updateStudentName: (id: string, name: string) => void;
    removeStudent: (id: string) => void;
    clearAll: () => void;
    checkConnection: () => Promise<void>;

    loadWhitelist: () => Promise<void>;
    addToWhitelist: (term: string) => Promise<void>;
    reEvaluateStudentStatus: (id: string) => void;

    toggleSubjectInAverage: (subject: string) => void;
    initializeExcludedSubjects: () => void;

    setLastError: (message: string | null) => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
    students: [],
    selectedStudentId: null,
    isAnalyzing: false,
    connectionStatus: 'checking',
    whitelist: [],
    excludedFromAverage: [],
    lastError: null,

    setStudents: (students) => set({ students, selectedStudentId: null }),
    selectStudent: (id) => set({ selectedStudentId: id }),
    setLastError: (message) => set({ lastError: message }),

    updateStudentStatus: (id, status, results, errorMessage) => {
        set((state) => {
            const students = state.students.map((s) => {
                if (s.id !== id) return s;

                if (status === 'error') {
                    return { ...s, status, errorMessage };
                }

                const newResults = results || s.results;
                let resultStatus: StudentProfile['resultStatus'] = null;
                let statusReason: string | undefined = undefined;

                if (newResults) {
                    const filteredHints = (newResults.lrsHints || []).filter(hint =>
                        !state.whitelist.some(w => hint.toLowerCase().includes(w.toLowerCase()))
                    );

                    let detectedTense = newResults.tense;
                    // Sanity-Check nur bei niedriger AI-Confidence
                    const lowConfidence = (newResults.tenseConfidence ?? 1) < 0.6;
                    if (lowConfidence && detectedTense === 'Präteritum') {
                        const sanityTense = tenseSanityCheck(s.rawText);
                        if (sanityTense === 'Präsens') detectedTense = 'Präsens';
                    }

                    const tenseStatus = validateTense(detectedTense, newResults.reportType);

                    const gradeMap: SubjectGrades = {};
                    (newResults.subjects || []).forEach(subj => {
                        gradeMap[subj.name] = subj.grade;
                    });

                    const countFives = (newResults.subjects || []).filter(sj => sj.grade === 5).length;
                    const countSixes = (newResults.subjects || []).filter(sj => sj.grade === 6).length;
                    const promotionStatus = checkPromotionStatus(gradeMap);

                    if (promotionStatus === 'danger') {
                        resultStatus = 'danger';
                    } else if (tenseStatus === 'warning' || filteredHints.length > 0) {
                        resultStatus = 'warning';
                    } else {
                        resultStatus = 'clear';
                    }

                    statusReason = generateStatusReason(resultStatus, {
                        promotionAtRisk: promotionStatus === 'danger',
                        tenseValid: tenseStatus === 'clear',
                        hasHints: filteredHints.length > 0,
                        countFives,
                        countSixes,
                        reportType: newResults.reportType,
                        detectedTense: detectedTense,
                        allGrades: gradeMap
                    });
                }

                return { ...s, status, results: newResults, resultStatus, statusReason, errorMessage: undefined };
            });
            return { students };
        });

        // Initialize excluded subjects when first student completes
        if (status === 'completed') {
            get().initializeExcludedSubjects();
        }
    },

    checkConnection: async () => {
        set({ connectionStatus: 'checking' });
        const isConnected = await aiService.checkConnection();
        set({ connectionStatus: isConnected ? 'connected' : 'disconnected' });
    },

    loadWhitelist: async () => {
        const whitelist = await whitelistService.getWhitelist();
        set({ whitelist });
    },

    addToWhitelist: async (term) => {
        await whitelistService.addToWhitelist(term);
        const whitelist = await whitelistService.getWhitelist();
        set({ whitelist });
        get().students.forEach(s => get().reEvaluateStudentStatus(s.id));
    },

    reEvaluateStudentStatus: (id) => {
        const { students, whitelist } = get();
        const student = students.find(s => s.id === id);
        if (!student || !student.results) return;

        const filteredHints = (student.results.lrsHints || []).filter(hint =>
            !whitelist.some(w => hint.toLowerCase().includes(w.toLowerCase()))
        );

        const tenseStatus = validateTense(student.results.tense, student.results.reportType);

        const gradeMap: SubjectGrades = {};
        (student.results.subjects || []).forEach(subj => {
            gradeMap[subj.name] = subj.grade;
        });

        const countFives = (student.results.subjects || []).filter(sj => sj.grade === 5).length;
        const countSixes = (student.results.subjects || []).filter(sj => sj.grade === 6).length;
        const promotionStatus = checkPromotionStatus(gradeMap);

        let resultStatus: StudentProfile['resultStatus'] = 'clear';
        if (promotionStatus === 'danger') {
            resultStatus = 'danger';
        } else if (tenseStatus === 'warning' || filteredHints.length > 0) {
            resultStatus = 'warning';
        }

        const statusReason = generateStatusReason(resultStatus, {
            promotionAtRisk: promotionStatus === 'danger',
            tenseValid: tenseStatus === 'clear',
            hasHints: filteredHints.length > 0,
            countFives,
            countSixes,
            reportType: student.results.reportType,
            detectedTense: student.results.tense,
            allGrades: gradeMap
        });

        set((state) => ({
            students: state.students.map(s =>
                s.id === id ? { ...s, resultStatus, statusReason } : s
            )
        }));
    },

    updateStudentName: (id, name) => {
        set((state) => ({
            students: state.students.map(s => s.id === id ? { ...s, name } : s)
        }));
    },

    removeStudent: (id) => {
        set((state) => ({
            students: state.students.filter(s => s.id !== id),
            selectedStudentId: state.selectedStudentId === id ? null : state.selectedStudentId
        }));
    },

    clearAll: () => {
        set({ students: [], selectedStudentId: null, excludedFromAverage: [] });
    },

    startBatchAnalysis: async () => {
        const { students, isAnalyzing } = get();
        if (isAnalyzing) return;

        set({ isAnalyzing: true });

        for (const student of students) {
            if (student.status === 'completed') continue;

            set((state) => ({
                students: state.students.map(s =>
                    s.id === student.id ? { ...s, status: 'processing', errorMessage: undefined } : s
                )
            }));

            try {
                const results = await aiService.analyzeReport(student.rawText);

                // Validation pass: if AI says it's not a valid report or returns no subjects, mark as error
                if (results.isValidReport === false || (results.subjects.length === 0 && !results.aiStudentName)) {
                    get().updateStudentStatus(student.id, 'error', undefined,
                        'Profil konnte nicht als Zeugnis erkannt werden (möglicherweise Deckblatt oder fehlerhafter Split).');
                    continue;
                }

                const gradeMap: SubjectGrades = {};
                (results.subjects || []).forEach(s => {
                    gradeMap[s.name] = s.grade;
                });
                results.promotionAtRisk = checkPromotionStatus(gradeMap) === 'danger';

                if (results.aiStudentName && student.name.startsWith('Unbekannter Schüler')) {
                    get().updateStudentName(student.id, results.aiStudentName);
                }

                get().updateStudentStatus(student.id, 'completed', results);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error(`Error processing student ${student.name}:`, error);
                get().updateStudentStatus(student.id, 'error', undefined, msg);
            }
        }

        set({ isAnalyzing: false });
    },

    toggleSubjectInAverage: (subject) => {
        set((state) => {
            const isExcluded = state.excludedFromAverage.includes(subject);
            return {
                excludedFromAverage: isExcluded
                    ? state.excludedFromAverage.filter(s => s !== subject)
                    : [...state.excludedFromAverage, subject]
            };
        });
    },

    initializeExcludedSubjects: () => {
        const { students, excludedFromAverage } = get();
        // Collect all unique subjects across students; default-exclude non-promotion-relevant
        const allSubjects = new Set<string>();
        students.forEach(s => (s.results?.subjects || []).forEach(sub => allSubjects.add(sub.name)));

        const seen = new Set(excludedFromAverage);
        const newDefaults: string[] = [];
        allSubjects.forEach(subj => {
            if (!seen.has(subj) && !excludedFromAverage.includes(subj) && !isPromotionRelevant(subj)) {
                newDefaults.push(subj);
            }
        });

        if (newDefaults.length > 0) {
            set({ excludedFromAverage: [...excludedFromAverage, ...newDefaults] });
        }
    }
}));

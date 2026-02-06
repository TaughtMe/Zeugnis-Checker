import { create } from 'zustand';
import { StudentProfile, AnalysisResults } from '../types/student';
import { aiService } from '../services/aiService';
import { whitelistService } from '../services/whitelistService';
import { checkPromotionStatus, SubjectGrades, validateTense, generateStatusReason, tenseSanityCheck } from '../utils/msoLogic';

interface StudentState {
    students: StudentProfile[];
    selectedStudentId: string | null;
    isAnalyzing: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'checking';
    whitelist: string[];

    setStudents: (students: StudentProfile[]) => void;
    selectStudent: (id: string | null) => void;
    updateStudentStatus: (id: string, status: StudentProfile['status'], results?: AnalysisResults) => void;
    startBatchAnalysis: () => Promise<void>;
    updateStudentName: (id: string, name: string) => void;
    checkConnection: () => Promise<void>;

    loadWhitelist: () => Promise<void>;
    addToWhitelist: (term: string) => Promise<void>;
    reEvaluateStudentStatus: (id: string) => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
    students: [],
    selectedStudentId: null,
    isAnalyzing: false,
    connectionStatus: 'checking',
    whitelist: [],

    setStudents: (students) => set({ students }),
    selectStudent: (id) => set({ selectedStudentId: id }),

    updateStudentStatus: (id, status, results) => {
        set((state) => {
            const students = state.students.map((s) => {
                if (s.id !== id) return s;

                const newResults = results || s.results;
                let resultStatus: StudentProfile['resultStatus'] = null;
                let statusReason: string | undefined = undefined;

                if (newResults) {
                    const filteredHints = (newResults.lrsHints || []).filter(hint =>
                        !state.whitelist.some(w => hint.toLowerCase().includes(w.toLowerCase()))
                    );

                    let detectedTense = newResults.tense;
                    // Sanity Check: If AI says Präteritum but we find Present indicators, override or at least use for validation
                    if (detectedTense === 'Präteritum') {
                        const sanityTense = tenseSanityCheck(s.rawText);
                        if (sanityTense === 'Präsens') {
                            detectedTense = 'Präsens'; // Override for better accuracy as requested
                        }
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
                    } else if (tenseStatus === 'warning') {
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

                return { ...s, status, results: newResults, resultStatus, statusReason };
            });
            return { students };
        });
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

        // Re-evaluate all students
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
        } else if (tenseStatus === 'warning') {
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

    startBatchAnalysis: async () => {
        const { students, isAnalyzing } = get();
        if (isAnalyzing) return;

        set({ isAnalyzing: true });

        for (const student of students) {
            if (student.status === 'completed') continue;

            set((state) => ({
                students: state.students.map(s =>
                    s.id === student.id ? { ...s, status: 'processing' } : s
                )
            }));

            try {
                const results = await aiService.analyzeReport(student.rawText);

                // Calculate promotionAtRisk using msoLogic
                const gradeMap: SubjectGrades = {};
                (results.subjects || []).forEach(s => {
                    gradeMap[s.name] = s.grade;
                });
                results.promotionAtRisk = checkPromotionStatus(gradeMap) === 'danger';

                // Use AI-extracted name if current name is unknown/provisional
                if (results.aiStudentName && student.name.startsWith('Unbekannter Schüler')) {
                    get().updateStudentName(student.id, results.aiStudentName);
                }

                get().updateStudentStatus(student.id, 'completed', results);
            } catch (error) {
                console.error(`Error processing student ${student.name}:`, error);
                set((state) => ({
                    students: state.students.map(s =>
                        s.id === student.id ? { ...s, status: 'pending' } : s
                    )
                }));
            }
        }

        set({ isAnalyzing: false });
    }
}));

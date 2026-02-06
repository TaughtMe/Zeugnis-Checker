import { X } from "lucide-react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Impressum & Info</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Nutzungshinweise</h3>
                        <p className="text-slate-300 leading-relaxed">
                            Die App ist vorgesehen mit <span className="text-blue-400 font-medium">Lokalen KI Modellen von LM Studios</span> betrieben zu werden.
                        </p>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-amber-200 text-sm leading-relaxed">
                                <strong>Datenschutz-Hinweis:</strong> Cloud API Lösungen sind nicht Datenschutzkonform.
                                Der Nutzer ist dafür verantwortlich eine Datenschutzkonforme KI Lösung zum verarbeiten der Daten zu verwenden.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Version 1.0.0</span>
                            <span>&copy; Toby Bryson 2026</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        Verstanden
                    </button>
                </div>
            </div>
        </div>
    );
}

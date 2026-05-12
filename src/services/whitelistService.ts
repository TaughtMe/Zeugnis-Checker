/**
 * In-memory whitelist store.
 *
 * Hinweis: Aus Datenschutzgründen wird die Whitelist NICHT persistiert.
 * Beim Schließen des Tabs/Browsers geht der Zustand verloren — das ist
 * gewollt, damit nichts auf der Festplatte zurückbleibt.
 */

let memoryWhitelist: string[] = [];

export const whitelistService = {
    async getWhitelist(): Promise<string[]> {
        return [...memoryWhitelist];
    },

    async addToWhitelist(term: string): Promise<void> {
        if (!memoryWhitelist.includes(term)) {
            memoryWhitelist = [...memoryWhitelist, term];
        }
    },

    async removeFromWhitelist(term: string): Promise<void> {
        memoryWhitelist = memoryWhitelist.filter(t => t !== term);
    }
};

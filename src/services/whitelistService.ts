import { Store } from '@tauri-apps/plugin-store';

const STORE_PATH = 'settings.dat';
const WHITELIST_KEY = 'whitelist';

export const whitelistService = {
    async getWhitelist(): Promise<string[]> {
        const store = await Store.load(STORE_PATH);
        const list = await store.get<string[]>(WHITELIST_KEY);
        return list || [];
    },

    async addToWhitelist(term: string): Promise<void> {
        const store = await Store.load(STORE_PATH);
        const currentList = await this.getWhitelist();
        if (!currentList.includes(term)) {
            const newList = [...currentList, term];
            await store.set(WHITELIST_KEY, newList);
            await store.save();
        }
    },

    async removeFromWhitelist(term: string): Promise<void> {
        const store = await Store.load(STORE_PATH);
        const currentList = await this.getWhitelist();
        const newList = currentList.filter(t => t !== term);
        await store.set(WHITELIST_KEY, newList);
        await store.save();
    }
};

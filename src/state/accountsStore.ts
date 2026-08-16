import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { notificationService } from '@/services/notifications/notificationService';
import { notificationTemplates } from '@/services/notifications/notificationTemplates';
import type { Account, NewAccount } from '@/validation/accountSchema';

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  load: () => Promise<void>;
  addAccount: (input: NewAccount) => Promise<Account>;
  updateAccount: (id: string, patch: Omit<NewAccount, 'balance'>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,

  async load() {
    set({ loading: true });
    const { accounts } = await getRepositories();
    const list = await accounts.list();
    set({ accounts: list, loading: false });
  },

  async addAccount(input) {
    const { accounts } = await getRepositories();
    const created = await accounts.create(input);
    set({ accounts: [...get().accounts, created] });
    void notificationService.sendImmediate(notificationTemplates.accountAdded(created.name));
    return created;
  },

  async updateAccount(id, patch) {
    const { accounts } = await getRepositories();
    await accounts.update(id, patch);
    set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  },

  async removeAccount(id) {
    const { accounts } = await getRepositories();
    await accounts.remove(id);
    set({ accounts: get().accounts.filter((a) => a.id !== id) });
  },
}));

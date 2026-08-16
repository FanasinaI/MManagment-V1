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
}));

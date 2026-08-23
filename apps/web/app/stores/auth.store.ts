import { create } from 'zustand';
import type { AuthState, Permission, User } from '@/lib/schemas';
import { hasPermission as evaluatePermission } from '@/lib/permissions';

interface AuthActions {
  setAuth: (data: { accessToken: string; user: User }) => void;
  logout: () => void;
  hasPermission: (
    resource: string,
    action: Permission['action'],
    scope?: string,
  ) => boolean;
  /** Checks whether the active tenant has the given module enabled. */
  hasModule: (moduleCode: string) => boolean;
  /** Marks session initialization as complete (regardless of outcome). */
  setInitialized: () => void;
}

interface AuthStoreState extends AuthState {
  /** True until the first session restore attempt completes. */
  isInitializing: boolean;
}

const initialState: AuthStoreState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
};

export const useAuthStore = create<AuthStoreState & AuthActions>()(
  (set, get) => ({
    ...initialState,

    setAuth: ({ accessToken, user }) => {
      set({
        accessToken,
        user,
        isAuthenticated: true,
        isInitializing: false,
      });
    },

    logout: () => {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    },

    setInitialized: () => {
      set({ isInitializing: false });
    },

    hasPermission: (resource, action, scope) => {
      const user = get().user;
      if (!user) return false;
      if (user.isSystemAdmin) return true;
      return evaluatePermission(user.permissions ?? [], resource, action, scope);
    },

    hasModule: (moduleCode) => {
      const user = get().user;
      if (!user) return false;
      if (user.isSystemAdmin) return true;
      const modules = user.activeTenant?.modules ?? [];
      return modules.includes(moduleCode);
    },
  }),
);

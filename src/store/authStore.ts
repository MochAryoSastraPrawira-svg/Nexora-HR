import { create } from "zustand";
import { AuthUser } from "../types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from localStorage
  const savedUser = localStorage.getItem("hrms_user");
  let parsedUser: AuthUser | null = null;
  if (savedUser) {
    try {
      parsedUser = JSON.parse(savedUser);
    } catch (e) {
      localStorage.removeItem("hrms_user");
    }
  }

  return {
    user: parsedUser,
    isAuthenticated: !!parsedUser,
    isLoading: false,
    error: null,
    
    login: (user) => {
      localStorage.setItem("hrms_user", JSON.stringify(user));
      set({ user, isAuthenticated: true, error: null });
    },
    
    logout: () => {
      localStorage.removeItem("hrms_user");
      set({ user: null, isAuthenticated: false, error: null });
    },
    
    updateUser: (updatedFields) => {
      set((state) => {
        if (!state.user) return state;
        const newUser = { ...state.user, ...updatedFields };
        localStorage.setItem("hrms_user", JSON.stringify(newUser));
        return { user: newUser };
      });
    },
    
    setError: (error) => set({ error }),
    setLoading: (isLoading) => set({ isLoading }),
  };
});

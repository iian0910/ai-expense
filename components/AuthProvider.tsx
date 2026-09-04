"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  avatarUrl: string | null;
}

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return user;
}

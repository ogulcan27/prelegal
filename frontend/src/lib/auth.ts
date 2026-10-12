import { api } from "./api";

export type User = { id: number; email: string };
export type Credentials = { email: string; password: string };

export const MIN_PASSWORD_LENGTH = 8;

export const signIn = (credentials: Credentials) => api<User>("/api/auth/signin", credentials);
export const signUp = (credentials: Credentials) => api<User>("/api/auth/signup", credentials);
export const signOut = () => api<void>("/api/auth/signout", {});
export const getMe = () => api<User>("/api/auth/me");

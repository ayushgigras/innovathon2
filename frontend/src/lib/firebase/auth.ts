import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Sign in existing user with email and password
 */
export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign up a new user with email and password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
}

/**
 * Sign in anonymously (for citizens submitting reports)
 */
export async function loginAnonymously(): Promise<UserCredential> {
  return await signInAnonymously(auth);
}

/**
 * Sign out current authenticated user
 */
export async function logoutUser(): Promise<void> {
  return await signOut(auth);
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user synchronously
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

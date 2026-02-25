/**
 * useAuth.js — Custom hook for authentication
 * Wraps the AuthContext for convenient usage in components.
 */
import { useAuth as useAuthContext } from "../context/AuthContext";

export function useAuth() {
  return useAuthContext();
}

/**
 * ToastContext
 * ------------
 * Lightweight notification system.
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Transfer successful!', 'success');
 *   showToast('Something went wrong', 'error');
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map()); // Track timeouts for cleanup

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Clear any existing timeout for this id
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
    }

    // Set new timeout and store reference for cleanup
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutsRef.current.delete(id);
    }, duration);

    timeoutsRef.current.set(id, timeoutId);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    // Clear timeout if it exists
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

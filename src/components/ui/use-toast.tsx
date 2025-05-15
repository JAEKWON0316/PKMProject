"use client";

// Adapted from https://ui.shadcn.com/docs/components/toast
import * as React from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
};

const TOAST_TIMEOUT = 3000; // 3초 후 자동 닫힘

type ToastActionType = {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastActionType>({
  toast: () => {},
  dismiss: () => {},
});

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export interface Toast extends ToastProps {
  id: string;
  createdAt: number;
}

export function toast(props: ToastProps) {
  const { toast } = useToast();
  toast(props);
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      createdAt: Date.now(),
      ...props,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);

    // 자동으로 닫히는 타이머 설정
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter(t => t.id !== id));
    }, TOAST_TIMEOUT);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`p-4 rounded shadow-md bg-white dark:bg-gray-800 border ${
            toast.variant === "destructive" ? "border-red-500" : 
            toast.variant === "success" ? "border-green-500" : "border-gray-200 dark:border-gray-700"
          } max-w-md animate-in slide-in-from-bottom-5 duration-300`}
        >
          <div className="flex justify-between items-start">
            <div>
              {toast.title && (
                <h3 className={`font-semibold ${
                  toast.variant === "destructive" ? "text-red-500" :
                  toast.variant === "success" ? "text-green-500" : ""
                }`}>
                  {toast.title}
                </h3>
              )}
              {toast.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 
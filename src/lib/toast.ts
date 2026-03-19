import { toast as sonnerToast } from "sonner";

/**
 * Global toast wrapper to enforce a standard design system
 * across the entire SaaS application.
 */
export const toast = {
  success: (msg: string, description?: string) => {
    sonnerToast.success(msg, { description });
  },
  error: (msg: string, description?: string) => {
    sonnerToast.error(msg, { description });
  },
  info: (msg: string, description?: string) => {
    sonnerToast.info(msg, { description });
  },
  warning: (msg: string, description?: string) => {
    sonnerToast.warning(msg, { description });
  },
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    msgs: { loading: string; success: string | ((data: T) => string); error: string | ((error: any) => string) }
  ) => {
    sonnerToast.promise(promise, msgs);
  },
};

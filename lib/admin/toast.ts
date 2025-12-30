import toast from "react-hot-toast";

export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },

  error: (message: string) => {
    toast.error(message);
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Helper function for async operations with toast
export async function withToast<T>(
  operation: () => Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<T> {
  const toastId = toast.loading(messages.loading);

  try {
    const result = await operation();
    toast.success(messages.success, { id: toastId });
    return result;
  } catch (error) {
    const errorMessage = messages.error || "エラーが発生しました";
    toast.error(errorMessage, { id: toastId });
    throw error;
  }
}

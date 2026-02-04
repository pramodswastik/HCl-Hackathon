import { Toaster, toast } from 'react-hot-toast';
import clsx from 'clsx';

// Custom toast configurations
const toastConfig = {
  duration: 4000,
  position: 'top-right',
};

// Custom styled toasts
export const showToast = {
  success: (message, options = {}) =>
    toast.success(message, {
      ...toastConfig,
      ...options,
      className: 'toast-success',
      iconTheme: {
        primary: '#22c55e',
        secondary: '#fff',
      },
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      ...toastConfig,
      ...options,
      className: 'toast-error',
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    }),

  warning: (message, options = {}) =>
    toast(message, {
      ...toastConfig,
      ...options,
      icon: '⚠️',
      className: 'toast-warning',
    }),

  info: (message, options = {}) =>
    toast(message, {
      ...toastConfig,
      ...options,
      icon: 'ℹ️',
      className: 'toast-info',
    }),

  loading: (message, options = {}) =>
    toast.loading(message, {
      ...toastConfig,
      ...options,
    }),

  promise: (promise, messages, options = {}) =>
    toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        ...toastConfig,
        ...options,
      }
    ),

  dismiss: (toastId) => toast.dismiss(toastId),
  
  dismissAll: () => toast.dismiss(),

  custom: (content, options = {}) =>
    toast.custom(content, {
      ...toastConfig,
      ...options,
    }),
};

// Toast Provider Component
const ToastProvider = ({ position = 'top-right', children }) => {
  return (
    <>
      {children}
      <Toaster
        position={position}
        gutter={12}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            maxWidth: '400px',
          },
          // Custom styles for different types
          success: {
            style: {
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              border: '1px solid #fecaca',
            },
            duration: 5000,
          },
        }}
      />
    </>
  );
};

// Action Toast with buttons
export const ActionToast = ({
  t,
  message,
  actionLabel = 'Undo',
  onAction,
  onDismiss,
}) => (
  <div
    className={clsx(
      'flex items-center gap-4 px-4 py-3 bg-white rounded-lg shadow-lg border border-gray-200',
      t.visible ? 'animate-enter' : 'animate-leave'
    )}
  >
    <p className="text-sm text-gray-700 flex-1">{message}</p>
    <div className="flex gap-2">
      {onAction && (
        <button
          onClick={() => {
            onAction();
            toast.dismiss(t.id);
          }}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          {actionLabel}
        </button>
      )}
      <button
        onClick={() => {
          onDismiss?.();
          toast.dismiss(t.id);
        }}
        className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        Dismiss
      </button>
    </div>
  </div>
);

export default ToastProvider;

import { addToast, type ToastProps } from '@heroui/react';

type ToastOptions = Partial<ToastProps>;

const config: Record<
  'success' | 'error' | 'info' | 'warning',
  {
    color: ToastOptions['color'];
    defaultTitle: string;
    defaultDescription: string;
  }
> = {
  success: {
    color: 'success',
    defaultTitle: 'Success',
    defaultDescription: 'Operation completed successfully.',
  },
  error: {
    color: 'danger',
    defaultTitle: 'Error',
    defaultDescription: 'Something went wrong.',
  },
  info: {
    color: 'primary',
    defaultTitle: 'Info',
    defaultDescription: 'Here is some information.',
  },
  warning: {
    color: 'warning',
    defaultTitle: 'Warning',
    defaultDescription: 'Please be careful.',
  },
};

const showToast = (type: 'success' | 'error' | 'info' | 'warning', options: ToastOptions = {}) => {
  const selectedConfig = config[type];
  addToast({
    title: options.title || selectedConfig.defaultTitle,
    description: options.description || selectedConfig.defaultDescription,
    color: selectedConfig.color,
    variant: options.variant || 'flat',
    ...options,
  });
};

const toast = {
  success: (options: ToastOptions) => showToast('success', options),
  error: (options: unknown) => {
    // If error is an object with data.message, extract it
    if (
      typeof options === 'object' &&
      options !== null &&
      'data' in options &&
      typeof (options as { data?: unknown }).data === 'object' &&
      (options as { data?: unknown }).data !== null
    ) {
      const data = (options as { data?: { message?: unknown } }).data;
      if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message?: string }).message;
        showToast('error', {
          description: message,
        });
        return;
      }
    }
    if (typeof options === 'object' && options !== null) {
      showToast('error', options as ToastOptions);
    } else {
      showToast('error', {});
    }
  },
  info: (options: ToastOptions) => showToast('info', options),
  warning: (options: ToastOptions) => showToast('warning', options),
};

export { toast };

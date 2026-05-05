import { useCallback, useRef } from 'react';

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

/**
 * Thin wrapper around Razorpay Standard Checkout.
 *
 * Follows the current (2026) Razorpay docs:
 *   https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/
 *
 * Options passed to new window.Razorpay(options):
 *   key, amount, currency, name, order_id             (required)
 *   description, image, prefill, notes, theme         (strongly recommended)
 *   handler, modal.ondismiss, modal.confirm_close     (safety)
 *   timeout                                           (auto-close after inactivity)
 *
 * The caller passes `handler` (called on successful payment) and `onDismiss`
 * (called when the customer closes the modal without paying) so the checkout
 * page can show appropriate UI.
 */
export default function useRazorpay() {
  const loadedRef = useRef(false);

  const initiatePayment = useCallback(async ({
    amount,
    order_id,
    handler,
    onDismiss,
    prefill = {},
    notes = {},
    description,
    name,
  }) => {
    if (!loadedRef.current) {
      await loadScript(CHECKOUT_SRC);
      loadedRef.current = true;
    }
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK failed to load');
    }

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      throw new Error('Razorpay key missing (VITE_RAZORPAY_KEY_ID)');
    }

    const options = {
      key,
      amount,
      currency: 'INR',
      order_id,
      name: name || 'ZXCOM',
      description: description || 'Order Payment',
      image: 'https://zxcom.in/logo.png',
      handler,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      notes,
      theme: { color: '#e94560' },
      modal: {
        ondismiss: () => {
          if (typeof onDismiss === 'function') onDismiss();
        },
        confirm_close: true,
        escape: true,
        animation: true,
      },
      // Auto-close the modal after 10 minutes of inactivity — matches
      // Razorpay's own default session window.
      timeout: 600,
      retry: { enabled: true, max_count: 2 },
    };

    const razorpay = new window.Razorpay(options);

    // Surface payment.failed events so the UI can toast the right message.
    razorpay.on('payment.failed', (resp) => {
      // eslint-disable-next-line no-console
      console.warn('[razorpay] payment.failed', resp?.error);
    });

    razorpay.open();
    return razorpay;
  }, []);

  return { initiatePayment };
}

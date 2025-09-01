// Utility to create Cashfree payment session via backend
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Force localhost backend when frontend is running locally
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  // Prefer configured env URL; otherwise use current origin
  return envUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
};

export async function createCashfreeSession({ orderId, orderAmount, customerName, customerEmail, customerPhone, returnUrl }) {
  const API_URL = getApiBase();
  try { console.info('[Payment] Using API base:', API_URL); } catch (_) {}
  const res = await fetch(`${API_URL}/api/payment/create-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, orderAmount, customerName, customerEmail, customerPhone, returnUrl })
  });
  let data;
  try {
    data = await res.json();
  } catch (_) {
    // ignore parse error
  }
  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || `Failed to create payment session (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data;
}

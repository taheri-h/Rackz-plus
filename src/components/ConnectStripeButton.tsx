import React, { useState } from 'react';
import { API_URL } from '../utils/api';

type ConnectStripeButtonProps = {
  onConnected?: () => void;
};

const ConnectStripeButton: React.FC<ConnectStripeButtonProps> = ({
  onConnected,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/stripe/connect-url`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.url) {
        console.error('Backend did not return Stripe URL:', data);
        setLoading(false);
        return;
      }

      // Mark as connected locally (so button is disabled after returning)
      if (onConnected) {
        onConnected();
      }

      // Redirect user to Stripe OAuth onboarding
      window.location.href = data.url;
    } catch (err) {
      console.error('Error fetching Stripe Connect URL', err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${
        loading
          ? 'bg-slate-400 cursor-not-allowed text-white'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {loading ? 'Redirecting...' : 'Connect'}
    </button>
  );
};

export default ConnectStripeButton;



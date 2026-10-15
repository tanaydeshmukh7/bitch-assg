import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError, supabase } from '../lib/supabase';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { resendConfirmation, isSupabaseConfigured } = useAuth();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Checking your confirmation link...');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let active = true;

    const completeConfirmation = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (active) {
          setStatus('error');
          setMessage('Supabase authentication is not configured.');
        }
        return;
      }

      const errorDescription = searchParams.get('error_description');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashError = hashParams.get('error_description') || hashParams.get('error');
      if (errorDescription || hashError) {
        if (active) {
          setStatus('error');
          setMessage('This confirmation link is invalid, expired, or was already used. Request a new email below.');
        }
        return;
      }

      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const tokenType = searchParams.get('type');
        const hasHashAuthResponse =
          window.location.hash.includes('access_token=') ||
          window.location.hash.includes('error=');
        if (!code && !tokenHash && !hasHashAuthResponse) {
          throw new Error('No confirmation response was provided.');
        }

        if (tokenHash) {
          if (tokenType !== 'email' && tokenType !== 'signup') {
            throw new Error('Unsupported confirmation token type.');
          }

          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: tokenType,
          });
          if (error) throw error;
        } else if (code) {
          const processedCodeKey = `assignment-studio-auth-code:${code}`;
          const alreadyProcessed = sessionStorage.getItem(processedCodeKey) === '1';

          if (!alreadyProcessed) {
            sessionStorage.setItem(processedCodeKey, '1');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              const { data: { session: existingSession } } = await supabase.auth.getSession();
              if (!existingSession?.user?.email_confirmed_at) throw error;
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !session.user.email_confirmed_at) {
          throw new Error('The confirmation link did not create a confirmed session.');
        }

        if (active) {
          setStatus('success');
          setMessage('Your email is confirmed. You can now sign in to Assignment Studio.');
        }
      } catch (error) {
        if (active) {
          setStatus('error');
          setMessage('This confirmation link is invalid, expired, or was already used. Request a new email below.');
        }
      }
    };

    void completeConfirmation();
    return () => {
      active = false;
    };
  }, [isSupabaseConfigured, searchParams]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    setResending(true);
    setResent(false);
    try {
      await resendConfirmation(email.trim());
      setResent(true);
      setResendCooldown(30);
    } catch (error) {
      setMessage(formatAuthError(error, 'resend'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        {status === 'success' ? (
          <CheckCircle className="h-10 w-10 text-emerald-600 mb-4" />
        ) : status === 'error' ? (
          <AlertCircle className="h-10 w-10 text-rose-600 mb-4" />
        ) : (
          <Mail className="h-10 w-10 text-blue-600 mb-4" />
        )}
        <h1 className="text-xl font-bold text-slate-900">
          {status === 'success' ? 'Email confirmed successfully' : status === 'error' ? 'Confirmation failed' : 'Confirming email'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        {status === 'success' ? (
          <Link to="/auth" className="mt-6 inline-flex w-full justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            Continue to sign in
          </Link>
        ) : status === 'error' ? (
          <form onSubmit={handleResend} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@university.edu"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={resending || resendCooldown > 0}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send another confirmation email'}
            </button>
            {resent && <p className="text-sm text-emerald-700">If permitted, a new confirmation email has been sent. Check your inbox and spam folder.</p>}
            <Link to="/auth" className="block text-center text-sm font-semibold text-blue-600">Back to sign in</Link>
          </form>
        ) : null}
      </div>
    </div>
  );
};

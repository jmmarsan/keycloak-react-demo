import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  KeyRound, 
  X, 
  Check, 
  Clock, 
  Smartphone,
  Info
} from 'lucide-react';

export const InteractiveChallengeModal = ({
  isOpen,
  type,
  onClose,
  onSuccess,
  title,
  description,
}) => {
  const [totpCode, setTotpCode] = useState('842915');
  const [isVerifying, setIsVerifying] = useState(false);
  const [webAuthnState, setWebAuthnState] = useState('idle');
  const [sfaUsername, setSfaUsername] = useState('alex.sfa');
  const [sfaPassword, setSfaPassword] = useState('password123');

  // Timer for TOTP simulation
  const [secondsLeft, setSecondsLeft] = useState(24);

  useEffect(() => {
    if (!isOpen) {
      setWebAuthnState('idle');
      setIsVerifying(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 600);
  };

  const handleSimulatePasskey = () => {
    setWebAuthnState('scanning');
    setTimeout(() => {
      setWebAuthnState('verified');
      setTimeout(() => {
        onSuccess();
      }, 500);
    }, 1000);
  };

  const handleVerifySfa = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            {type === 'webauthn' ? (
              <Fingerprint className="w-6 h-6" />
            ) : type === 'otp' ? (
              <Smartphone className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {title || (type === 'webauthn' ? 'WebAuthn / Passkey PFA' : type === 'otp' ? 'TOTP Authenticator Step-Up' : 'SFA Login Challenge')}
            </h3>
            <p className="text-xs text-slate-400">
              {description || (type === 'webauthn' ? 'Phishing-resistant biometric security verification' : type === 'otp' ? 'Multi-factor Level of Assurance 2 verification' : 'Single-factor username and password verification')}
            </p>
          </div>
        </div>

        {/* Content according to type */}
        {type === 'webauthn' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center py-8">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  webAuthnState === 'scanning'
                    ? 'bg-cyan-500/20 text-cyan-400 scale-105 animate-pulse'
                    : webAuthnState === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 scale-105'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {webAuthnState === 'verified' ? (
                  <Check className="w-10 h-10" />
                ) : (
                  <Fingerprint className="w-10 h-10" />
                )}
              </div>

              <div className="mt-4">
                <span className="font-semibold text-sm text-slate-200">
                  {webAuthnState === 'scanning'
                    ? 'Signing WebAuthn assertion...'
                    : webAuthnState === 'verified'
                    ? 'Passkey verified successfully!'
                    : 'FIDO2 / Passkey Security Key Ready'}
                </span>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Touch your security key or use biometric sensor (TouchID / Windows Hello) to authenticate.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-2 text-xs text-indigo-300">
              <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                Simulates Keycloak WebAuthn Passwordless Authenticator flow. Generates token claim <code className="text-indigo-200">amr: ["webauthn"]</code> with <code className="text-indigo-200">acr: "pfa"</code>.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSimulatePasskey}
              disabled={webAuthnState !== 'idle'}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {webAuthnState === 'scanning'
                ? 'Verifying Biometric Sensor...'
                : webAuthnState === 'verified'
                ? 'Authenticated!'
                : 'Simulate TouchID / Security Key Press'}
            </button>
          </div>
        )}

        {type === 'otp' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Enter 6-digit Authenticator Code</span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resets in {secondsLeft}s</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Test OTP Code for simulation:</span>
              <button
                type="button"
                onClick={() => setTotpCode('842915')}
                className="font-mono text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                842 915 (Click to paste)
              </button>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-2 text-xs text-indigo-300">
              <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
              <span>
                Demonstrates Keycloak Step-Up OTP authentication. Elevates session assurance to <code className="text-indigo-200">acr: "loa-2"</code> and <code className="text-indigo-200">amr: ["pwd", "otp"]</code>.
              </span>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isVerifying || totpCode.length < 6}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isVerifying ? 'Verifying with IdP...' : 'Verify TOTP & Complete PFA'}
            </button>
          </div>
        )}

        {type === 'sfa' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Username / Email
              </label>
              <input
                type="text"
                value={sfaUsername}
                onChange={(e) => setSfaUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Password (Single Factor)
              </label>
              <input
                type="password"
                value={sfaPassword}
                onChange={(e) => setSfaPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">SFA User:</span> alex.sfa / password123
              <br />
              Single credential verified: <code className="text-amber-300">amr: ["pwd"]</code>, <code className="text-amber-300">acr: "loa-1"</code>.
            </div>

            <button
              type="button"
              onClick={handleVerifySfa}
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isVerifying ? 'Authenticating...' : 'Sign In with SFA (Single Factor)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileCode, 
  RefreshCw, 
  Copy, 
  Check, 
  Clock, 
  ArrowUpRight, 
  Key, 
  User, 
  Layers 
} from 'lucide-react';

export const TokenInspectorScreen = ({
  session,
  onRefresh,
  onStepUp,
  onGoToConsole,
}) => {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTokenTab, setActiveTokenTab] = useState('access');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    if (!session) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <FileCode className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Authentication Session</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Please log in using SFA or PFA on the Testing Console to inspect ID and Access Tokens, claims, and assurance levels.
        </p>
        <button
          type="button"
          onClick={onGoToConsole}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
        >
          Go to Testing Console
        </button>
      </div>
    );
  }

  const isPfa = session.factorLevel === 'pfa';
  const decodedPayload =
    activeTokenTab === 'id'
      ? session.decodedIdToken?.payload
      : session.decodedAccessToken?.payload;

  const rawTokenString =
    activeTokenTab === 'id'
      ? session.tokens.id_token || 'No ID Token'
      : session.tokens.access_token;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Session Assurance Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-xl transition-all ${
          isPfa
            ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-2xl ${
                isPfa ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isPfa ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">
                  {isPfa
                    ? 'PFA: Protected Factor Authentication Session'
                    : 'SFA: Single-Factor Authentication Session'}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isPfa
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isPfa ? 'High Assurance (LoA 2 / PFA)' : 'Standard Assurance (LoA 1 / SFA)'}
                </span>
              </div>

              <p className="text-xs text-slate-300">{session.factorTypeDescription}</p>

              {/* Claims highlight */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-slate-400">AMR (Methods):</span>
                {session.amr && session.amr.length > 0 ? (
                  session.amr.map((method) => (
                    <span
                      key={method}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300"
                    >
                      {method}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">None</span>
                )}

                <span className="text-xs text-slate-400 ml-3">ACR (Assurance):</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300">
                  {session.acr || 'standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!isPfa && (
              <button
                type="button"
                onClick={onStepUp}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/20"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Elevate to PFA (Step-Up)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Token</span>
            </button>
          </div>
        </div>

        {/* Expiration Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Access Token Lifetime:{' '}
              <strong className="text-white font-mono">{timeLeftSeconds}s</strong> remaining
            </span>
          </div>

          <div className="w-full sm:w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeftSeconds < 60 ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (timeLeftSeconds / 300) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* User Identity Details & Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">User Subject (sub)</span>
            <span className="font-semibold text-white text-sm">{session.user.name}</span>
            <span className="font-mono text-slate-400 text-[11px] block">{session.user.email}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Roles</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {session.user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Identity Provider & Issuer</span>
            <span className="font-medium text-slate-200">
              Local Keycloak
            </span>
            <span className="font-mono text-slate-400 text-[11px] block truncate max-w-[200px]">
              {session.decodedAccessToken?.payload?.iss || 'http://localhost:8080'}
            </span>
          </div>
        </div>
      </div>

      {/* Token Tabs & Claims Viewer */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3 bg-slate-950/60">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTokenTab('access')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTokenTab === 'access'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Access Token (Decoded Claims)
            </button>
            <button
              type="button"
              onClick={() => setActiveTokenTab('id')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTokenTab === 'id'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ID Token (User Info)
            </button>
            <button
              type="button"
              onClick={() => setActiveTokenTab('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTokenTab === 'raw'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Encoded JWT
            </button>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(rawTokenString, 'token-raw')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            {copiedKey === 'token-raw' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTokenTab === 'raw' ? (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-400 font-sans text-xs">
                Compact JWS string consisting of <code className="text-red-400">header</code>.
                <code className="text-purple-400">payload</code>.
                <code className="text-cyan-400">signature</code>:
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 break-all text-slate-300 leading-relaxed font-mono">
                {rawTokenString}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
              {/* Claims Breakdown table */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Important Token Claims Explained
                </h4>

                <div className="space-y-2">
                  {decodedPayload &&
                    Object.entries(decodedPayload).map(([claimKey, claimVal]) => {
                      const isAssuranceClaim = claimKey === 'acr' || claimKey === 'amr';
                      return (
                        <div
                          key={claimKey}
                          className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            isAssuranceClaim
                              ? 'bg-indigo-950/20 border-indigo-500/30'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-semibold ${
                                isAssuranceClaim ? 'text-indigo-400' : 'text-slate-300'
                              }`}
                            >
                              {claimKey}
                            </span>
                            {isAssuranceClaim && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-sans">
                                Assurance Metric
                              </span>
                            )}
                          </div>
                          <div className="text-slate-300 break-all text-right sm:max-w-md">
                            {typeof claimVal === 'object' ? (
                              <pre className="text-left font-mono text-[11px] bg-slate-900 p-1.5 rounded">
                                {JSON.stringify(claimVal, null, 2)}
                              </pre>
                            ) : (
                              String(claimVal)
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* JSON preview */}
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Raw Payload JSON
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-[500px]">
                  {JSON.stringify(decodedPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

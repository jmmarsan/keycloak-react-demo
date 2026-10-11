import React, { useState, useEffect } from 'react';
import { Server, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { testKeycloakConnectivity } from '../services/oidc';

export const KeycloakHealthBanner = ({
  config,
  onOpenGuide,
}) => {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState({
    tested: false,
    reachable: false,
    error: undefined,
    issuer: undefined,
  });

  const runCheck = async () => {
    setChecking(true);
    const result = await testKeycloakConnectivity(config.baseUrl, config.realm);
    setStatus({
      tested: true,
      reachable: result.success,
      error: result.error,
      issuer: result.data ? result.data.issuer : undefined,
    });
    setChecking(false);
  };

  useEffect(() => {
    runCheck();
  }, [config.baseUrl, config.realm]);

  return (
    <div
      className={`rounded-xl border p-4 transition-all text-xs ${
        !status.tested
          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
          : status.reachable
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              status.reachable
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {checking ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
            ) : status.reachable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-white">
                Local Keycloak Endpoint:
              </span>
              <code className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-slate-300">
                {config.baseUrl}/realms/{config.realm}
              </code>
            </div>

            <p className="mt-0.5 text-slate-400">
              {checking ? (
                'Probing OpenID Connect discovery endpoint...'
              ) : status.reachable ? (
                <span className="text-emerald-400">
                  Keycloak is reachable! Ready for SFA and PFA login flows.
                </span>
              ) : (
                <span className="text-amber-400/90">
                  {status.error ||
                    'Keycloak not detected on port 8080. If not started yet, switch to IdP Simulator or check guide.'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 transition-colors"
          >
            <span>Setup Instructions</span>
          </button>
        </div>
      </div>
    </div>
  );
};

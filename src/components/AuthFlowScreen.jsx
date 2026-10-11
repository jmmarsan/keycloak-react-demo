import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Fingerprint, 
  Send, 
  Settings2, 
  Code2, 
  ExternalLink 
} from 'lucide-react';
import { generatePkce, buildAuthorizeUrl, directGrantLogin, parseJwt } from '../services/oidc.js';

export const AuthFlowScreen = ({
  config,
  onUpdateConfig,
  session,
  onSessionCreated,
  onLogAudit,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [directUsername, setDirectUsername] = useState('alex.sfa');
  const [directPassword, setDirectPassword] = useState('password123');
  const [directOtp, setDirectOtp] = useState('');
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [directError, setDirectError] = useState(null);

  // PKCE preview state
  const [pkcePreview, setPkcePreview] = useState({
    codeVerifier: '...',
    codeChallenge: '...',
    state: '...',
    nonce: '...',
  });

  const refreshPkcePreview = async () => {
    const pkce = await generatePkce();
    const state = Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15);
    setPkcePreview({
      codeVerifier: pkce.codeVerifier,
      codeChallenge: pkce.codeChallenge,
      state,
      nonce,
    });
  };

  useEffect(() => {
    refreshPkcePreview();
  }, []);

  // Handlers for Local Keycloak OIDC PKCE redirect / popup
  const launchLiveOidcFlow = async (options) => {
    const { codeVerifier, codeChallenge } = await generatePkce();
    const state = Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15);

    // Save PKCE verifier in sessionStorage to exchange upon callback
    sessionStorage.setItem('kc_pkce_verifier', codeVerifier);
    sessionStorage.setItem('kc_state', state);
    sessionStorage.setItem('kc_flow_label', options.flowLabel);

    const authUrl = buildAuthorizeUrl(config, {
      codeChallenge,
      state,
      nonce,
      acrValue: options.acrValue,
      prompt: options.prompt,
    });

    onLogAudit({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'AUTH_START',
      title: `Initiated ${options.flowLabel} (PKCE)`,
      detail: `Opening Keycloak authorization URL with acr_values="${options.acrValue || 'none'}"`,
      status: 'info',
      payload: { authUrl, codeChallenge, state },
    });

    const popupWidth = 600;
    const popupHeight = 700;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    const popup = window.open(
      authUrl,
      'keycloak_auth_popup',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      window.location.href = authUrl;
    }
  };

  // Direct Access Grants (ROPC) to local Keycloak
  const handleDirectGrant = async (e) => {
    e.preventDefault();
    setIsDirectLoading(true);
    setDirectError(null);

    try {
      const tokens = await directGrantLogin(config, directUsername, directPassword, directOtp || undefined);
      const decodedAccess = parseJwt(tokens.access_token);
      const decodedId = tokens.id_token ? parseJwt(tokens.id_token) : undefined;
      const acr = (decodedAccess?.payload?.acr) || (directOtp ? 'loa-2' : 'loa-1');
      const isPfa = String(acr).includes('2') || String(acr).includes('pfa') || Boolean(directOtp);

      const newSession = {
        isAuthenticated: true,
        factorLevel: isPfa ? 'pfa' : 'sfa',
        factorTypeDescription: isPfa
          ? 'Protected Factor (Direct Grant with OTP)'
          : 'Single-Factor (Direct Grant Username/Password)',
        user: {
          id: decodedAccess?.payload?.sub || 'user-id',
          username: decodedAccess?.payload?.preferred_username || directUsername,
          email: decodedAccess?.payload?.email || `${directUsername}@example.com`,
          name: decodedAccess?.payload?.name || directUsername,
          roles: decodedAccess?.payload?.realm_access?.roles || ['user'],
        },
        tokens,
        decodedAccessToken: decodedAccess,
        decodedIdToken: decodedId,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (tokens.expires_in || 300) * 1000,
        authMode: 'live',
        acr,
        amr: isPfa ? ['pwd', 'otp'] : ['pwd'],
      };

      setIsDirectLoading(false);
      onSessionCreated(newSession, 'Direct Grant ROPC');
      onLogAudit({
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TOKEN_EXCHANGED',
        title: `Local Direct Grant Success (${newSession.factorLevel.toUpperCase()})`,
        detail: `Tokens obtained directly from ${config.baseUrl} token endpoint`,
        status: 'success',
        payload: tokens,
      });
    } catch (err) {
      setIsDirectLoading(false);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDirectError(errorMsg);
      onLogAudit({
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        title: 'Direct Grant Failed',
        detail: errorMsg,
        status: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Configuration bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Target Keycloak:</span>
              <span className="font-mono text-cyan-300">
                {config.baseUrl}/realms/{config.realm}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Client:</span>
              <span className="font-mono text-slate-200">{config.clientId}</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Testing SFA (<code className="text-amber-400">{config.sfaAcrValue}</code>) and PFA (
              <code className="text-emerald-400">{config.pfaAcrValue}</code>)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors self-start md:self-center"
        >
          {showConfig ? 'Hide Config' : 'Edit Endpoints'}
        </button>
      </div>

      {/* Editable Config Drawer */}
      {showConfig && (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-indigo-500/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs animate-fade-in">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Keycloak Base URL</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => onUpdateConfig({ ...config, baseUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              placeholder="http://localhost:8080"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Realm Name</label>
            <input
              type="text"
              value={config.realm}
              onChange={(e) => onUpdateConfig({ ...config, realm: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              placeholder="sfa-pfa-demo"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Client ID</label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => onUpdateConfig({ ...config, clientId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              placeholder="react-app"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">SFA ACR Value</label>
            <input
              type="text"
              value={config.sfaAcrValue}
              onChange={(e) => onUpdateConfig({ ...config, sfaAcrValue: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              placeholder="loa-1"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">PFA ACR Value</label>
            <input
              type="text"
              value={config.pfaAcrValue}
              onChange={(e) => onUpdateConfig({ ...config, pfaAcrValue: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
              placeholder="loa-2"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Redirect URI</label>
            <input
              type="text"
              value={config.redirectUri}
              onChange={(e) => onUpdateConfig({ ...config, redirectUri: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
            />
          </div>
        </div>
      )}

      {/* Main Authentication Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: SFA (Single-Factor Authentication) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
                LoA 1 • SFA
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Single-Factor (SFA)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Standard primary factor login on Keycloak. User authenticates with Username and Password form.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Auth Flow:</span>
                <span className="font-medium text-slate-200">Username/Password</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected AMR:</span>
                <code className="text-amber-400 font-mono">["pwd"]</code>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected ACR:</span>
                <code className="text-amber-400 font-mono">"{config.sfaAcrValue}"</code>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() =>
                launchLiveOidcFlow({
                  acrValue: config.sfaAcrValue,
                  flowLabel: 'SFA Standard Login',
                })
              }
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-600/20"
            >
              <span>Launch SFA Login (PKCE)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 2: PFA (Passwordless / WebAuthn) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Fingerprint className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                PFA • Passwordless
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              PFA: Passkey / WebAuthn
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Phishing-resistant factor authentication. FIDO2 / TouchID / Security Key without passwords.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Auth Flow:</span>
                <span className="font-medium text-slate-200">WebAuthn Passwordless</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected AMR:</span>
                <code className="text-cyan-400 font-mono">["webauthn"]</code>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected ACR:</span>
                <code className="text-cyan-400 font-mono">"pfa"</code>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() =>
                launchLiveOidcFlow({
                  acrValue: 'pfa',
                  flowLabel: 'PFA Passwordless WebAuthn',
                })
              }
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-600/20"
            >
              <span>Launch WebAuthn Flow (PKCE)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 3: PFA (Step-Up / MFA) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                LoA 2 • Step-Up MFA
              </span>
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              PFA: Step-Up MFA (TOTP)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Protected Multi-Factor. Demands Level of Assurance 2 by verifying Password + Authenticator OTP.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Auth Flow:</span>
                <span className="font-medium text-slate-200">Password + TOTP</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected AMR:</span>
                <code className="text-emerald-400 font-mono">["pwd", "otp"]</code>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected ACR:</span>
                <code className="text-emerald-400 font-mono">"{config.pfaAcrValue}"</code>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() =>
                launchLiveOidcFlow({
                  acrValue: config.pfaAcrValue,
                  flowLabel: 'PFA Step-Up MFA (LoA 2)',
                })
              }
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <span>Launch Step-Up Flow (PKCE)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Direct Access Grant (ROPC) Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <span>Direct Access Grants Tester (ROPC /token)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Call Keycloak's token endpoint directly with credentials and optional OTP. Ideal for automated testing or headless clients.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
            POST {config.baseUrl}/realms/{config.realm}/protocol/openid-connect/token
          </span>
        </div>

        <form onSubmit={handleDirectGrant} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Username</label>
            <input
              type="text"
              value={directUsername}
              onChange={(e) => setDirectUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={directPassword}
              onChange={(e) => setDirectPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              TOTP Code <span className="text-slate-500">(Optional for PFA)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 123456"
              value={directOtp}
              onChange={(e) => setDirectOtp(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isDirectLoading}
              className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isDirectLoading ? 'Authenticating with Keycloak...' : 'Send Direct Token Request'}
            </button>
          </div>
        </form>

        {directError && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            {directError}
          </div>
        )}
      </div>

      {/* PKCE Live Inspector */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>PKCE Parameters &amp; Authorize Request Preview</span>
          </div>
          <button
            type="button"
            onClick={refreshPkcePreview}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Regenerate Cryptographic Nonces
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-sans text-[11px] block">
              code_verifier (High-Entropy Secret):
            </span>
            <div className="text-slate-300 break-all">{pkcePreview.codeVerifier}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-sans text-[11px] block">
              code_challenge (SHA-256 Base64URL):
            </span>
            <div className="text-cyan-400 break-all">{pkcePreview.codeChallenge}</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 block mb-1 text-[11px]">
            Live Constructed Keycloak Auth URL (with <code className="text-emerald-400">acr_values</code>):
          </span>
          <pre className="font-mono text-[11px] text-slate-300 break-all whitespace-pre-wrap bg-slate-950 p-2 rounded border border-slate-800">
            {buildAuthorizeUrl(config, {
              codeChallenge: pkcePreview.codeChallenge,
              state: pkcePreview.state,
              nonce: pkcePreview.nonce,
              acrValue: config.pfaAcrValue,
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};

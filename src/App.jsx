import React, { useState, useEffect, useCallback } from 'react';
import { 
  exchangeCodeForTokens, 
  parseJwt, 
  refreshTokens, 
  buildLogoutUrl,
  executeKeycloakLogout,
  generatePkce,
  buildAuthorizeUrl 
} from './services/oidc.js';
import { Header } from './components/Header.jsx';
import { Navigation } from './components/Navigation.jsx';
import { AuthFlowScreen } from './components/AuthFlowScreen.jsx';
import { TokenInspectorScreen } from './components/TokenInspectorScreen.jsx';
import { ProtectedResourcesScreen } from './components/ProtectedResourcesScreen.jsx';
import { SetupGuideView } from './components/SetupGuideView.jsx';
import { AuditLogScreen } from './components/AuditLogScreen.jsx';
import { KeycloakHealthBanner } from './components/KeycloakHealthBanner.jsx';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function App() {
  // Configuration targeting local Keycloak
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('kc_app_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      baseUrl: 'http://localhost:8080',
      realm: 'sfa-pfa-demo',
      clientId: 'react-app',
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'openid',
      sfaAcrValue: 'loa-1',
      pfaAcrValue: 'loa-2',
    };
  });

  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('auth-flows');
  const [auditLogs, setAuditLogs] = useState(() => [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'PKCE_GEN',
      title: 'Local Keycloak Client Initialized',
      detail: 'Configured for PKCE S256 code exchange against local Keycloak at port 8080.',
      status: 'info',
    },
  ]);

  const addAuditLog = useCallback((item) => {
    setAuditLogs((prev) => [item, ...prev].slice(0, 100));
  }, []);

  const handleUpdateConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('kc_app_config', JSON.stringify(newConfig));
  };

  // Popup callback detection in child window
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // If Keycloak returned an error in popup:
    if (error && window.opener) {
      window.opener.postMessage(
        {
          type: 'KEYCLOAK_AUTH_ERROR',
          error,
          errorDescription,
        },
        '*'
      );
      window.close();
      return;
    }

    // If Keycloak returned an error in main window:
    if (error && !window.opener) {
      setAuthError({ error, errorDescription });
      addAuditLog({
        id: 'err-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        title: `Keycloak Error: ${error}`,
        detail: errorDescription || error,
        status: 'error',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // If this window is opened as a popup callback:
    if (code && window.opener) {
      window.opener.postMessage(
        {
          type: 'KEYCLOAK_AUTH_CODE',
          code,
          state,
        },
        '*'
      );
      window.close();
      return;
    }

    // Direct redirect in main window:
    if (code && !window.opener) {
      const codeVerifier = sessionStorage.getItem('kc_pkce_verifier');
      if (codeVerifier) {
        exchangeCodeForTokens(config, code, codeVerifier)
          .then((tokens) => {
            handleLiveTokensReceived(tokens, 'Direct Redirect PKCE');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            addAuditLog({
              id: 'err-' + Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              type: 'ERROR',
              title: 'Code Exchange Failed',
              detail: err.message,
              status: 'error',
            });
          });
      }
    }
  }, [config, addAuditLog]);

  // Listener in parent window for messages from Keycloak auth popup
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'KEYCLOAK_AUTH_ERROR') {
        const { error, errorDescription } = event.data;
        setAuthError({ error, errorDescription });
        addAuditLog({
          id: 'err-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'ERROR',
          title: `Keycloak Returned Error: ${error}`,
          detail: errorDescription || error,
          status: 'error',
        });
        return;
      }

      if (event.data?.type === 'KEYCLOAK_AUTH_CODE') {
        setAuthError(null);
        const { code, state } = event.data;
        const storedVerifier = sessionStorage.getItem('kc_pkce_verifier');
        const storedState = sessionStorage.getItem('kc_state');
        const flowLabel = sessionStorage.getItem('kc_flow_label') || 'OIDC Login';

        if (state && storedState && state !== storedState) {
          addAuditLog({
            id: 'err-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'ERROR',
            title: 'OAuth State Mismatch',
            detail: 'Potential CSRF detected. Stored state does not match callback.',
            status: 'error',
          });
          return;
        }

        if (!storedVerifier) {
          addAuditLog({
            id: 'err-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'ERROR',
            title: 'Missing PKCE Verifier',
            detail: 'Code verifier was not found in sessionStorage.',
            status: 'error',
          });
          return;
        }

        try {
          addAuditLog({
            id: 'code-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'AUTH_CODE_RECEIVED',
            title: 'Authorization Code Received',
            detail: `Code received from Keycloak popup. Initiating token exchange with code_verifier.`,
            status: 'info',
            payload: { code: code.substring(0, 16) + '...' },
          });

          const tokens = await exchangeCodeForTokens(config, code, storedVerifier);
          handleLiveTokensReceived(tokens, flowLabel);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          addAuditLog({
            id: 'err-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'ERROR',
            title: 'Token Exchange Failed',
            detail: msg,
            status: 'error',
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [config, addAuditLog]);

  // Process tokens returned from local Keycloak
  const handleLiveTokensReceived = (tokens, flowLabel) => {
    const decodedAccess = parseJwt(tokens.access_token);
    const decodedId = tokens.id_token ? parseJwt(tokens.id_token) : undefined;

    const payload = decodedAccess?.payload || {};
    const acr = payload.acr || '';
    const amr = payload.amr || [];

    // Evaluate factor level from token claims:
    const isPfa =
      acr === config.pfaAcrValue ||
      String(acr).includes('pfa') ||
      String(acr).includes('2') ||
      (Array.isArray(amr) && (amr.includes('otp') || amr.includes('webauthn')));

    const factorLevel = isPfa ? 'pfa' : 'sfa';
    const factorTypeDescription = isPfa
      ? 'Protected Factor (PFA / LoA 2 - Multi-Factor or WebAuthn)'
      : 'Single-Factor (SFA / LoA 1 - Username and Password)';

    const newSession = {
      isAuthenticated: true,
      factorLevel,
      factorTypeDescription,
      user: {
        id: payload.sub || 'user-id',
        username: payload.preferred_username || 'keycloak-user',
        email: payload.email || 'user@example.com',
        name: payload.name || payload.preferred_username || 'User',
        roles: payload.realm_access?.roles || ['user'],
      },
      tokens,
      decodedAccessToken: decodedAccess,
      decodedIdToken: decodedId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (tokens.expires_in || 300) * 1000,
      authMode: 'live',
      acr,
      amr,
    };

    setSession(newSession);
    setActiveTab('tokens');

    addAuditLog({
      id: 'success-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'TOKEN_EXCHANGED',
      title: `${flowLabel} Succeeded (${factorLevel.toUpperCase()})`,
      detail: `Authenticated via Keycloak. ACR: "${acr}", AMR: ${JSON.stringify(amr)}`,
      status: 'success',
      payload: {
        access_token_claims: payload,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
      },
    });
  };

  const handleSessionCreated = (newSession) => {
    setSession(newSession);
    setActiveTab('tokens');
  };

  const handleLogout = async () => {
    const tokensToRevoke = session?.tokens;

    // Immediately clear local session state and return to auth flows screen
    setSession(null);
    setActiveTab('auth-flows');
    sessionStorage.removeItem('kc_pkce_verifier');
    sessionStorage.removeItem('kc_state');
    sessionStorage.removeItem('kc_flow_label');

    addAuditLog({
      id: 'logout-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'LOGOUT',
      title: 'Session Terminated',
      detail: 'Local session cleared and Keycloak session revoked in the background.',
      status: 'info',
    });

    // Invalidate Keycloak session in the background via POST (no popup window)
    if (tokensToRevoke?.refresh_token || tokensToRevoke?.id_token) {
      await executeKeycloakLogout(
        config,
        tokensToRevoke.refresh_token,
        tokensToRevoke.id_token
      );
    }
  };

  const handleRefreshToken = async () => {
    if (!session || !session.tokens?.refresh_token) return;

    try {
      addAuditLog({
        id: 'ref-start-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TOKEN_REFRESH',
        title: 'Initiating Token Refresh',
        detail: `Calling ${config.baseUrl}/protocol/openid-connect/token with grant_type=refresh_token`,
        status: 'info',
      });

      const refreshed = await refreshTokens(config, session.tokens.refresh_token);
      const decodedAccess = parseJwt(refreshed.access_token);
      const decodedId = refreshed.id_token ? parseJwt(refreshed.id_token) : session.decodedIdToken;

      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tokens: refreshed,
          decodedAccessToken: decodedAccess || prev.decodedAccessToken,
          decodedIdToken: decodedId || prev.decodedIdToken,
          issuedAt: Date.now(),
          expiresAt: Date.now() + (refreshed.expires_in || 300) * 1000,
        };
      });

      addAuditLog({
        id: 'ref-ok-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TOKEN_REFRESH',
        title: 'Live Keycloak Token Refreshed',
        detail: 'Received fresh access token from Keycloak token endpoint.',
        status: 'success',
        payload: refreshed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addAuditLog({
        id: 'ref-err-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        title: 'Refresh Token Failed',
        detail: msg,
        status: 'error',
      });
    }
  };

  // Step-Up Elevation against local Keycloak
  const handleStepUpElevation = async () => {
    if (!session) return;

    try {
      const { codeVerifier, codeChallenge } = await generatePkce();
      const state = Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15);

      sessionStorage.setItem('kc_pkce_verifier', codeVerifier);
      sessionStorage.setItem('kc_state', state);
      sessionStorage.setItem('kc_flow_label', 'PFA Step-Up Re-Authentication');

      const authUrl = buildAuthorizeUrl(config, {
        codeChallenge,
        state,
        nonce,
        acrValue: config.pfaAcrValue,
        loginHint: session.user.username,
      });

      addAuditLog({
        id: 'stepup-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'STEP_UP_CHALLENGE',
        title: 'Triggering PFA Step-Up Challenge',
        detail: `Requesting elevated assurance acr_values="${config.pfaAcrValue}" for user ${session.user.username}`,
        status: 'warning',
        payload: { authUrl },
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addAuditLog({
        id: 'err-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'ERROR',
        title: 'Failed to initiate step-up',
        detail: msg,
        status: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        session={session}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        config={config}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        factorLevel={session ? session.factorLevel : 'none'}
        auditCount={auditLogs.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Auth Error Banner with Quick Fix */}
        {authError && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs shadow-lg animate-fade-in space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white text-sm">
                    Keycloak Error: {authError.error}
                  </div>
                  <p className="mt-1 text-red-300 font-mono text-[11px]">
                    {authError.errorDescription || 'The authorization request was rejected by Keycloak.'}
                  </p>
                  {authError.error === 'invalid_scope' && (
                    <p className="mt-2 text-slate-300 leading-relaxed">
                      <strong>Why this happens:</strong> In Keycloak, client <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">{config.clientId}</code> was created without assigning the requested scopes (<code className="text-amber-300 font-mono">profile</code>, <code className="text-amber-300 font-mono">email</code>). The standard OpenID Connect core scope is <code className="text-emerald-300 font-mono">openid</code>, which always works.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/40 transition-colors"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-500/20">
              {authError.error === 'invalid_scope' && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateConfig({ ...config, scope: 'openid' });
                    setAuthError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-sm"
                >
                  Switch Scope to 'openid' &amp; Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setActiveTab('guide');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors"
              >
                View Keycloak Client Scopes Guide
              </button>
            </div>
          </div>
        )}

        {/* Live Keycloak Health Status Bar */}
        <KeycloakHealthBanner
          config={config}
          onOpenGuide={() => setActiveTab('guide')}
        />

        {/* Tab 1: Auth Flows & Testing Console */}
        {activeTab === 'auth-flows' && (
          <AuthFlowScreen
            config={config}
            onUpdateConfig={handleUpdateConfig}
            session={session}
            onSessionCreated={handleSessionCreated}
            onLogAudit={addAuditLog}
          />
        )}

        {/* Tab 2: Token & Session Inspector */}
        {activeTab === 'tokens' && (
          <TokenInspectorScreen
            session={session}
            onRefresh={handleRefreshToken}
            onStepUp={handleStepUpElevation}
            onGoToConsole={() => setActiveTab('auth-flows')}
          />
        )}

        {/* Tab 3: Protected Resources & Access Control */}
        {activeTab === 'protected' && (
          <ProtectedResourcesScreen
            session={session}
            onStepUpToPfa={handleStepUpElevation}
            onGoToConsole={() => setActiveTab('auth-flows')}
            onLogAudit={addAuditLog}
          />
        )}

        {/* Tab 4: Local Keycloak Setup Guide */}
        {activeTab === 'guide' && <SetupGuideView />}

        {/* Tab 5: Protocol Audit Logs */}
        {activeTab === 'audit' && (
          <AuditLogScreen
            logs={auditLogs}
            onClearLogs={() => setAuditLogs([])}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Keycloak SFA &amp; PFA Authentication Studio • Direct Local OIDC with RFC 7636 PKCE</p>
      </footer>
    </div>
  );
}

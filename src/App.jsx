import React, { useState, useEffect, useCallback } from 'react';
import { 
  exchangeCodeForTokens, 
  parseJwt, 
  refreshTokens, 
  buildLogoutUrl 
} from './services/oidc.js';
import { 
  mockSfaLogin, 
  elevateSfaToPfa 
} from './services/mockKeycloak.js';
import { Header } from './components/Header.jsx';
import { Navigation } from './components/Navigation.jsx';
import { AuthFlowScreen } from './components/AuthFlowScreen.jsx';
import { TokenInspectorScreen } from './components/TokenInspectorScreen.jsx';
import { ProtectedResourcesScreen } from './components/ProtectedResourcesScreen.jsx';
import { SetupGuideView } from './components/SetupGuideView.jsx';
import { AuditLogScreen } from './components/AuditLogScreen.jsx';
import { KeycloakHealthBanner } from './components/KeycloakHealthBanner.jsx';
import { InteractiveChallengeModal } from './components/InteractiveChallengeModal.jsx';

export default function App() {
  // Default configuration targeting local Keycloak
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
      sfaAcrValue: 'loa-1',
      pfaAcrValue: 'loa-2',
    };
  });

  const [authMode, setAuthMode] = useState('simulator');
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('auth-flows');
  const [auditLogs, setAuditLogs] = useState(() => [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'PKCE_GEN',
      title: 'Keycloak SFA & PFA Studio Ready',
      detail: 'Crypto subsystem ready for RFC 7636 PKCE S256 code exchanges',
      status: 'info',
    },
  ]);

  // Modal challenge state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'sfa',
    onSuccess: () => {},
  });

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

  // Listener in parent window for messages from auth popup
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'KEYCLOAK_AUTH_CODE') {
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

  // Helper when tokens are received from live Keycloak
  const handleLiveTokensReceived = (tokens, flowLabel) => {
    const decodedAccess = parseJwt(tokens.access_token);
    const decodedId = tokens.id_token ? parseJwt(tokens.id_token) : undefined;

    const payload = decodedAccess?.payload || {};
    const acr = payload.acr || '';
    const amr = payload.amr || [];

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

  const handleSessionCreated = (newSession, flowTitle) => {
    setSession(newSession);
    setActiveTab('tokens');
  };

  const handleLogout = () => {
    if (session?.authMode === 'live' && session.tokens.id_token) {
      const logoutUrl = buildLogoutUrl(config, session.tokens.id_token);
      setSession(null);
      addAuditLog({
        id: 'logout-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'LOGOUT',
        title: 'Session Terminated',
        detail: 'User logged out. Redirecting to Keycloak logout endpoint.',
        status: 'info',
      });
      window.open(logoutUrl, '_blank', 'width=500,height=400');
    } else {
      setSession(null);
      addAuditLog({
        id: 'logout-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'LOGOUT',
        title: 'Session Terminated',
        detail: 'Active authentication session cleared from memory.',
        status: 'info',
      });
    }
  };

  const handleRefreshToken = async () => {
    if (!session || !session.tokens.refresh_token) return;

    try {
      addAuditLog({
        id: 'ref-start-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'TOKEN_REFRESH',
        title: 'Initiating Token Refresh',
        detail: 'Exchanging refresh_token at /token endpoint for renewed access token.',
        status: 'info',
      });

      if (session.authMode === 'simulator') {
        setTimeout(() => {
          setSession((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              issuedAt: Date.now(),
              expiresAt: Date.now() + 300 * 1000,
            };
          });
          addAuditLog({
            id: 'ref-ok-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'TOKEN_REFRESH',
            title: 'Token Successfully Refreshed',
            detail: 'Renewed session lifespan by +300 seconds.',
            status: 'success',
          });
        }, 400);
        return;
      }

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

  const handleStepUpElevation = () => {
    if (!session) return;

    if (session.authMode === 'live') {
      setActiveTab('auth-flows');
      addAuditLog({
        id: 'stepup-prompt-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'STEP_UP_CHALLENGE',
        title: 'Step-Up Authentication Required',
        detail: `Launching authorization request with acr_values="${config.pfaAcrValue}" to step up to PFA.`,
        status: 'warning',
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'otp',
      onSuccess: () => {
        const elevated = elevateSfaToPfa(session, 'otp');
        setSession(elevated);
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        setActiveTab('tokens');
        addAuditLog({
          id: 'stepup-' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'STEP_UP_COMPLETED',
          title: 'Session Successfully Stepped Up to PFA',
          detail: 'Second factor (TOTP) verified. Elevated token claims to acr="loa-2", amr=["pwd", "otp"]',
          status: 'success',
          payload: elevated.decodedAccessToken?.payload,
        });
      },
    });
  };

  const handleRequestInteractiveModal = (type, callback) => {
    setModalConfig({
      isOpen: true,
      type,
      onSuccess: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        callback();
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        authMode={authMode}
        onAuthModeChange={setAuthMode}
        session={session}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
        {/* Live Keycloak Health Status Bar (shown when in live mode) */}
        {authMode === 'live' && (
          <KeycloakHealthBanner
            config={config}
            onOpenGuide={() => setActiveTab('guide')}
          />
        )}

        {/* Tab 1: Auth Flows & Testing Console */}
        {activeTab === 'auth-flows' && (
          <AuthFlowScreen
            authMode={authMode}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            session={session}
            onSessionCreated={handleSessionCreated}
            onLogAudit={addAuditLog}
            onRequestInteractiveModal={handleRequestInteractiveModal}
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

      {/* Interactive Challenge Modal (for biometric WebAuthn & TOTP simulation) */}
      <InteractiveChallengeModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={modalConfig.onSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Keycloak SFA &amp; PFA Authentication Studio • OpenID Connect &amp; RFC 7636 PKCE Compliant</p>
      </footer>
    </div>
  );
}

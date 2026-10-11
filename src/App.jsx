import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
} from '@mui/material';
import { getAppTheme } from './theme.js';
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

export default function App() {
  // Theme mode: dark vs light
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('kc_theme_mode') || 'dark';
  });

  const theme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kc_theme_mode', next);
      return next;
    });
  };

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
      title: 'Material UI Keycloak Client Initialized',
      detail: 'MUI v6 Theme applied with Dark/Light toggle. Ready for PKCE S256 code exchanges.',
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
      const storedFlowLabel = sessionStorage.getItem('kc_flow_label') || 'Keycloak OIDC PKCE';
      const storedFactor = sessionStorage.getItem('kc_flow_factor');
      if (codeVerifier) {
        exchangeCodeForTokens(config, code, codeVerifier)
          .then((tokens) => {
            handleLiveTokensReceived(tokens, storedFlowLabel, storedFactor);
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
        const storedFactor = sessionStorage.getItem('kc_flow_factor');

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
          handleLiveTokensReceived(tokens, flowLabel, storedFactor);
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
  const handleLiveTokensReceived = (tokens, flowLabel, flowFactorHint) => {
    const decodedAccess = parseJwt(tokens.access_token);
    const decodedId = tokens.id_token ? parseJwt(tokens.id_token) : undefined;

    const accessPayload = decodedAccess?.payload || {};
    const idPayload = decodedId?.payload || {};

    // Standard OIDC defines acr and amr primarily in the ID Token, but check both
    const acr = idPayload.acr || accessPayload.acr || '';

    let rawAmr = idPayload.amr || accessPayload.amr || [];
    if (typeof rawAmr === 'string') {
      try {
        rawAmr = JSON.parse(rawAmr);
      } catch {
        rawAmr = [rawAmr];
      }
    }
    const amr = Array.isArray(rawAmr) ? rawAmr : (rawAmr ? [rawAmr] : []);

    const flowFactor =
      flowFactorHint ||
      sessionStorage.getItem('kc_flow_factor') ||
      (flowLabel && flowLabel.toLowerCase().includes('pfa') ? 'pfa' : null);

    const tokenIndicatesPfa =
      acr === config.pfaAcrValue ||
      String(acr).includes('pfa') ||
      String(acr).includes('2') ||
      amr.some((m) =>
        ['otp', 'totp', 'webauthn', 'fido', 'hwk', 'mfa', 'sms', 'passkey'].includes(
          String(m).toLowerCase()
        )
      ) ||
      (accessPayload.realm_access?.roles || []).some((r) =>
        ['pfa', 'pfa-user', 'mfa', 'step-up'].includes(String(r).toLowerCase())
      );

    // If either token claims OR the executed login flow indicated PFA, set factorLevel to 'pfa'
    const isPfa = flowFactor === 'pfa' || tokenIndicatesPfa;

    const factorLevel = isPfa ? 'pfa' : 'sfa';
    const factorTypeDescription = isPfa
      ? (tokenIndicatesPfa
          ? 'Protected Factor (PFA / LoA 2 - Verified by Token Claims)'
          : 'Protected Factor (PFA / LoA 2 - Satisfied via Keycloak PFA Flow & acr_values)')
      : 'Single-Factor (SFA / LoA 1 - Username and Password)';

    // Ensure display acr & amr reflect the active assurance level
    const displayAcr = acr || (isPfa ? (config.pfaAcrValue || 'loa-2') : (config.sfaAcrValue || 'loa-1'));
    const displayAmr = amr.length > 0 ? amr : (isPfa ? ['pwd', 'otp'] : ['pwd']);

    const newSession = {
      isAuthenticated: true,
      factorLevel,
      factorTypeDescription,
      user: {
        id: accessPayload.sub || idPayload.sub || 'user-id',
        username: accessPayload.preferred_username || idPayload.preferred_username || 'keycloak-user',
        email: accessPayload.email || idPayload.email || 'user@example.com',
        name: accessPayload.name || idPayload.name || accessPayload.preferred_username || 'User',
        roles: accessPayload.realm_access?.roles || ['user'],
      },
      tokens,
      decodedAccessToken: decodedAccess,
      decodedIdToken: decodedId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (tokens.expires_in || 300) * 1000,
      authMode: 'live',
      acr: displayAcr,
      amr: displayAmr,
    };

    setSession(newSession);
    setActiveTab('tokens');

    addAuditLog({
      id: 'success-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'TOKEN_EXCHANGED',
      title: `${flowLabel} Succeeded (${factorLevel.toUpperCase()})`,
      detail: `Authenticated via Keycloak. Assurance: ${factorLevel.toUpperCase()} (ACR: "${displayAcr}", AMR: ${JSON.stringify(displayAmr)})`,
      status: 'success',
      payload: {
        access_token_claims: accessPayload,
        id_token_claims: idPayload,
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
      sessionStorage.setItem('kc_flow_factor', 'pfa');
      sessionStorage.setItem('kc_requested_acr', config.pfaAcrValue);

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

  // Toggle or switch factorLevel for testing access policies
  const handleToggleSessionFactorLevel = (targetLevel) => {
    if (!session) return;
    const nextLevel = targetLevel || (session.factorLevel === 'pfa' ? 'sfa' : 'pfa');
    const isNowPfa = nextLevel === 'pfa';
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        factorLevel: nextLevel,
        factorTypeDescription: isNowPfa
          ? 'Protected Factor (PFA / LoA 2 - High Assurance Active)'
          : 'Single-Factor (SFA / LoA 1 - Username and Password Active)',
        acr: isNowPfa ? (config.pfaAcrValue || 'loa-2') : (config.sfaAcrValue || 'loa-1'),
        amr: isNowPfa ? ['pwd', 'otp'] : ['pwd'],
      };
    });

    addAuditLog({
      id: 'switch-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'FACTOR_LEVEL_CHANGED',
      title: `Assurance Level Switched to ${nextLevel.toUpperCase()}`,
      detail: `Session assurance level set to ${nextLevel.toUpperCase()} for access policy testing.`,
      status: isNowPfa ? 'success' : 'info',
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Top Material UI Header with Dark/Light Toggle */}
        <Header
          session={session}
          onLogout={handleLogout}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          config={config}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
        />

        {/* Navigation Tabs */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          factorLevel={session ? session.factorLevel : 'none'}
          auditCount={auditLogs.length}
        />

        {/* Main Content Container */}
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Keycloak Error Alert */}
          {authError && (
            <Alert
              severity="error"
              onClose={() => setAuthError(null)}
              sx={{ borderRadius: 3 }}
              action={
                authError.error === 'invalid_scope' ? (
                  <Button
                    color="inherit"
                    size="small"
                    variant="contained"
                    onClick={() => {
                      handleUpdateConfig({ ...config, scope: 'openid' });
                      setAuthError(null);
                    }}
                  >
                    Switch to 'openid'
                  </Button>
                ) : null
              }
            >
              <AlertTitle fontWeight={700}>Keycloak Error: {authError.error}</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                {authError.errorDescription || 'The authorization request was rejected by Keycloak.'}
              </Typography>
              {authError.error === 'invalid_scope' && (
                <Typography variant="caption" display="block">
                  Your Keycloak client <code>{config.clientId}</code> does not have <code>profile</code> or <code>email</code> client scopes assigned. Click "Switch to 'openid'" above to use the standard core OIDC scope.
                </Typography>
              )}
            </Alert>
          )}

          {/* Keycloak Health Banner */}
          <KeycloakHealthBanner
            config={config}
            onOpenGuide={() => setActiveTab('guide')}
          />

          {/* Tab Views */}
          {activeTab === 'auth-flows' && (
            <AuthFlowScreen
              config={config}
              onUpdateConfig={handleUpdateConfig}
              session={session}
              onSessionCreated={handleSessionCreated}
              onLogAudit={addAuditLog}
            />
          )}

          {activeTab === 'tokens' && (
            <TokenInspectorScreen
              session={session}
              onRefresh={handleRefreshToken}
              onStepUp={handleStepUpElevation}
              onToggleFactorLevel={handleToggleSessionFactorLevel}
              onGoToConsole={() => setActiveTab('auth-flows')}
            />
          )}

          {activeTab === 'protected' && (
            <ProtectedResourcesScreen
              session={session}
              onStepUpToPfa={handleStepUpElevation}
              onToggleFactorLevel={handleToggleSessionFactorLevel}
              onGoToConsole={() => setActiveTab('auth-flows')}
              onLogAudit={addAuditLog}
            />
          )}

          {activeTab === 'guide' && <SetupGuideView />}

          {activeTab === 'audit' && (
            <AuditLogScreen
              logs={auditLogs}
              onClearLogs={() => setAuditLogs([])}
            />
          )}
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Keycloak SFA &amp; PFA Authentication Studio • Built with Material UI • Local OIDC PKCE
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Paper,
  Chip,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import CodeIcon from '@mui/icons-material/Code';
import { generatePkce, buildAuthorizeUrl, directGrantLogin, parseJwt } from '../services/oidc.js';

export const AuthFlowScreen = ({
  config,
  onUpdateConfig,
  session,
  onSessionCreated,
  onLogAudit,
}) => {
  const theme = useTheme();
  const [showConfig, setShowConfig] = useState(false);
  const [directFactorLevel, setDirectFactorLevel] = useState('pfa');
  const [directUsername, setDirectUsername] = useState('morgan.pfa');
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

  // Switch Direct Grant target factor level and corresponding test user
  const handleSelectDirectFactorLevel = (level) => {
    setDirectFactorLevel(level);
    if (level === 'pfa') {
      setDirectUsername('morgan.pfa');
      setDirectPassword('password123');
    } else {
      setDirectUsername('alex.sfa');
      setDirectPassword('password123');
      setDirectOtp('');
    }
  };

  // Launch live OIDC PKCE flow
  const launchLiveOidcFlow = async (options) => {
    const { codeVerifier, codeChallenge } = await generatePkce();
    const state = Math.random().toString(36).substring(2, 15);
    const nonce = Math.random().toString(36).substring(2, 15);

    const factorLevel = options.factorLevel || (options.flowLabel?.toLowerCase().includes('pfa') ? 'pfa' : 'sfa');

    sessionStorage.setItem('kc_pkce_verifier', codeVerifier);
    sessionStorage.setItem('kc_state', state);
    sessionStorage.setItem('kc_flow_label', options.flowLabel);
    sessionStorage.setItem('kc_flow_factor', factorLevel);
    sessionStorage.setItem('kc_requested_acr', options.acrValue || '');

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
      detail: `Opening authorization URL with acr_values="${options.acrValue || 'none'}" [Expected: ${factorLevel.toUpperCase()}]`,
      status: 'info',
      payload: { authUrl, codeChallenge, state, factorLevel },
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

  // Direct Access Grants (ROPC)
  const handleDirectGrant = async (e) => {
    e.preventDefault();
    setIsDirectLoading(true);
    setDirectError(null);

    try {
      const tokens = await directGrantLogin(config, directUsername, directPassword, directOtp || undefined);
      const decodedAccess = parseJwt(tokens.access_token);
      const decodedId = tokens.id_token ? parseJwt(tokens.id_token) : undefined;
      
      const accessPayload = decodedAccess?.payload || {};
      const idPayload = decodedId?.payload || {};
      const tokenAcr = idPayload.acr || accessPayload.acr || '';

      const isPfa =
        directFactorLevel === 'pfa' ||
        directUsername.toLowerCase().includes('pfa') ||
        Boolean(directOtp) ||
        String(tokenAcr).includes('2') ||
        String(tokenAcr).includes('pfa');

      const factorLevel = isPfa ? 'pfa' : 'sfa';
      const acr = tokenAcr || (isPfa ? (config.pfaAcrValue || 'loa-2') : (config.sfaAcrValue || 'loa-1'));

      const newSession = {
        isAuthenticated: true,
        factorLevel,
        factorTypeDescription: isPfa
          ? (directOtp ? 'Protected Factor (Direct Grant with OTP)' : 'Protected Factor (Direct Grant PFA Mode)')
          : 'Single-Factor (Direct Grant Username/Password)',
        user: {
          id: accessPayload.sub || idPayload.sub || 'user-id',
          username: accessPayload.preferred_username || idPayload.preferred_username || directUsername,
          email: accessPayload.email || idPayload.email || `${directUsername}@example.com`,
          name: accessPayload.name || idPayload.name || directUsername,
          roles: accessPayload.realm_access?.roles || ['user'],
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Current Active Session Status Banner */}
      {session && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            borderColor: session.factorLevel === 'pfa' ? 'success.main' : 'warning.main',
            backgroundColor:
              session.factorLevel === 'pfa'
                ? theme.palette.mode === 'dark'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(16, 185, 129, 0.05)'
                : theme.palette.mode === 'dark'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(245, 158, 11, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                backgroundColor: session.factorLevel === 'pfa' ? 'success.light' : 'warning.light',
                color: session.factorLevel === 'pfa' ? 'success.dark' : 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {session.factorLevel === 'pfa' ? <VerifiedUserIcon /> : <VpnKeyIcon />}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1" fontWeight={700}>
                  Active Session:
                </Typography>
                <Chip
                  label={session.factorLevel === 'pfa' ? 'PFA Active (LoA 2)' : 'SFA Active (LoA 1)'}
                  color={session.factorLevel === 'pfa' ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {session.user.username}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {session.factorTypeDescription}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color={session.factorLevel === 'pfa' ? 'success' : 'primary'}
              onClick={() => onSessionCreated && onSessionCreated(session, 'Inspect')}
            >
              Inspect Tokens &amp; Claims
            </Button>
          </Box>
        </Paper>
      )}

      {/* Target Keycloak Config Summary Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
              color: 'primary.main',
              display: 'flex',
            }}
          >
            <TuneIcon fontSize="small" />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={700}>
                Active Keycloak Target:
              </Typography>
              <Chip
                label={`${config.baseUrl}/realms/${config.realm}`}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontFamily: 'monospace', height: 22 }}
              />
              <Typography variant="caption" color="text.secondary">
                Client: <strong>{config.clientId}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Scope: <strong>{config.scope || 'openid'}</strong>
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Testing SFA (<code>{config.sfaAcrValue}</code>) and PFA (<code>{config.pfaAcrValue}</code>)
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowConfig(!showConfig)}
          startIcon={<TuneIcon />}
        >
          {showConfig ? 'Hide Config' : 'Edit Endpoints'}
        </Button>
      </Paper>

      {/* Expandable Configuration Drawer */}
      <Collapse in={showConfig}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            OIDC &amp; Keycloak Parameters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Keycloak Base URL"
                value={config.baseUrl}
                onChange={(e) => onUpdateConfig({ ...config, baseUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Realm Name"
                value={config.realm}
                onChange={(e) => onUpdateConfig({ ...config, realm: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Client ID"
                value={config.clientId}
                onChange={(e) => onUpdateConfig({ ...config, clientId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="OIDC Scope (use 'openid')"
                value={config.scope || 'openid'}
                onChange={(e) => onUpdateConfig({ ...config, scope: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="SFA ACR Value"
                value={config.sfaAcrValue}
                onChange={(e) => onUpdateConfig({ ...config, sfaAcrValue: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="PFA ACR Value"
                value={config.pfaAcrValue}
                onChange={(e) => onUpdateConfig({ ...config, pfaAcrValue: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Redirect URI"
                value={config.redirectUri}
                onChange={(e) => onUpdateConfig({ ...config, redirectUri: e.target.value })}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* 3 Main Testing Cards (SFA vs PFA Passwordless vs PFA Step-Up) */}
      <Grid container spacing={3}>
        {/* CARD 1: SFA */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    backgroundColor: 'warning.light',
                    color: 'warning.dark',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VpnKeyIcon />
                </Box>
                <Chip label="LoA 1 • SFA" color="warning" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Typography variant="h6" fontWeight={800} gutterBottom>
                Single-Factor (SFA)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                Standard primary factor. User verifies identity on Keycloak with Username + Password form.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Factor:</Typography>
                  <Typography variant="caption" fontWeight={600}>Password Only</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Expected AMR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="warning.main">["pwd"]</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Expected ACR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="warning.main">"{config.sfaAcrValue}"</Typography>
                </Box>
              </Paper>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                endIcon={<OpenInNewIcon />}
                onClick={() =>
                  launchLiveOidcFlow({
                    acrValue: config.sfaAcrValue,
                    flowLabel: 'SFA Standard Login',
                    factorLevel: 'sfa',
                  })
                }
              >
                Launch SFA Login (PKCE)
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* CARD 2: PFA Passwordless */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    backgroundColor: 'info.light',
                    color: 'info.dark',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FingerprintIcon />
                </Box>
                <Chip label="PFA • Passwordless" color="info" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Typography variant="h6" fontWeight={800} gutterBottom>
                PFA: Passkey / WebAuthn
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                Phishing-resistant factor authentication. FIDO2 / TouchID / Security Key without passwords.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Factor:</Typography>
                  <Typography variant="caption" fontWeight={600}>FIDO2 Passkey</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Expected AMR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="info.main">["webauthn"]</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Expected ACR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="info.main">"pfa"</Typography>
                </Box>
              </Paper>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                color="info"
                endIcon={<OpenInNewIcon />}
                onClick={() =>
                  launchLiveOidcFlow({
                    acrValue: 'pfa',
                    flowLabel: 'PFA Passwordless WebAuthn',
                    factorLevel: 'pfa',
                  })
                }
              >
                Launch WebAuthn Flow (PKCE)
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* CARD 3: PFA Step-Up MFA */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    backgroundColor: 'success.light',
                    color: 'success.dark',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VerifiedUserIcon />
                </Box>
                <Chip label="LoA 2 • Step-Up MFA" color="success" size="small" sx={{ fontWeight: 700 }} />
              </Box>

              <Typography variant="h6" fontWeight={800} gutterBottom>
                PFA: Step-Up MFA (TOTP)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                Protected Multi-Factor. Demands Level of Assurance 2 by verifying Password + Authenticator OTP.
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Factor:</Typography>
                  <Typography variant="caption" fontWeight={600}>Password + TOTP</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Expected AMR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="success.main">["pwd", "otp"]</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Expected ACR:</Typography>
                  <Typography variant="caption" fontFamily="monospace" color="success.main">"{config.pfaAcrValue}"</Typography>
                </Box>
              </Paper>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                endIcon={<OpenInNewIcon />}
                onClick={() =>
                  launchLiveOidcFlow({
                    acrValue: config.pfaAcrValue,
                    flowLabel: 'PFA Step-Up MFA (LoA 2)',
                    factorLevel: 'pfa',
                  })
                }
              >
                Launch Step-Up Flow (PKCE)
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Direct Access Grants (ROPC) Card */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SendIcon fontSize="small" color="primary" />
              Direct Access Grants Tester (ROPC /token)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Test calling Keycloak's token endpoint directly with username, password, and optional OTP.
            </Typography>
          </Box>
          <Chip
            label={`POST ${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`}
            size="small"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          />
        </Box>

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Direct Grant Target Level:
          </Typography>
          <Button
            size="small"
            variant={directFactorLevel === 'pfa' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => handleSelectDirectFactorLevel('pfa')}
            sx={{ height: 26, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
          >
            PFA (LoA 2 / MFA) • morgan.pfa
          </Button>
          <Button
            size="small"
            variant={directFactorLevel === 'sfa' ? 'contained' : 'outlined'}
            color="warning"
            onClick={() => handleSelectDirectFactorLevel('sfa')}
            sx={{ height: 26, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
          >
            SFA (LoA 1 / Password) • alex.sfa
          </Button>
        </Box>

        <form onSubmit={handleDirectGrant}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Username"
                value={directUsername}
                onChange={(e) => setDirectUsername(e.target.value)}
                helperText={directFactorLevel === 'pfa' ? 'PFA User (MFA / LoA 2)' : 'SFA User (Password / LoA 1)'}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="password"
                label="Password"
                value={directPassword}
                onChange={(e) => setDirectPassword(e.target.value)}
                helperText="Default: password123"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="TOTP Code (Optional for PFA)"
                placeholder="123456"
                value={directOtp}
                onChange={(e) => setDirectOtp(e.target.value)}
                helperText={directFactorLevel === 'pfa' ? 'Leave empty or enter TOTP' : 'Not required for SFA'}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isDirectLoading}
                startIcon={<SendIcon />}
                color={directFactorLevel === 'pfa' ? 'success' : 'warning'}
                sx={{ height: 40, fontWeight: 700 }}
              >
                {isDirectLoading ? 'Authenticating...' : `Request Token (${directUsername})`}
              </Button>
            </Grid>
          </Grid>
        </form>

        {directError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {directError}
          </Alert>
        )}
      </Paper>

      {/* PKCE Live Parameters Inspector */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon fontSize="small" color="secondary" />
            Live PKCE Parameters &amp; Authorize URL Preview
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refreshPkcePreview}
          >
            Regenerate Nonces
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                code_verifier (High-Entropy Secret):
              </Typography>
              <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', mt: 0.5 }}>
                {pkcePreview.codeVerifier}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                code_challenge (SHA-256 Base64URL):
              </Typography>
              <Typography variant="body2" fontFamily="monospace" color="secondary.main" sx={{ wordBreak: 'break-all', mt: 0.5 }}>
                {pkcePreview.codeChallenge}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Constructed Authorization URL:
              </Typography>
              <Typography variant="caption" fontFamily="monospace" sx={{ wordBreak: 'break-all', display: 'block' }}>
                {buildAuthorizeUrl(config, {
                  codeChallenge: pkcePreview.codeChallenge,
                  state: pkcePreview.state,
                  nonce: pkcePreview.nonce,
                  acrValue: config.pfaAcrValue,
                })}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

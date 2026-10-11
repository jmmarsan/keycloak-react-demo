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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
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
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import { generatePkce, buildAuthorizeUrl, directGrantLogin, parseJwt } from '../services/oidc.js';
import { AVAILABLE_CLIENTS, AVAILABLE_ROLES } from '../data/keycloakExport.js';

export const AuthFlowScreen = ({
  config,
  onUpdateConfig,
  onSwitchClient,
  session,
  onSessionCreated,
  onLogAudit,
}) => {
  const theme = useTheme();
  const [showConfig, setShowConfig] = useState(false);

  // Selection state for testing users (role and factor instance; client is driven by active config.clientId)
  const [selectedRole, setSelectedRole] = useState('user');
  const [selectedUserIndex, setSelectedUserIndex] = useState('sfa');
  const [sfaCardRole, setSfaCardRole] = useState('user');
  const [totpCardRole, setTotpCardRole] = useState('user');
  const [fidoCardRole, setFidoCardRole] = useState('user');

  const [directFactorLevel, setDirectFactorLevel] = useState('sfa');
  const [directUsername, setDirectUsername] = useState(() => `${config.clientId === 'faxmail' ? 'faxmail' : 'callrecording'}.user.sfa`);
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

  // Keep selected username in sync when config.clientId changes externally
  useEffect(() => {
    if (config.clientId) {
      const activeApp = config.clientId;
      const uname = `${activeApp}.${selectedRole}.${selectedUserIndex}`;
      setDirectUsername(uname);
    }
  }, [config.clientId, selectedRole, selectedUserIndex]);

  // Update combo selections, username, and target factor level based on identification type
  const updateCombosAndUsername = (role, userIndexOrId) => {
    setSelectedRole(role);
    setSelectedUserIndex(userIndexOrId);

    const activeApp = config.clientId || 'callrecording';
    let uname = '';
    let factor = 'sfa';

    if (userIndexOrId === 'sfa' || userIndexOrId === '1') {
      uname = `${activeApp}.${role}.sfa`;
      factor = 'sfa';
    } else if (userIndexOrId === 'totp' || userIndexOrId === '2') {
      uname = `${activeApp}.${role}.totp`;
      factor = 'pfa';
    } else if (userIndexOrId === 'fido2' || userIndexOrId === 'fido' || userIndexOrId === '3') {
      uname = `${activeApp}.${role}.fido2`;
      factor = 'webauthn';
    } else {
      uname = `${activeApp}.${role}.${userIndexOrId}`;
      factor = 'sfa';
    }

    setDirectUsername(uname);
    setDirectPassword('password123');
    setDirectFactorLevel(factor);
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
    if (options.role) {
      sessionStorage.setItem('kc_flow_role', options.role);
    } else {
      sessionStorage.removeItem('kc_flow_role');
    }
    if (options.loginHint) {
      sessionStorage.setItem('kc_login_hint', options.loginHint);
    } else {
      sessionStorage.removeItem('kc_login_hint');
    }

    const authUrl = buildAuthorizeUrl(config, {
      codeChallenge,
      state,
      nonce,
      acrValue: options.acrValue,
      prompt: options.prompt || 'login',
      loginHint: options.loginHint,
    });

    onLogAudit({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'AUTH_START',
      title: `Initiated ${options.flowLabel} (PKCE)`,
      detail: `Opening authorization URL with acr_values="${options.acrValue || 'none'}"${options.loginHint ? ` [Target: ${options.loginHint}]` : ''} [Expected: ${factorLevel.toUpperCase()}]`,
      status: 'info',
      payload: { authUrl, codeChallenge, state, factorLevel, targetUser: options.loginHint },
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

      const isWebAuthn =
        directFactorLevel === 'webauthn' ||
        directUsername.toLowerCase().includes('webauthn');

      const isPfa =
        isWebAuthn ||
        directFactorLevel === 'pfa' ||
        directUsername.toLowerCase().includes('pfa') ||
        Boolean(directOtp) ||
        String(tokenAcr).includes('2') ||
        String(tokenAcr).includes('pfa');

      const factorLevel = isPfa ? 'pfa' : 'sfa';
      const acr = tokenAcr || (isPfa ? (config.pfaAcrValue || 'loa-2') : (config.sfaAcrValue || 'loa-1'));

      const factorSubtype = isWebAuthn ? 'webauthn' : (isPfa ? 'totp' : 'sfa');
      let factorTypeDescription = 'Single-Factor (Direct Grant Username/Password)';
      let amr = ['pwd'];
      if (isWebAuthn) {
        factorTypeDescription = 'Protected Factor: Passkey / WebAuthn (FIDO2 • LoA 2)';
        amr = ['webauthn', 'pwd'];
      } else if (isPfa) {
        factorTypeDescription = directOtp
          ? 'Protected Factor: Step-Up MFA (Direct Grant with OTP • LoA 2)'
          : 'Protected Factor: Step-Up MFA (TOTP Mode • LoA 2)';
        amr = ['pwd', 'otp'];
      }

      const clientRoles = accessPayload.resource_access?.[config.clientId]?.roles || [];
      const realmRoles = accessPayload.realm_access?.roles || [];
      const allRoles = Array.from(new Set([...clientRoles, ...realmRoles])).filter(
        (r) => !['default-roles-idp', 'default-roles-sfa-pfa-demo', 'offline_access', 'uma_authorization'].includes(r)
      );
      let primaryRole = 'user';
      if (allRoles.includes('admin') || directUsername.includes('.admin.') || directUsername.endsWith('.admin')) {
        primaryRole = 'admin';
      } else if (allRoles.includes('tenant') || directUsername.includes('.tenant.') || directUsername.endsWith('.tenant')) {
        primaryRole = 'tenant';
      } else if (allRoles.includes('user') || directUsername.includes('.user.') || directUsername.endsWith('.user')) {
        primaryRole = 'user';
      } else if (selectedRole) {
        primaryRole = selectedRole;
      }
      const effectiveRoles = Array.from(new Set([primaryRole, ...allRoles]));

      const newSession = {
        isAuthenticated: true,
        factorLevel,
        factorSubtype,
        factorTypeDescription,
        user: {
          id: accessPayload.sub || idPayload.sub || 'user-id',
          username: accessPayload.preferred_username || idPayload.preferred_username || directUsername,
          email: accessPayload.email || idPayload.email || `${directUsername}@hcltech.com`,
          name: accessPayload.name || idPayload.name || directUsername,
          role: primaryRole,
          roles: effectiveRoles,
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
            borderColor:
              session.factorSubtype === 'webauthn' ||
              session.user?.username?.toLowerCase().includes('webauthn')
                ? 'info.main'
                : session.factorLevel === 'pfa'
                ? 'success.main'
                : 'warning.main',
            backgroundColor:
              session.factorSubtype === 'webauthn' ||
              session.user?.username?.toLowerCase().includes('webauthn')
                ? 'rgba(2, 132, 199, 0.06)'
                : session.factorLevel === 'pfa'
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
                backgroundColor:
                  session.factorSubtype === 'webauthn' ||
                  session.user?.username?.toLowerCase().includes('webauthn')
                    ? 'info.light'
                    : session.factorLevel === 'pfa'
                    ? 'success.light'
                    : 'warning.light',
                color:
                  session.factorSubtype === 'webauthn' ||
                  session.user?.username?.toLowerCase().includes('webauthn')
                    ? 'info.dark'
                    : session.factorLevel === 'pfa'
                    ? 'success.dark'
                    : 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {session.factorSubtype === 'webauthn' ||
              session.user?.username?.toLowerCase().includes('webauthn') ? (
                <FingerprintIcon />
              ) : session.factorLevel === 'pfa' ? (
                <VerifiedUserIcon />
              ) : (
                <VpnKeyIcon />
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1" fontWeight={700}>
                  Active Session:
                </Typography>
                <Chip
                  label={
                    session.factorSubtype === 'webauthn' ||
                    session.user?.username?.toLowerCase().includes('webauthn')
                      ? 'PFA: Passkey / WebAuthn (LoA 2)'
                      : session.factorLevel === 'pfa'
                      ? 'PFA Active (LoA 2)'
                      : 'SFA Active (LoA 1)'
                  }
                  color={
                    session.factorSubtype === 'webauthn' ||
                    session.user?.username?.toLowerCase().includes('webauthn')
                      ? 'info'
                      : session.factorLevel === 'pfa'
                      ? 'success'
                      : 'warning'
                  }
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
              color={
                session.factorSubtype === 'webauthn' ||
                session.user?.username?.toLowerCase().includes('webauthn')
                  ? 'info'
                  : session.factorLevel === 'pfa'
                  ? 'success'
                  : 'primary'
              }
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                Testing SFA (<code>{config.sfaAcrValue}</code>) and PFA (<code>{config.pfaAcrValue}</code>)
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ height: 14, my: 'auto' }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Active Client:
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={config.clientId === 'faxmail' ? 'faxmail' : 'callrecording'}
                exclusive
                onChange={(_, val) => {
                  if (val && onSwitchClient) onSwitchClient(val);
                }}
                sx={{
                  height: 24,
                  '& .MuiToggleButton-root': {
                    px: 1,
                    py: 0,
                    fontSize: '0.68rem',
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                }}
              >
                <ToggleButton value="callrecording">
                  <PhoneInTalkIcon sx={{ fontSize: '0.75rem', mr: 0.5 }} />
                  callrecording
                </ToggleButton>
                <ToggleButton value="faxmail">
                  <EmailIcon sx={{ fontSize: '0.75rem', mr: 0.5 }} />
                  faxmail
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Keycloak Base URL"
                value={config.baseUrl}
                onChange={(e) => onUpdateConfig({ ...config, baseUrl: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Realm Name"
                value={config.realm}
                onChange={(e) => onUpdateConfig({ ...config, realm: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Client ID"
                value={config.clientId}
                onChange={(e) => onUpdateConfig({ ...config, clientId: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="OIDC Scope (use 'openid')"
                value={config.scope || 'openid'}
                onChange={(e) => onUpdateConfig({ ...config, scope: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="SFA ACR Value"
                value={config.sfaAcrValue}
                onChange={(e) => onUpdateConfig({ ...config, sfaAcrValue: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="PFA ACR Value"
                value={config.pfaAcrValue}
                onChange={(e) => onUpdateConfig({ ...config, pfaAcrValue: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
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

              {/* Role Combo Selector */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="sfa-card-role-label">Test Role</InputLabel>
                  <Select
                    labelId="sfa-card-role-label"
                    label="Test Role"
                    value={sfaCardRole}
                    onChange={(e) => setSfaCardRole(e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="user">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="user" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Standard User</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="tenant">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="tenant" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Tenant Manager</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="admin" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Administrator</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Test User:</Typography>
                  <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="warning.main">
                    {config.clientId}.{sfaCardRole}.sfa
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Factor:</Typography>
                  <Typography variant="caption" fontWeight={600}>Password Only (LoA 1)</Typography>
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
                    flowLabel: `SFA Standard Login (${sfaCardRole})`,
                    factorLevel: 'sfa',
                    loginHint: `${config.clientId}.${sfaCardRole}.sfa`,
                    prompt: 'login',
                    role: sfaCardRole,
                  })
                }
              >
                Launch SFA Login ({config.clientId}.{sfaCardRole}.sfa)
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* CARD 2: PFA Step-Up MFA */}
        <Grid size={{ xs: 12, md: 4 }}>
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

              {/* Role Combo Selector */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="totp-card-role-label">Test Role</InputLabel>
                  <Select
                    labelId="totp-card-role-label"
                    label="Test Role"
                    value={totpCardRole}
                    onChange={(e) => setTotpCardRole(e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="user">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="user" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Standard User</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="tenant">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="tenant" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Tenant Manager</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="admin" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Administrator</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Test User:</Typography>
                  <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="success.main">
                    {config.clientId}.{totpCardRole}.totp
                  </Typography>
                </Box>
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
                    flowLabel: `PFA Step-Up MFA (${totpCardRole})`,
                    factorLevel: 'pfa',
                    loginHint: `${config.clientId}.${totpCardRole}.totp`,
                    prompt: 'login',
                    role: totpCardRole,
                  })
                }
              >
                Launch Step-Up Flow ({config.clientId}.{totpCardRole}.totp)
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* CARD 3: PFA Passwordless Passkey / WebAuthn */}
        <Grid size={{ xs: 12, md: 4 }}>
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

              {/* Role Combo Selector */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="fido-card-role-label">Test Role</InputLabel>
                  <Select
                    labelId="fido-card-role-label"
                    label="Test Role"
                    value={fidoCardRole}
                    onChange={(e) => setFidoCardRole(e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="user">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="user" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Standard User</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="tenant">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="tenant" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Tenant Manager</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="admin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="admin" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                        <Typography variant="body2">Administrator</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 1,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Test User:</Typography>
                  <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="info.main">
                    {config.clientId}.{fidoCardRole}.fido2
                  </Typography>
                </Box>
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
                    flowLabel: `PFA Passwordless WebAuthn (${fidoCardRole})`,
                    factorLevel: 'pfa',
                    loginHint: `${config.clientId}.${fidoCardRole}.fido2`,
                    prompt: 'login',
                    role: fidoCardRole,
                  })
                }
              >
                Launch WebAuthn Flow ({config.clientId}.{fidoCardRole}.fido2)
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
              Directly call Keycloak's token endpoint with the 18 testing accounts (2 Clients × 3 Roles × 3 Users).
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Active Client: ${config.clientId}`}
              size="small"
              color={config.clientId === 'faxmail' ? 'secondary' : 'primary'}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`POST ${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
            />
          </Box>
        </Box>

        {/* 2 Combos Selector for Testing Users (Role + Factor Instance) */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: 2.5,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                Testing user selector
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Driven by active target client (<strong>{config.clientId}</strong>). Selecting role and factor automatically fills the username, password (<code>password123</code>), and factor level.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={
                  directFactorLevel === 'webauthn'
                    ? 'PFA • Passkey / WebAuthn (LoA 2)'
                    : directFactorLevel === 'pfa'
                    ? 'PFA • Step-Up TOTP (LoA 2)'
                    : 'SFA • Password Only (LoA 1)'
                }
                color={
                  directFactorLevel === 'webauthn'
                    ? 'info'
                    : directFactorLevel === 'pfa'
                    ? 'success'
                    : 'default'
                }
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`${directUsername}@hcltech.com`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontFamily: 'monospace', fontWeight: 700 }}
              />
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Combo 1: Role */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="direct-role-combo-label">1. Client Role</InputLabel>
                <Select
                  labelId="direct-role-combo-label"
                  label="1. Client Role"
                  value={selectedRole}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    updateCombosAndUsername(newRole, selectedUserIndex);
                  }}
                >
                  <MenuItem value="user">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="user" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                      <Typography variant="body2">Standard User</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="tenant">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="tenant" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                      <Typography variant="body2">Tenant Manager</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="admin" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                      <Typography variant="body2">Administrator</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Combo 2: User Factor Instance */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="direct-user-combo-label">2. User Factor Instance</InputLabel>
                <Select
                  labelId="direct-user-combo-label"
                  label="2. User Factor Instance"
                  value={selectedUserIndex}
                  onChange={(e) => {
                    const newIndex = e.target.value;
                    updateCombosAndUsername(selectedRole, newIndex);
                  }}
                >
                  <MenuItem value="sfa">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: 'warning.light',
                          color: 'warning.dark',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VpnKeyIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip label=".sfa" color="warning" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
                          <Typography variant="body2" fontWeight={700}>
                            Password (SFA • LoA 1)
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {config.clientId}.{selectedRole}.sfa • Standard Password Login
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>

                  <MenuItem value="totp">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: 'success.light',
                          color: 'success.dark',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VerifiedUserIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip label=".totp" color="success" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
                          <Typography variant="body2" fontWeight={700}>
                            PFA: Step-Up MFA (TOTP • LoA 2)
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {config.clientId}.{selectedRole}.totp • Password + Authenticator OTP
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>

                  <MenuItem value="fido2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          backgroundColor: 'info.light',
                          color: 'info.dark',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FingerprintIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip label=".fido2" color="info" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }} />
                          <Typography variant="body2" fontWeight={700}>
                            PFA: Passkey / WebAuthn (FIDO2 • LoA 2)
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {config.clientId}.{selectedRole}.fido2 • Passkey Biometrics / FIDO2
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <form onSubmit={handleDirectGrant}>
          <Grid container spacing={2} sx={{ alignItems: 'flex-end' }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Username"
                value={directUsername}
                onChange={(e) => setDirectUsername(e.target.value)}
                helperText={`Target Client: ${config.clientId}`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
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
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="TOTP Code (Optional for PFA)"
                placeholder="123456"
                value={directOtp}
                onChange={(e) => setDirectOtp(e.target.value)}
                helperText={
                  directFactorLevel === 'webauthn'
                    ? 'Passkey handled via WebAuthn; OTP optional'
                    : directFactorLevel === 'pfa'
                    ? 'Leave empty or enter TOTP code'
                    : 'Not required for standard password login'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isDirectLoading}
                startIcon={<SendIcon />}
                color={directFactorLevel === 'webauthn' ? 'info' : directFactorLevel === 'pfa' ? 'success' : 'primary'}
                sx={{ height: 40, fontWeight: 700 }}
              >
                {isDirectLoading ? 'Authenticating...' : `Request Token (${directUsername})`}
              </Button>
            </Grid>
          </Grid>
        </form>

        {directError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              {directError}
            </Typography>
            {(directError.toLowerCase().includes('account is not fully set up') ||
              directError.toLowerCase().includes('invalid character')) && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                  💡 Cause &amp; Resolution:
                </Typography>
                <Typography variant="caption" display="block">
                  Keycloak's User Profile validator restricts prohibited characters (such as parentheses <code>( )</code>) in the user's <strong>First Name</strong>, which marks the account as incomplete and requires a profile update.
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  The realm generator in <strong>Setup &amp; Config &gt; Keycloak Setup Guide</strong> has now been updated to use clean names without special characters (e.g. <code>Call Recording User</code>). Re-download/import the realm JSON, or update the First Name in Keycloak Admin Console (Users &gt; Details) and verify email.
                </Typography>
              </Box>
            )}
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

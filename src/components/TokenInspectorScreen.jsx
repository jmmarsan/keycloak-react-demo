import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';

export const TokenInspectorScreen = ({
  session,
  onRefresh,
  onStepUp,
  onGoToConsole,
}) => {
  const theme = useTheme();
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
      <Paper
        variant="outlined"
        sx={{
          py: 10,
          px: 3,
          textAlign: 'center',
          borderRadius: 4,
          maxWidth: 600,
          mx: 'auto',
          mt: 4,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            color: 'text.secondary',
          }}
        >
          <CodeIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          No Active Authentication Session
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
          Log in with Single-Factor or PFA in the Testing Console to inspect ID and Access Tokens, AMR/ACR assurance metrics, and token lifetimes.
        </Typography>
        <Button variant="contained" color="primary" onClick={onGoToConsole}>
          Go to Testing Console
        </Button>
      </Paper>
    );
  }

  const isPfa = session.factorLevel === 'pfa';
  const decodedPayload =
    activeTokenTab === 'id'
      ? session.decodedIdToken?.payload
      : session.decodedAccessToken?.payload;

  const rawTokenString =
    activeTokenTab === 'id'
      ? session.tokens?.id_token || 'No ID Token'
      : session.tokens?.access_token || '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Session Assurance Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 3,
          borderColor: isPfa ? 'success.main' : 'warning.main',
          background:
            isPfa
              ? theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.4))'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(255, 255, 255, 0.8))'
              : theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.4))'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(255, 255, 255, 0.8))',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                backgroundColor: isPfa ? 'success.light' : 'warning.light',
                color: isPfa ? 'success.dark' : 'warning.dark',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPfa ? <VerifiedUserIcon sx={{ fontSize: 32 }} /> : <WarningAmberIcon sx={{ fontSize: 32 }} />}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={800}>
                  {isPfa ? 'PFA: Protected Factor Session' : 'SFA: Single-Factor Session'}
                </Typography>
                <Chip
                  label={isPfa ? 'High Assurance (LoA 2 / PFA)' : 'Standard Assurance (LoA 1 / SFA)'}
                  color={isPfa ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {session.factorTypeDescription}
              </Typography>

              {/* Claims tags */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">AMR (Methods):</Typography>
                {session.amr && session.amr.length > 0 ? (
                  session.amr.map((method) => (
                    <Chip
                      key={method}
                      label={method}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ fontFamily: 'monospace', height: 20, fontSize: '0.7rem' }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">none</Typography>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>ACR (Assurance):</Typography>
                <Chip
                  label={session.acr || 'standard'}
                  size="small"
                  variant="outlined"
                  color={isPfa ? 'success' : 'warning'}
                  sx={{ fontFamily: 'monospace', height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isPfa && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ArrowUpwardIcon />}
                onClick={onStepUp}
              >
                Elevate to PFA
              </Button>
            )}

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
            >
              Refresh Token
            </Button>
          </Box>
        </Box>

        {/* Lifetime countdown */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Access Token Lifetime: <strong>{timeLeftSeconds}s</strong> remaining
              </Typography>
            </Box>
            <Typography variant="caption" fontFamily="monospace">
              exp: {session.decodedAccessToken?.payload?.exp || 'N/A'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (timeLeftSeconds / 300) * 100)}
            color={timeLeftSeconds < 60 ? 'error' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </Paper>

      {/* User info grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountCircleIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Subject (sub)</Typography>
              <Typography variant="body2" fontWeight={700}>{session.user.name}</Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">{session.user.email}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon color="secondary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Assigned Roles</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {session.user.roles?.map((role) => (
                  <Chip key={role} label={role} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CodeIcon color="info" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Keycloak Realm Issuer</Typography>
              <Typography variant="body2" fontWeight={700}>Local Keycloak</Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                {session.decodedAccessToken?.payload?.iss || 'http://localhost:8080'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Token Decoded Claims Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs value={activeTokenTab} onChange={(e, val) => setActiveTokenTab(val)}>
            <Tab value="access" label="Access Token Claims" />
            <Tab value="id" label="ID Token (User Info)" />
            <Tab value="raw" label="Raw Encoded JWT" />
          </Tabs>

          <Tooltip title="Copy Token to Clipboard">
            <Button
              size="small"
              startIcon={copiedKey === 'raw-token' ? <CheckIcon color="success" /> : <ContentCopyIcon />}
              onClick={() => copyToClipboard(rawTokenString, 'raw-token')}
            >
              {copiedKey === 'raw-token' ? 'Copied' : 'Copy'}
            </Button>
          </Tooltip>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTokenTab === 'raw' ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.02)',
              }}
            >
              {rawTokenString}
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Payload Claims
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {decodedPayload &&
                    Object.entries(decodedPayload).map(([key, val]) => {
                      const isAssurance = key === 'acr' || key === 'amr';
                      return (
                        <Paper
                          key={key}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderColor: isAssurance ? 'primary.main' : 'divider',
                            backgroundColor: isAssurance
                              ? theme.palette.mode === 'dark'
                                ? 'rgba(99,102,241,0.08)'
                                : 'rgba(99,102,241,0.04)'
                              : 'transparent',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                              {key}
                            </Typography>
                            {isAssurance && (
                              <Chip label="Assurance" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            color="text.secondary"
                            sx={{ wordBreak: 'break-all', maxWidth: 300, textAlign: 'right' }}
                          >
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </Typography>
                        </Paper>
                      );
                    })}
                </Box>
              </Grid>

              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Decoded JSON
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    maxHeight: 450,
                    overflowY: 'auto',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <pre style={{ margin: 0 }}>{JSON.stringify(decodedPayload, null, 2)}</pre>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

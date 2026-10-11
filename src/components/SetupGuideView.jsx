import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import StorageIcon from '@mui/icons-material/Storage';
import LayersIcon from '@mui/icons-material/Layers';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import EmailIcon from '@mui/icons-material/Email';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import KeyIcon from '@mui/icons-material/Key';
import { KEYCLOAK_DEMO_REALM, DOCKER_CLI_COMMAND, DOCKER_COMPOSE_YML, TESTING_USERS_MATRIX } from '../data/keycloakExport';

export const SetupGuideView = () => {
  const theme = useTheme();
  const [copiedKey, setCopiedKey] = useState(null);
  const [filterApp, setFilterApp] = useState('all');

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadRealmJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(KEYCLOAK_DEMO_REALM, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'sfa-pfa-demo-realm.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredUsers = filterApp === 'all'
    ? TESTING_USERS_MATRIX
    : TESTING_USERS_MATRIX.filter((u) => u.username.startsWith(filterApp));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Hero Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: 3,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.8))'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(255, 255, 255, 0.9))',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 3,
        }}
      >
        <Box sx={{ maxWidth: 700 }}>
          <Chip
            icon={<StorageIcon fontSize="small" />}
            label="2 Clients • 3 Roles • 18 Test Users Ready"
            color="primary"
            size="small"
            sx={{ mb: 1.5, fontWeight: 700 }}
          />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Keycloak Setup Guide &amp; Realm Export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Download the pre-configured realm JSON file containing both clients (<code>callrecording</code> and <code>faxmail</code>), 3 client roles each (<code>user</code>, <code>tenant</code>, <code>admin</code>), and the complete 18 testing users matrix with password <code>password123</code> and <code>@hcltech.com</code> emails.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={downloadRealmJson}
            sx={{ fontWeight: 700 }}
          >
            Download Realm JSON
          </Button>

          <Button
            variant="outlined"
            startIcon={copiedKey === 'realm-json' ? <CheckIcon color="success" /> : <ContentCopyIcon />}
            onClick={() => copyToClipboard(JSON.stringify(KEYCLOAK_DEMO_REALM, null, 2), 'realm-json')}
          >
            {copiedKey === 'realm-json' ? 'Copied!' : 'Copy Realm JSON'}
          </Button>
        </Box>
      </Paper>

      {/* 2 Clients Overview */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="1" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Dual Client Applications Architecture
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', borderColor: 'primary.main', borderWidth: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneInTalkIcon sx={{ color: '#06b6d4', fontSize: 28 }} />
                  <Typography variant="subtitle1" fontWeight={800}>
                    callrecording
                  </Typography>
                </Box>
                <Chip label="Client ID: callrecording" size="small" color="primary" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Call Recording service client configured for SPA PKCE S256 and Direct Access Grants.
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                Client Roles:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="user (Standard End-User)" size="small" variant="outlined" />
                <Chip label="tenant (Tenant Manager)" size="small" color="warning" variant="outlined" />
                <Chip label="admin (Administrator)" size="small" color="error" variant="outlined" />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', borderColor: 'secondary.main', borderWidth: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ color: '#a855f7', fontSize: 28 }} />
                  <Typography variant="subtitle1" fontWeight={800}>
                    faxmail
                  </Typography>
                </Box>
                <Chip label="Client ID: faxmail" size="small" color="secondary" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Fax Mail service client configured for SPA PKCE S256 and Direct Access Grants.
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                Client Roles:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="user (Standard End-User)" size="small" variant="outlined" />
                <Chip label="tenant (Tenant Manager)" size="small" color="warning" variant="outlined" />
                <Chip label="admin (Administrator)" size="small" color="error" variant="outlined" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 18 Testing Users Matrix */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip label="★" color="secondary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                18 Testing Accounts Matrix (2 Clients × 3 Roles × 3 Users)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All accounts use default password <code>password123</code> and <code>@hcltech.com</code> domain.
              </Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            size="small"
            value={filterApp}
            exclusive
            onChange={(_, val) => val && setFilterApp(val)}
          >
            <ToggleButton value="all">All (18 Users)</ToggleButton>
            <ToggleButton value="callrecording">callrecording (9 Users)</ToggleButton>
            <ToggleButton value="faxmail">faxmail (9 Users)</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Client App</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Identification Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email (@hcltech.com)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Password</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => {
                const isCall = u.username.startsWith('callrecording');
                const role = u.attributes.appRole[0];
                const identType = u.attributes.identificationType?.[0] || 'password';
                return (
                  <TableRow key={u.username} hover>
                    <TableCell>
                      <Chip
                        icon={isCall ? <PhoneInTalkIcon fontSize="inherit" /> : <EmailIcon fontSize="inherit" />}
                        label={isCall ? 'callrecording' : 'faxmail'}
                        size="small"
                        color={isCall ? 'primary' : 'secondary'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role}
                        size="small"
                        color={role === 'admin' ? 'error' : role === 'tenant' ? 'warning' : 'default'}
                        sx={{ fontWeight: 600, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          identType === 'webauthn' ? (
                            <FingerprintIcon fontSize="inherit" />
                          ) : identType === 'totp' ? (
                            <VerifiedUserIcon fontSize="inherit" />
                          ) : (
                            <KeyIcon fontSize="inherit" />
                          )
                        }
                        label={
                          identType === 'webauthn'
                            ? 'PFA • Passkey'
                            : identType === 'totp'
                            ? 'PFA • TOTP'
                            : 'SFA • Password'
                        }
                        size="small"
                        color={
                          identType === 'webauthn'
                            ? 'info'
                            : identType === 'totp'
                            ? 'success'
                            : 'default'
                        }
                        sx={{ fontWeight: 700, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={700}>
                        {u.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        password123
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Copy Username">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(u.username, `uname-${u.username}`)}
                        >
                          {copiedKey === `uname-${u.username}` ? (
                            <CheckIcon fontSize="small" color="success" />
                          ) : (
                            <ContentCopyIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* PFA Factor Assurance Demo Accounts */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Specialized Multi-Factor (PFA / LoA 2) Testing Accounts
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%', borderColor: 'warning.main' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="warning.main">
                  alex.sfa
                </Typography>
                <Chip label="LoA 1 • SFA" size="small" color="warning" variant="outlined" />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Standard single-factor password login.
              </Typography>
              <Typography variant="caption" fontFamily="monospace" display="block" sx={{ mt: 1 }}>
                alex.sfa@hcltech.com / password123
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%', borderColor: 'success.main' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                  morgan.pfa
                </Typography>
                <Chip label="LoA 2 • TOTP" size="small" color="success" variant="outlined" />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Step-Up MFA with Authenticator TOTP code requirement.
              </Typography>
              <Typography variant="caption" fontFamily="monospace" display="block" sx={{ mt: 1 }}>
                morgan.pfa@hcltech.com / password123
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%', borderColor: 'info.main' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="info.main">
                  sam.webauthn
                </Typography>
                <Chip label="LoA 2 • Passkey" size="small" color="info" variant="outlined" />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                FIDO2 / WebAuthn passwordless biometric or security key factor.
              </Typography>
              <Typography variant="caption" fontFamily="monospace" display="block" sx={{ mt: 1 }}>
                sam.webauthn@hcltech.com / password123
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Step 2: Start Keycloak with Docker */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="2" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Run Local Keycloak in Docker
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Option A: Quick Docker CLI Command
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(DOCKER_CLI_COMMAND, 'docker-cli')}
                >
                  {copiedKey === 'docker-cli' ? <CheckIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" paragraph>
                Starts Keycloak in development mode with admin user: <code>admin / admin</code>.
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                }}
              >
                {DOCKER_CLI_COMMAND}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Option B: Docker Compose with Auto-Import
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(DOCKER_COMPOSE_YML, 'docker-compose')}
                >
                  {copiedKey === 'docker-compose' ? <CheckIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" paragraph>
                Automatically imports <code>sfa-pfa-demo-realm.json</code> on container startup.
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                }}
              >
                {DOCKER_COMPOSE_YML}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Step 3: Import Instructions in Admin Console */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="3" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Import Realm via Keycloak Admin Console
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                1. Access Admin Console
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Navigate to <code>http://localhost:8080</code> and log in with username <strong>admin</strong> and password <strong>admin</strong>.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                2. Create Realm &amp; Browse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In top-left realm dropdown (showing "master"), click <strong>"Create Realm"</strong>, click <strong>"Browse"</strong> and select <code>sfa-pfa-demo-realm.json</code>.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                3. Click Create
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click <strong>"Create"</strong>. The realm, both clients (<code>callrecording</code> and <code>faxmail</code>), the 3 roles per client (<code>user</code>, <code>tenant</code>, <code>admin</code>), and all 18 testing users are ready immediately!
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

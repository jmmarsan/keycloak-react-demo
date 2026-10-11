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
  useTheme,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import StorageIcon from '@mui/icons-material/Storage';
import LayersIcon from '@mui/icons-material/Layers';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { KEYCLOAK_DEMO_REALM, DOCKER_CLI_COMMAND, DOCKER_COMPOSE_YML } from '../data/keycloakExport';

export const SetupGuideView = () => {
  const theme = useTheme();
  const [copiedKey, setCopiedKey] = useState(null);

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
            label="Local Keycloak Setup Instructions"
            color="primary"
            size="small"
            sx={{ mb: 1.5, fontWeight: 700 }}
          />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Configuring Local Keycloak for SFA &amp; PFA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step-by-step instructions to run Keycloak locally in Docker on port 8080 and configure clients, client scopes, and Level of Assurance (LoA) mappings for Single-Factor (SFA) and Protected-Factor (PFA) authentication.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={downloadRealmJson}
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

      {/* Step 1: Start Keycloak with Docker */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="1" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Start Keycloak in Docker (Port 8080)
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TerminalIcon fontSize="small" color="secondary" />
                    Option A: Docker CLI
                  </Typography>
                  <Tooltip title="Copy Docker CLI Command">
                    <IconButton size="small" onClick={() => copyToClipboard(DOCKER_CLI_COMMAND, 'docker-cli')}>
                      {copiedKey === 'docker-cli' ? <CheckIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.02)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {DOCKER_CLI_COMMAND}
                </Paper>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                Admin console will start at <strong>http://localhost:8080</strong> (admin / admin).
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LayersIcon fontSize="small" color="primary" />
                    Option B: Docker Compose (Auto-Import)
                  </Typography>
                  <Tooltip title="Copy docker-compose.yml">
                    <IconButton size="small" onClick={() => copyToClipboard(DOCKER_COMPOSE_YML, 'docker-compose')}>
                      {copiedKey === 'docker-compose' ? <CheckIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.02)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {DOCKER_COMPOSE_YML}
                </Paper>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                Place downloaded <strong>sfa-pfa-demo-realm.json</strong> next to docker-compose.yml to auto-import.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Step 2: Instant Import */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="2" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Import Realm in 3 Clicks (If using Docker CLI)
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
                1. Open Admin Console
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Go to <a href="http://localhost:8080/admin" target="_blank" rel="noreferrer" style={{ color: theme.palette.primary.main }}>http://localhost:8080/admin</a> and log in with user <code>admin</code> and password <code>admin</code>.
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
                Click <strong>"Create"</strong>. The realm, client <code>react-app</code>, PKCE S256, CORS origins, and test users (<code>alex.sfa</code> and <code>morgan.pfa</code>) are ready!
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Step 3: Manual Client & Flow Setup */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label="3" color="primary" sx={{ width: 32, height: 32, borderRadius: '50%', fontWeight: 800 }} />
          <Typography variant="h6" fontWeight={700}>
            Manual Configuration Reference
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Client Settings (react-app):
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>Client authentication:</strong> OFF (Public client, mandatory for SPAs)<br />
            • <strong>Standard flow:</strong> ON (Authorization Code with PKCE)<br />
            • <strong>Direct access grants:</strong> ON (allows API direct testing)<br />
            • <strong>Valid redirect URIs:</strong> <code>http://localhost:3000/*</code> or <code>*</code><br />
            • <strong>Web Origins:</strong> <code>*</code> (Crucial for CORS)<br />
            • <strong>Advanced &gt; PKCE Code Challenge Method:</strong> <code>S256</code>
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            SFA vs PFA Authentication Flows:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>SFA (Single Factor):</strong> Keycloak's default Browser flow asks for Username + Password and yields claim <code>amr: ["pwd"]</code>.<br />
            • <strong>PFA (Step-Up / MFA):</strong> Duplicate Browser flow, add <strong>Conditional OTP</strong> execution, and set Realm LoA Level 2 to require OTP or WebAuthn.
          </Typography>
        </Paper>
      </Box>

      {/* Troubleshooting Grid */}
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Troubleshooting Common Errors
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Alert severity="error" sx={{ borderRadius: 3, height: '100%' }}>
              <AlertTitle fontWeight={700}>CORS / Failed to fetch</AlertTitle>
              <strong>Cause:</strong> Keycloak rejected the browser's preflight OPTIONS call.<br />
              <strong>Fix:</strong> In Keycloak Admin, go to Clients &gt; <code>react-app</code> and set <strong>Web Origins</strong> to <code>*</code>.
            </Alert>
          </Grid>

          <Grid item xs={12} md={4}>
            <Alert severity="warning" sx={{ borderRadius: 3, height: '100%' }}>
              <AlertTitle fontWeight={700}>Invalid scopes: profile email</AlertTitle>
              <strong>Cause:</strong> Client doesn't have <code>profile</code> or <code>email</code> assigned.<br />
              <strong>Fix:</strong> Use scope <code>openid</code> in the app, or in Keycloak add <code>profile</code> and <code>email</code> under Client Scopes.
            </Alert>
          </Grid>

          <Grid item xs={12} md={4}>
            <Alert severity="info" sx={{ borderRadius: 3, height: '100%' }}>
              <AlertTitle fontWeight={700}>Invalid redirect_uri</AlertTitle>
              <strong>Cause:</strong> Callback URL is not in the allowed list.<br />
              <strong>Fix:</strong> Add <code>http://localhost:3000/*</code> to <strong>Valid redirect URIs</strong> in Keycloak client settings.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

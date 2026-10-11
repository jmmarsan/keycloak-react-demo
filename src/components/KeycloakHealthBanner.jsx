import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { testKeycloakConnectivity } from '../services/oidc';

export const KeycloakHealthBanner = ({ config, onOpenGuide }) => {
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

  const severity = !status.tested
    ? 'info'
    : status.reachable
    ? 'success'
    : 'warning';

  return (
    <Alert
      severity={severity}
      icon={
        checking ? (
          <CircularProgress size={20} color="inherit" />
        ) : status.reachable ? (
          <CheckCircleOutlineIcon fontSize="inherit" />
        ) : (
          <WarningAmberIcon fontSize="inherit" />
        )
      }
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            color="inherit"
            startIcon={<RefreshIcon fontSize="small" className={checking ? 'animate-spin' : ''} />}
            onClick={runCheck}
            disabled={checking}
          >
            Test
          </Button>
          {!status.reachable && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<InfoOutlinedIcon fontSize="small" />}
              onClick={onOpenGuide}
            >
              Setup Guide
            </Button>
          )}
        </Box>
      }
      sx={{
        borderRadius: 3,
        alignItems: 'center',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Local Keycloak Status
        </Typography>
        <Chip
          label={`${config.baseUrl}/realms/${config.realm}`}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace', height: 20, fontSize: '0.7rem' }}
        />
      </Box>

      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {checking ? (
          'Probing Keycloak OpenID Connect discovery endpoint...'
        ) : status.reachable ? (
          'Keycloak is reachable on port 8080! Ready to process Single-Factor and Protected-Factor logins.'
        ) : (
          status.error ||
          'Keycloak not detected on port 8080. Start your local container or check Web Origins (CORS).'
        )}
      </Typography>
    </Alert>
  );
};

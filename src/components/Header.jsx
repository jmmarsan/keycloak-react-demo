import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import StorageIcon from '@mui/icons-material/Storage';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export const Header = ({
  session,
  onLogout,
  activeTab,
  onSelectTab,
  config,
  themeMode,
  onToggleTheme,
}) => {
  const theme = useTheme();

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        {/* Brand / Logo */}
        <Box sx={{ display: 'flex', items: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            }}
          >
            <ShieldIcon fontSize="small" />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
                Keycloak SFA &amp; PFA
              </Typography>
              <Chip
                label="Local IdP"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.3 }}>
              OIDC PKCE Authentication Testing Studio
            </Typography>
          </Box>
        </Box>

        {/* Right side controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Target Host Chip */}
          <Chip
            icon={<StorageIcon fontSize="small" />}
            label={config?.baseUrl || 'http://localhost:8080'}
            size="small"
            variant="outlined"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          />

          {/* Current Session Chip */}
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {(() => {
                const isWebAuthn =
                  session.factorSubtype === 'webauthn' ||
                  session.amr?.some((m) => ['webauthn', 'fido', 'passkey', 'hwk'].includes(String(m).toLowerCase())) ||
                  session.user?.username?.toLowerCase().includes('webauthn');
                return (
                  <Chip
                    icon={
                      isWebAuthn ? (
                        <FingerprintIcon fontSize="small" />
                      ) : session.factorLevel === 'pfa' ? (
                        <VerifiedUserIcon fontSize="small" />
                      ) : (
                        <WarningAmberIcon fontSize="small" />
                      )
                    }
                    label={isWebAuthn ? 'PFA: Passkey' : `${session.factorLevel.toUpperCase()} Session`}
                    color={isWebAuthn ? 'info' : session.factorLevel === 'pfa' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                );
              })()}

              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="caption" fontWeight={600} display="block">
                  {session.user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {session.user.roles?.[0] || 'User'}
                </Typography>
              </Box>

              <Tooltip title="Logout / Terminate Session">
                <IconButton
                  size="small"
                  onClick={onLogout}
                  color="error"
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Chip
              label="Not Authenticated"
              size="small"
              variant="outlined"
              sx={{ color: 'text.secondary' }}
            />
          )}

          {/* Dark / Light Mode Toggle Button */}
          <Tooltip title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <Button
              variant="outlined"
              size="small"
              onClick={onToggleTheme}
              startIcon={
                themeMode === 'dark' ? (
                  <LightModeIcon fontSize="small" sx={{ color: '#fbbf24' }} />
                ) : (
                  <DarkModeIcon fontSize="small" sx={{ color: '#6366f1' }} />
                )
              }
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                color: 'text.primary',
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor:
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                {themeMode === 'dark' ? 'Light' : 'Dark'}
              </Box>
            </Button>
          </Tooltip>

          {/* Setup Guide Button */}
          <Button
            variant={activeTab === 'guide' ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            startIcon={<MenuBookIcon />}
            onClick={() => onSelectTab('guide')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Setup Guide
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

import React from 'react';
import { Box, Tabs, Tab, Badge, Container, useTheme } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CodeIcon from '@mui/icons-material/Code';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HistoryIcon from '@mui/icons-material/History';

export const Navigation = ({
  activeTab,
  onSelectTab,
  factorLevel,
  auditCount,
}) => {
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    onSelectTab(newValue);
  };

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.4)'
            : 'rgba(241, 245, 249, 0.6)',
      }}
    >
      <Container maxWidth="lg">
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ minHeight: 48 }}
        >
          <Tab
            value="auth-flows"
            icon={<VpnKeyIcon fontSize="small" />}
            iconPosition="start"
            label="Testing Console"
          />

          <Tab
            value="tokens"
            icon={<CodeIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Token &amp; Session</span>
                {factorLevel !== 'none' && (
                  <Badge
                    badgeContent={factorLevel.toUpperCase()}
                    color={factorLevel === 'pfa' ? 'success' : 'warning'}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />

          <Tab
            value="protected"
            icon={<LockIcon fontSize="small" />}
            iconPosition="start"
            label="Protected Resources"
          />

          <Tab
            value="guide"
            icon={<MenuBookIcon fontSize="small" />}
            iconPosition="start"
            label="Keycloak Setup Guide"
          />

          <Tab
            value="audit"
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>Protocol Logs</span>
                {auditCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.5,
                      px: 0.8,
                      py: 0.2,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      color: 'text.secondary',
                    }}
                  >
                    {auditCount}
                  </Box>
                )}
              </Box>
            }
          />
        </Tabs>
      </Container>
    </Box>
  );
};

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Divider,
  useTheme,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import KeyIcon from '@mui/icons-material/Key';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';

export const ProtectedResourcesScreen = ({
  session,
  onStepUpToPfa,
  onToggleFactorLevel,
  onGoToConsole,
  onLogAudit,
}) => {
  const theme = useTheme();
  const [actionSuccess, setActionSuccess] = useState(null);
  const [deniedAction, setDeniedAction] = useState(null);

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
          <LockIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Protected Resources Gated
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
          Sign in via SFA or PFA on the Testing Console to test how application security policies enforce Level of Assurance (LoA) access control.
        </Typography>
        <Button variant="contained" color="primary" onClick={onGoToConsole}>
          Go to Testing Console
        </Button>
      </Paper>
    );
  }

  const isPfa = session.factorLevel === 'pfa';

  const handleExecuteSensitiveAction = (actionName) => {
    setActionSuccess(null);
    setDeniedAction(null);

    if (!isPfa) {
      setDeniedAction(actionName);
      onLogAudit({
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'RESOURCE_ACCESS_DENIED',
        title: `Access Denied: ${actionName}`,
        detail: `Action requires PFA (LoA 2). Current token only satisfies SFA (acr="${session.acr}", amr=${JSON.stringify(session.amr)})`,
        status: 'warning',
      });
      return;
    }

    setActionSuccess(`Successfully executed: ${actionName}`);
    onLogAudit({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'RESOURCE_ACCESS_ALLOWED',
      title: `Privileged Action Executed: ${actionName}`,
      detail: `Validated high-assurance token (acr="${session.acr}", amr=${JSON.stringify(session.amr)})`,
      status: 'success',
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Policy Status Header */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={800}>
                Resource Access Control Enforcement
              </Typography>
              <Chip
                label={`Current Session: ${session.factorLevel.toUpperCase()}`}
                color={isPfa ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 700 }}>
              Demonstrates how enterprise backends evaluate OIDC assurance claims (<code>acr</code> and <code>amr</code>) to enforce step-up authentication before permitting sensitive operations.
            </Typography>
          </Box>

          {isPfa ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<VerifiedUserIcon fontSize="small" />}
                label="PFA Vault Unlocked"
                color="success"
                sx={{ fontWeight: 700 }}
              />
              {onToggleFactorLevel && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={() => onToggleFactorLevel('sfa')}
                >
                  Test as SFA (Simulate Lock)
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ArrowUpwardIcon />}
                onClick={onStepUpToPfa}
              >
                Elevate to PFA Now
              </Button>
              {onToggleFactorLevel && (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={() => onToggleFactorLevel('pfa')}
                >
                  Simulate PFA (Unlock)
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Denial / Success Alerts */}
      {deniedAction && (
        <Alert
          severity="error"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" variant="contained" onClick={onStepUpToPfa}>
              Trigger Step-Up (PFA)
            </Button>
          }
        >
          <AlertTitle fontWeight={700}>Step-Up Authentication Required</AlertTitle>
          Action <strong>"{deniedAction}"</strong> is protected by policy <code>AAL2_MFA_REQUIRED</code>. Your active token is only <code>SFA (LoA 1)</code>.
        </Alert>
      )}

      {actionSuccess && (
        <Alert severity="success" sx={{ borderRadius: 3 }} onClose={() => setActionSuccess(null)}>
          <AlertTitle fontWeight={700}>Privileged Action Permitted</AlertTitle>
          {actionSuccess}
        </Alert>
      )}

      {/* Two Security Tiers Grid */}
      <Grid container spacing={3}>
        {/* TIER 1: Standard Access (SFA Permitted) */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2.5,
                      backgroundColor: 'warning.light',
                      color: 'warning.dark',
                      display: 'flex',
                    }}
                  >
                    <LockOpenIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Tier 1: Standard Services
                    </Typography>
                    <Typography variant="caption" color="warning.main" fontWeight={600}>
                      Requires SFA (LoA 1)
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Accessible" color="success" size="small" />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Read-only employee services and general dashboards accessible with single-factor password login.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ArticleIcon color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      Internal Company Wiki &amp; Docs
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => setActionSuccess('Viewing internal documents.')}>
                    View
                  </Button>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PeopleIcon color="action" />
                    <Typography variant="body2" fontWeight={600}>
                      Employee Directory &amp; Profile
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => setActionSuccess('Viewing employee directory.')}>
                    View
                  </Button>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* TIER 2: High Security Operations (Strictly Requires PFA) */}
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 3,
              borderColor: isPfa ? 'success.main' : 'divider',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2.5,
                      backgroundColor: isPfa ? 'success.light' : 'error.light',
                      color: isPfa ? 'success.dark' : 'error.dark',
                      display: 'flex',
                    }}
                  >
                    {isPfa ? <VerifiedUserIcon /> : <LockIcon />}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Tier 2: Protected Security Vault
                    </Typography>
                    <Typography variant="caption" color={isPfa ? 'success.main' : 'error.main'} fontWeight={600}>
                      Strictly Demands PFA / MFA (LoA 2)
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  label={isPfa ? 'Unlocked' : 'Locked (Needs Step-Up)'}
                  color={isPfa ? 'success' : 'error'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                High-consequence operations. Any attempt with only single-factor authentication triggers step-up enforcement.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AttachMoneyIcon color="success" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Authorize Wire Transfer ($25,000)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        High-value treasury payment
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant={isPfa ? 'contained' : 'outlined'}
                    color={isPfa ? 'success' : 'inherit'}
                    onClick={() => handleExecuteSensitiveAction('Authorize Wire Transfer ($25,000)')}
                  >
                    Execute
                  </Button>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <KeyIcon color="secondary" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Rotate Production API Keys
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Invalidates existing service credentials
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant={isPfa ? 'contained' : 'outlined'}
                    color={isPfa ? 'secondary' : 'inherit'}
                    onClick={() => handleExecuteSensitiveAction('Rotate Production API Keys')}
                  >
                    Rotate
                  </Button>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DeleteForeverIcon color="error" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Purge Analytics Archive
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Irreversible tenant data deletion
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant={isPfa ? 'contained' : 'outlined'}
                    color={isPfa ? 'error' : 'inherit'}
                    onClick={() => handleExecuteSensitiveAction('Purge Analytics Archive')}
                  >
                    Purge
                  </Button>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

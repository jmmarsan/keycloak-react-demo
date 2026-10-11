import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  ButtonGroup,
  Collapse,
  useTheme,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const AuditLogScreen = ({ logs, onClearLogs }) => {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyPayload = (payload, id) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header & Controls */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" />
              OIDC &amp; Security Protocol Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time trace of cryptographic nonces, Keycloak redirects, PKCE exchanges, and assurance evaluations.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ButtonGroup size="small" variant="outlined">
              {['all', 'success', 'warning', 'error'].map((mode) => (
                <Button
                  key={mode}
                  variant={filter === mode ? 'contained' : 'outlined'}
                  onClick={() => setFilter(mode)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {mode}
                </Button>
              ))}
            </ButtonGroup>

            <Tooltip title="Clear logs">
              <IconButton size="small" color="error" onClick={onClearLogs}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Log list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {filteredLogs.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No audit events found matching the active filter.
            </Typography>
          </Paper>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const StatusIcon =
              log.status === 'success'
                ? CheckCircleOutlineIcon
                : log.status === 'error'
                ? ErrorOutlineIcon
                : log.status === 'warning'
                ? WarningAmberIcon
                : InfoOutlinedIcon;

            const chipColor =
              log.status === 'success'
                ? 'success'
                : log.status === 'error'
                ? 'error'
                : log.status === 'warning'
                ? 'warning'
                : 'info';

            return (
              <Paper
                key={log.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ mt: 0.25 }}>
                      <StatusIcon color={chipColor} fontSize="small" />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {log.title}
                        </Typography>
                        <Chip
                          label={log.type}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', fontFamily: 'monospace' }}
                        />
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                          {log.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {log.detail}
                      </Typography>
                    </Box>
                  </Box>

                  {log.payload && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Copy JSON payload">
                        <IconButton size="small" onClick={() => copyPayload(log.payload, log.id)}>
                          {copiedId === log.id ? <CheckIcon color="success" fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isExpanded ? 'Collapse' : 'Expand payload'}>
                        <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Collapsible payload */}
                {log.payload && (
                  <Collapse in={isExpanded}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        mt: 1.5,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.02)',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                      }}
                    >
                      <pre style={{ margin: 0 }}>{JSON.stringify(log.payload, null, 2)}</pre>
                    </Paper>
                  </Collapse>
                )}
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
};

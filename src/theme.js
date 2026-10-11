import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode = 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#6366f1' : '#4f46e5', // Indigo
        light: '#818cf8',
        dark: '#4338ca',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#06b6d4' : '#0891b2', // Cyan
        light: '#22d3ee',
        dark: '#0e7490',
      },
      success: {
        main: mode === 'dark' ? '#10b981' : '#059669', // Emerald
      },
      warning: {
        main: mode === 'dark' ? '#f59e0b' : '#d97706', // Amber
      },
      error: {
        main: mode === 'dark' ? '#ef4444' : '#dc2626', // Red
      },
      background: {
        default: mode === 'dark' ? '#090d16' : '#f8fafc',
        paper: mode === 'dark' ? '#0f172a' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: 48,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
    },
  });
};

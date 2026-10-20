import { useEffect, useMemo, useState } from 'react';
import { createTheme } from '@mui/material/styles';

// Mesmas cores do CSS (vermelho + branco no claro, vermelho + cinza-escuro no escuro).
const PALETAS = {
  dark: { bg: '#151515', paper: '#1f1f1f', fg: '#f5f5f5', muted: '#a3a3a3', line: '#343434', red: '#e5392d', redHover: '#f04b3f', redTexto: '#ff5f52' },
  light: { bg: '#ffffff', paper: '#ffffff', fg: '#161616', muted: '#5e5e5e', line: '#c9c9c9', red: '#cf2a1f', redHover: '#b01f15', redTexto: '#cf2a1f' },
};
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function criarTema(modo) {
  const c = PALETAS[modo];
  return createTheme({
    palette: { mode: modo, primary: { main: c.red, dark: c.redHover, contrastText: '#ffffff' }, background: { default: c.bg, paper: c.paper }, text: { primary: c.fg, secondary: c.muted }, divider: c.line, error: { main: c.redTexto } },
    shape: { borderRadius: 12 },
    typography: { fontFamily: SANS, button: { textTransform: 'none', fontWeight: 600 } },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 999, minHeight: 48, padding: '8px 22px', fontSize: '.98rem' } } },
      MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: c.bg, '& .MuiOutlinedInput-notchedOutline': { borderColor: c.line } } } },
      MuiInputLabel: { styleOverrides: { root: { '&.Mui-focused': { color: c.redTexto } } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiPaginationItem: { styleOverrides: { root: { minWidth: 40, height: 40, borderRadius: 999 } } },
    },
  });
}

/** Acompanha o data-theme do <html> (mudado pelo botão de tema) e devolve o tema MUI correspondente. */
export function useTemaMui() {
  const ler = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  const [modo, setModo] = useState(ler);
  useEffect(() => {
    const mo = new MutationObserver(() => setModo(ler()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return useMemo(() => criarTema(modo), [modo]);
}

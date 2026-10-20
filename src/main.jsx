import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import App from './App.jsx';
import Estatisticas from './Estatisticas.jsx';
import { useContador } from './contador.js';
import { useTemaMui } from './tema.js';
import './styles.css';

const naPaginaEstatisticas = () => location.hash.replace(/^#\/?/, '').startsWith('estatisticas');

function Raiz() {
  const tema = useTemaMui();
  const [stats, setStats] = useState(naPaginaEstatisticas);
  useEffect(() => { const on = () => setStats(naPaginaEstatisticas()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  useContador(!stats);
  return <ThemeProvider theme={tema}>{stats ? <div className="app"><main><Estatisticas /></main></div> : <App />}</ThemeProvider>;
}

createRoot(document.getElementById('root')).render(<Raiz />);

import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import App from './App.jsx';
import { useTemaMui } from './tema.js';
import './styles.css';

function Raiz() {
  const tema = useTemaMui();
  return <ThemeProvider theme={tema}><App /></ThemeProvider>;
}

createRoot(document.getElementById('root')).render(<Raiz />);

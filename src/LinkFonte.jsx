import { FONTE_URL } from './config.js';

/** Ícone discreto que leva ao painel do SIG/TSE de onde vem a lista mais recente. `alto`: sobrescrito, para colar em uma palavra do texto (ex.: TSE). */
export default function LinkFonte({ alto = false }) {
  return (
    <a className={`icone-link${alto ? ' alto' : ''}`} href={FONTE_URL} target="_blank" rel="noopener noreferrer" aria-label="Abrir a fonte: painel Seções alteradas do SIG/TSE (abre em nova aba)" title="Ver a fonte no painel do SIG/TSE">
      <svg viewBox="0 0 24 24" width={alto ? 11 : 14} height={alto ? 11 : 14} aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H6v11h11v-5h2v7H4V5h1Z" fill="currentColor" /></svg>
    </a>
  );
}

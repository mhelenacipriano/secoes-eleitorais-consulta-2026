import { ANALISE_URL } from './config.js';
import { useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import BuscaSecoes from './BuscaSecoes.jsx';

export default function App() {
  const { dados, erro } = useDados();
  return (
    <div className="app">
      <div className="topbar"><span className="brand">Seções eleitorais · 2026</span><ThemeToggle /></div>
      <main>
        <p className="banner" role="note"><strong>Informação mais recente.</strong> Esta página considera apenas a lista mais recente de seções com local de votação alterado ({dados ? dados.linhas.length.toLocaleString('pt-BR') : '441'} seções; a fonte não informa a data de publicação). As versões anteriores das listas não são usadas aqui — a comparação entre elas está na análise completa.</p>
        <header className="hero estreito">
          <p className="eyebrow">Eleições 2026 · 2º turno</p>
          <h1>Sua seção eleitoral mudou?</h1>
          <p className="sub">Busque por cidade, estado, local de votação, zona ou seção para ver se ela consta na lista mais recente — e onde votava e onde vai votar. Você não precisa preencher tudo: use só o que souber.</p>
          <ol className="passos" aria-label="Como funciona"><li><b>1</b> Busque</li><li><b>2</b> Confira a sua seção</li><li><b>3</b> Confirme no canal oficial</li></ol>
        </header>

        {erro && <p className="erro" role="alert">Não foi possível carregar os dados ({erro.message}). Tente recarregar a página.</p>}
        {dados ? <BuscaSecoes dados={dados} /> : !erro && <div className="skeleton" role="status" aria-label="Carregando"><i /><i /><i /></div>}

        <details className="ajuda estreito">
          <summary>Onde encontro a zona e a seção?</summary>
          <div><p>Estão no seu <strong>título de eleitor</strong> (impresso ou digital) e no aplicativo <strong>e-Título</strong>.</p><p>Se a sua seção não aparece na busca, ela não consta na lista mais recente.</p></div>
        </details>

        <p className="disclaimer" role="note">Esta consulta mostra apenas se a seção aparece na lista mais recente que analisamos. Não é uma fonte oficial: para confirmar o seu local de votação, use os canais da Justiça Eleitoral.</p>
      </main>

      <footer className="foot">
        <p>Quer entender o que mudou nas listas e o que isso pode (ou não) significar?</p>
        <a className="btn primary big" href={ANALISE_URL}>Análise completa →</a>
        <p className="note">Os dados mostram o perfil das listas, não comprovam mudanças no resultado da eleição.</p>
      </footer>
    </div>
  );
}

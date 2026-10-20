import { ANALISE_URL } from './config.js';
import { useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import { useState } from 'react';
import BuscaSecoes from './BuscaSecoes.jsx';
import ConsultaSecao from './ConsultaSecao.jsx';

export default function App() {
  const { dados, erro } = useDados();
  const [externo, setExterno] = useState(null);
  return (
    <div className="app">
      <div className="topbar"><span className="brand">Seções eleitorais · 2026</span><ThemeToggle /></div>
      <main>
        <p className="banner" role="note"><strong>Informação mais recente, mas confirme no e-Título.</strong> Esta página considera apenas a lista mais recente de seções com local de votação alterado ({dados ? dados.linhas.length.toLocaleString('pt-BR') : '441'} seções; a fonte não informa a data de publicação). As versões anteriores não são usadas aqui — a comparação está na análise completa. A lista pode ficar desatualizada, e seções que saíram das listas podem ter mantido, desfeito ou corrigido a mudança: não conseguimos confirmar. Antes de ir votar, confira o seu local no aplicativo <strong>e-Título</strong> ou no Autoatendimento Eleitoral do TSE.</p>
        <header className="hero estreito">
          <p className="eyebrow">Eleições 2026 · 2º turno</p>
          <h1>Sua seção eleitoral mudou?</h1>
          <p className="sub">Encontre a sua seção para ver se ela consta na lista mais recente — e onde votava e onde vai votar — ou explore a lista completa. Você não precisa preencher tudo: use só o que souber.</p>
          <ol className="passos" aria-label="Como funciona"><li><b>1</b> Encontre a sua seção</li><li><b>2</b> Ou explore a lista</li><li><b>3</b> Confirme no canal oficial</li></ol>
        </header>

        {erro && <p className="erro" role="alert">Não foi possível carregar os dados ({erro.message}). Tente recarregar a página.</p>}
        {dados ? (
          <>
            <ConsultaSecao dados={dados} onVerLista={(filtros) => setExterno((x) => ({ n: (x?.n || 0) + 1, filtros }))} />
            <BuscaSecoes dados={dados} externo={externo} />
          </>
        ) : !erro && <div className="skeleton" role="status" aria-label="Carregando"><i /><i /><i /></div>}

        <details className="ajuda">
          <summary>Onde encontro a zona e a seção?</summary>
          <div><p>Estão no seu <strong>título de eleitor</strong> (impresso ou digital) e no aplicativo <strong>e-Título</strong>.</p><p>Se a sua seção não aparece na busca, ela não consta na lista mais recente.</p></div>
        </details>

        <p className="disclaimer" role="note">Esta consulta mostra apenas se a seção aparece na lista mais recente que analisamos. Não é uma fonte oficial e a lista pode estar incompleta ou desatualizada: para confirmar o seu local de votação, use o e-Título, o Autoatendimento Eleitoral do TSE ou o site do TRE do seu estado.</p>
      </main>

      <footer className="foot">
        <p>Quer entender o que mudou nas listas e o que isso pode (ou não) significar?</p>
        <a className="btn primary big" href={ANALISE_URL}>Análise completa →</a>
        <p className="note">Os dados mostram o perfil das listas, não comprovam mudanças no resultado da eleição.</p>
        <p className="legal"><strong>Sobre os dados e este site.</strong> Os dados exibidos são provenientes de listas e resultados divulgados pela Justiça Eleitoral (TSE e TREs); as comparações, os cálculos e a forma de apresentação são de responsabilidade deste projeto. Este é um site independente e sem fins lucrativos, sem anúncios, e não é um canal oficial nem tem vínculo com a Justiça Eleitoral. As informações podem conter erros ou ficar desatualizadas: para confirmar o seu local de votação, use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE.</p>
      </footer>
    </div>
  );
}

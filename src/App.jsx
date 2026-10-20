import { ANALISE_URL, FONTE_URL, MOSTRAR_ANALISE, VERSOES } from './config.js';
import { useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import { useState } from 'react';
import BuscaSecoes from './BuscaSecoes.jsx';
import ConsultaSecao from './ConsultaSecao.jsx';

export default function App() {
  const { dados, erro } = useDados();
  const [externo, setExterno] = useState(null);
  const [avisoAberto, setAvisoAberto] = useState(false);
  return (
    <div className="app">
      <div className="topbar"><span className="brand">Seções eleitorais · 2026</span><ThemeToggle /></div>
      <main>
        <aside className={`banner${avisoAberto ? ' aberto' : ''}`} role="note" aria-label="Avisos importantes">
          <p className="banner-tit"><strong>Este não é um site oficial. Confirmar o seu local de votação no e-Título é de extrema importância.</strong></p>
          <p className="banner-resumo">Esta busca usa apenas a versão mais recente divulgada pelo TSE ({dados ? dados.linhas.length.toLocaleString('pt-BR') : '441'} seções).</p>
          <div className="banner-det" id="aviso-detalhes">
            <p>Foram divulgadas três listas datadas de seções com local de votação alterado: {VERSOES.map((v, i) => <span key={v.quando}>{i > 0 && (i === VERSOES.length - 1 ? ' e ' : ', ')}{v.quando} ({v.secoes.toLocaleString('pt-BR')} seções)</span>)}. Esta busca considera apenas a versão mais recente, disponível no site original do TSE (<a href={FONTE_URL} target="_blank" rel="noopener noreferrer">painel Seções alteradas do SIG/TSE</a>) — {dados ? dados.linhas.length.toLocaleString('pt-BR') : '441'} seções, com data de publicação não informada na fonte. As listas anteriores não são usadas aqui{MOSTRAR_ANALISE ? ' (a comparação está na análise completa)' : ''}.</p>
            <p>A lista pode ficar desatualizada, e seções que saíram das listas podem ter mantido, desfeito ou corrigido a mudança: não conseguimos confirmar. Antes de ir votar, confira o seu local no aplicativo <strong>e-Título</strong> ou no Autoatendimento Eleitoral do TSE.</p>
          </div>
          <button type="button" className="banner-toggle" aria-expanded={avisoAberto} aria-controls="aviso-detalhes" onClick={() => setAvisoAberto((x) => !x)}>{avisoAberto ? 'Ocultar detalhes' : 'Ver detalhes e fonte'}</button>
        </aside>
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

      </main>

      <footer className="foot">
        {MOSTRAR_ANALISE && (
          <div className="cta-analise">
            <p className="foot-cta">Quer entender o que mudou nas listas do TSE?</p>
            <p className="cta-texto">O TSE divulgou três listas com as seções eleitorais cujo local de votação mudou para o 2º turno. Na análise completa, fazemos um panorama geral desses dados: quantas seções saíram e entraram em cada lista e como elas votaram no 1º turno.</p>
            <a className="btn primary big" href={ANALISE_URL}>Análise completa →</a>
            <p className="note">É um retrato dos dados, não uma prova de que o resultado da eleição mudou.</p>
          </div>
        )}
        <p className="legal"><strong>Sobre os dados e este site.</strong> Os dados exibidos são provenientes de listas divulgadas pela Justiça Eleitoral; a lista mais recente usada nesta busca vem do <a href={FONTE_URL} target="_blank" rel="noopener noreferrer">painel Seções alteradas do SIG/TSE</a>. As comparações, os cálculos e a forma de apresentação são de responsabilidade deste projeto. Este é um site independente e sem fins lucrativos, sem anúncios, e não é um canal oficial nem tem vínculo com a Justiça Eleitoral. As informações podem conter erros ou ficar desatualizadas: para confirmar o seu local de votação, use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE.</p>
      </footer>
    </div>
  );
}

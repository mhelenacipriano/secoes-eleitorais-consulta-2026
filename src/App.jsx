import { ANALISE_URL, MOSTRAR_ANALISE } from './config.js';
import { quando } from './datas.js';
import LinkFonte from './LinkFonte.jsx';
import AvisoTse from './AvisoTse.jsx';
import { useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import { useState } from 'react';
import BuscaSecoes from './BuscaSecoes.jsx';
import Curtida from './Curtida.jsx';
import ConsultaSecao from './ConsultaSecao.jsx';
import MapaEstados from './MapaEstados.jsx';

export default function App() {
  const { dados, erro } = useDados();
  const [externo, setExterno] = useState(null);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const hist = dados ? dados.historico : [];                      // uma linha por lista (rótulo, seções), a última é a usada na busca
  const ult = hist.length ? hist[hist.length - 1] : { rotulo: '', secoes: 0 };
  const [ufSel, setUfSel] = useState('');
  const [forcarUf, setForcarUf] = useState(null);
  // clique no mapa: preenche o campo Estado da consulta e leva à lista completa já filtrada (desmarcar só limpa)
  const escolherUf = (uf) => { setForcarUf((x) => ({ n: (x?.n || 0) + 1, uf })); setExterno((x) => ({ n: (x?.n || 0) + 1, filtros: { uf }, semRolar: !uf, semDestaque: true })); };
  return (
    <div className="app">
      <div className="topbar"><span className="brand">Seções eleitorais · 2026</span><ThemeToggle /></div>
      <main>
        <AvisoTse meta={dados && dados.meta} />
        <aside className={`banner${avisoAberto ? ' aberto' : ''}`} role="note" aria-label="Avisos importantes">
          <p className="banner-tit"><strong>Este não é um site oficial. Confirmar o seu local de votação no e-Título é de extrema importância.</strong></p>
          <p className="banner-resumo">Esta busca usa apenas a lista mais recente divulgada pelo TSE {dados ? <>(de {quando(ult.rotulo)} · {dados.linhas.length.toLocaleString('pt-BR')} seções)</> : ''}.</p>
          <div className="banner-det" id="aviso-detalhes"><div className="banner-det-in">
            <p>Foram divulgadas várias listas datadas de seções com local de votação alterado: {hist.map((v, i) => <span key={v.rotulo}>{i > 0 && (i === hist.length - 1 ? ' e ' : ', ')}{quando(v.rotulo)} ({v.secoes.toLocaleString('pt-BR')} seções)</span>)}. Esta busca considera apenas a mais recente, a de {quando(ult.rotulo)}, disponível no site original do <span className="cola">TSE<LinkFonte alto /></span> — {dados ? dados.linhas.length.toLocaleString('pt-BR') : ''} seções. As listas anteriores não são usadas aqui{MOSTRAR_ANALISE ? ' (a comparação está na análise completa)' : ''}.</p>
            <p>A lista pode ficar desatualizada, e seções que saíram das listas podem ter mantido, desfeito ou corrigido a mudança: não conseguimos confirmar. Antes de ir votar, confira o seu local no aplicativo <strong>e-Título</strong> ou no Autoatendimento Eleitoral do TSE.</p>
          </div></div>
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
            <ConsultaSecao dados={dados} onVerLista={(filtros) => setExterno((x) => ({ n: (x?.n || 0) + 1, filtros }))} forcarUf={forcarUf} onUf={setUfSel} />
            <MapaEstados dados={dados} uf={ufSel} onEscolher={escolherUf} />
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
            <p className="cta-texto">O TSE divulgou várias listas com as seções eleitorais cujo local de votação mudou para o 2º turno. Na análise completa, fazemos um panorama geral desses dados: quantas seções saíram e entraram em cada lista e como essas mudanças estão relacionadas aos resultados do primeiro turno de votação.</p>
            <a className="btn primary big" href={ANALISE_URL}>Análise completa <span className="seta-cta" aria-hidden="true">→</span></a>
            <p className="note">É um retrato dos dados, não uma prova de que o resultado da eleição mudou.</p>
          </div>
        )}
        <p className="legal"><strong>Sobre os dados e este site.</strong> Os dados exibidos são provenientes de listas divulgadas pela Justiça Eleitoral; a lista mais recente usada nesta busca vem do painel Seções alteradas do SIG/<span className="cola">TSE<LinkFonte alto />.</span> As comparações, os cálculos e a forma de apresentação são de responsabilidade deste projeto. Este é um site independente e sem fins lucrativos, sem anúncios, e não é um canal oficial nem tem vínculo com a Justiça Eleitoral. As informações podem conter erros ou ficar desatualizadas: para confirmar o seu local de votação, use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE.</p>
      </footer>
      <Curtida />
    </div>
  );
}

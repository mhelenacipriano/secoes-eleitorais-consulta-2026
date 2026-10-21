import { useEffect, useMemo, useState } from 'react';
import { TEXTO_CURTIDA } from './config.js';

// Os dois marcadores ficam só na sessão (sessionStorage): somem ao fechar a aba ou o navegador e a estrela volta a chamar a atenção.
const FLAG = 'curtiu-o-site';          // já curtiu nesta sessão (o total do servidor só conta a primeira vez)
const FLAG_VIU = 'curtida-interagiu';  // já clicou ou tocou na estrela: a dica "clica aqui!" e o pulinho não voltam mais
const ler = (k) => { try { return sessionStorage.getItem(k) === '1'; } catch { return false; } };
const gravar = (k) => { try { sessionStorage.setItem(k, '1'); } catch { /* sem armazenamento: só vale nesta visita */ } };
const PRIMEIRO_PULO_MS = 3000, INTERVALO_MS = 8000, DURACAO_PULO_MS = 900, DURACAO_CHUVA_MS = 5200, N_ESTRELAS = 46;
const ESTRELA = '12,2.6 14.9,8.9 21.8,9.6 16.6,14.2 18.1,21 12,17.5 5.9,21 7.4,14.2 2.2,9.6 9.1,8.9';

/** Chuva de estrelinhas vermelhas que cai sobre o conteúdo (some sozinha; não captura cliques). */
function Chuva({ rodada }) {
  const estrelas = useMemo(() => Array.from({ length: N_ESTRELAS }, (_, i) => ({
    i, x: Math.random() * 100, tam: 12 + Math.random() * 20, atraso: Math.random() * 1.1, dur: 2.3 + Math.random() * 1.7,
    dx: (Math.random() - 0.5) * 120, rot: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360), cheia: Math.random() < 0.8,
  })), [rodada]);
  return (
    <div className="chuva" aria-hidden="true">
      {estrelas.map((e) => (
        <svg key={`${rodada}-${e.i}`} className="chuva-estrela" viewBox="0 0 24 24" style={{ left: `${e.x}%`, width: e.tam, height: e.tam, '--dx': `${e.dx}px`, '--rot': `${e.rot}deg`, animationDelay: `${e.atraso}s`, animationDuration: `${e.dur}s` }}>
          <polygon points={ESTRELA} fill={e.cheia ? 'var(--red-solid)' : 'none'} stroke="var(--red-solid)" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Botão de curtida no canto da tela (a curtida e a dica valem só enquanto a aba estiver aberta). Antes da primeira interação: a estrela dá um pulinho a cada ~8 s e uma dica escrita à mão
 * ("clica aqui!" com uma setinha) chama a atenção. Ao clicar (ou tocar), a dica e o pulinho param para sempre e cai uma chuva de estrelas.
 * O total de curtidas não é público (só aparece na página de estatísticas).
 */
export default function Curtida() {
  const [ativo, setAtivo] = useState(false);       // false = contador indisponível (o botão não aparece)
  const [curtiu, setCurtiu] = useState(() => ler(FLAG));   // já curtiu nesta sessão
  const [agora, setAgora] = useState(false);               // controla a animação de cada clique
  const [viu, setViu] = useState(() => ler(FLAG_VIU) || ler(FLAG));
  const [pulo, setPulo] = useState(false);
  const [chuva, setChuva] = useState(0);           // 0 = sem chuva; senão, o número da rodada

  useEffect(() => {
    let vivo = true;
    fetch('/api/curtidas').then((r) => (r.ok ? r.json() : null)).then((j) => { if (vivo && j && j.ativo === true) setAtivo(true); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  // pulinho periódico até a primeira interação (só com a aba visível)
  useEffect(() => {
    if (!ativo || viu) return undefined;
    let t2, iv;
    const pula = () => { if (document.visibilityState !== 'visible') return; setPulo(true); t2 = setTimeout(() => setPulo(false), DURACAO_PULO_MS); };
    // primeiro pulo depois de ~3 s; os seguintes a cada ~8 s (contados a partir do primeiro)
    const t0 = setTimeout(() => { pula(); iv = setInterval(pula, INTERVALO_MS); }, PRIMEIRO_PULO_MS);
    return () => { clearTimeout(t0); clearInterval(iv); clearTimeout(t2); setPulo(false); };
  }, [ativo, viu]);

  useEffect(() => {
    if (!chuva) return undefined;
    const t = setTimeout(() => setChuva(0), DURACAO_CHUVA_MS);
    return () => clearTimeout(t);
  }, [chuva]);

  if (!ativo) return null;

  const interagiu = () => { if (!viu) { setViu(true); gravar(FLAG_VIU); } };
  const clicar = () => {
    interagiu();
    // dá para clicar quantas vezes quiser: a animação e a chuva rodam de novo, mas o total do servidor só conta a primeira vez da sessão
    setAgora(false); requestAnimationFrame(() => requestAnimationFrame(() => setAgora(true)));
    setChuva((n) => n + 1);
    if (!curtiu) { setCurtiu(true); gravar(FLAG); fetch('/api/curtidas', { method: 'POST' }).catch(() => {}); }
  };
  return (
    <>
      {chuva > 0 && <Chuva rodada={chuva} />}
      <button type="button" className={`curtida${curtiu ? ' curtiu' : ''}${agora ? ' sobe' : ''}${pulo ? ' pulo' : ''}`} onClick={clicar} onPointerDown={interagiu} aria-pressed={curtiu}
        aria-label={curtiu ? 'Você curtiu este site' : 'Curtir este site'}>
        <span className="estrela" aria-hidden="true">
          <svg viewBox="0 0 24 24"><polygon className="contorno" points={ESTRELA} /></svg>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <i className="faisca" style={{ '--a': `${a}deg` }} key={a} />)}
        </span>
        {viu
          ? <span className="texto"><span className="frase">{TEXTO_CURTIDA}</span></span>
          : (
            <span className="dica-escrita" aria-hidden="true">
              <span className="dica-texto">clica aqui!</span>
              <svg viewBox="0 0 34 36" className="seta"><path d="M3 5 C 21 1, 17 13, 17 28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M10 21 L17 30 L24 21" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
        <span className="balao" aria-hidden="true">valeu! ❤</span>
      </button>
    </>
  );
}

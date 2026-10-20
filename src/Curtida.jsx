import { useEffect, useState } from 'react';
import { TEXTO_CURTIDA } from './config.js';

const FLAG = 'curtiu-o-site';
const lerFlag = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
const gravarFlag = () => { try { localStorage.setItem(FLAG, '1'); } catch { /* sem armazenamento: só vale nesta visita */ } };

/** Botão de curtida no canto da tela: estrela só com contorno que se preenche ao clicar. O total não é público (só aparece na página de estatísticas). */
export default function Curtida() {
  const [ativo, setAtivo] = useState(false);       // false = contador indisponível (o botão não aparece)
  const [jaCurtiu] = useState(lerFlag);            // curtiu em uma visita anterior (o total do servidor já inclui)
  const [agora, setAgora] = useState(false);       // curtiu nesta visita

  useEffect(() => {
    let vivo = true;
    fetch('/api/curtidas').then((r) => (r.ok ? r.json() : null)).then((j) => { if (vivo && j && j.ativo === true) setAtivo(true); }).catch(() => {});
    return () => { vivo = false; };
  }, []);
  if (!ativo) return null;

  const curtiu = jaCurtiu || agora;
  const clicar = () => {
    if (curtiu) return;
    setAgora(true); gravarFlag();
    fetch('/api/curtidas', { method: 'POST' }).catch(() => {});
  };
  return (
    <button type="button" className={`curtida${curtiu ? ' curtiu' : ''}${agora ? ' sobe' : ''}`} onClick={clicar} aria-pressed={curtiu}
      aria-label={curtiu ? 'Você curtiu este site' : 'Curtir este site'}>
      <span className="estrela" aria-hidden="true">
        <svg viewBox="0 0 24 24"><polygon className="contorno" points="12,2.6 14.9,8.9 21.8,9.6 16.6,14.2 18.1,21 12,17.5 5.9,21 7.4,14.2 2.2,9.6 9.1,8.9" /></svg>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <i className="faisca" style={{ '--a': `${a}deg` }} key={a} />)}
      </span>
      <span className="texto"><span className="frase">{TEXTO_CURTIDA}</span></span>
      <span className="balao" aria-hidden="true">valeu! ❤</span>
    </button>
  );
}

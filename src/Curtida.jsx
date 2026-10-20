import { useEffect, useState } from 'react';

const FLAG = 'curtiu-o-site';
const lerFlag = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
const gravarFlag = () => { try { localStorage.setItem(FLAG, '1'); } catch { /* sem armazenamento: só vale nesta visita */ } };
const pt = (n) => Number(n).toLocaleString('pt-BR');

/** Botão de curtida no canto da tela: coração só com contorno que se preenche ao clicar e soma ao contador. */
export default function Curtida() {
  const [total, setTotal] = useState(null);       // null = contador indisponível (o botão não aparece)
  const [jaCurtiu] = useState(lerFlag);            // curtiu em uma visita anterior (o total do servidor já inclui)
  const [agora, setAgora] = useState(false);       // curtiu nesta visita

  useEffect(() => {
    let vivo = true;
    fetch('/api/curtidas').then((r) => (r.ok ? r.json() : null)).then((j) => { if (vivo && j && typeof j.total === 'number') setTotal(j.total); }).catch(() => {});
    return () => { vivo = false; };
  }, []);
  if (total === null) return null;

  const curtiu = jaCurtiu || agora;
  const clicar = () => {
    if (curtiu) return;
    setAgora(true); gravarFlag();
    fetch('/api/curtidas', { method: 'POST' }).catch(() => {});
  };
  const antes = pt(total), depois = pt(total + 1);
  return (
    <button type="button" className={`curtida${curtiu ? ' curtiu' : ''}${agora ? ' sobe' : ''}`} onClick={clicar} aria-pressed={curtiu}
      aria-label={curtiu ? `Você curtiu este site. Curtidas: ${agora ? depois : antes}` : `Curtir este site. Curtidas: ${antes}`}>
      <span className="coracao" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path className="contorno" d="M12 20.5s-7.7-4.7-9.7-9.5C.9 7.6 2.8 4 6.4 4c2.3 0 4 1.3 5.6 3.4C13.6 5.3 15.3 4 17.6 4c3.6 0 5.5 3.6 4.1 7-2 4.8-9.7 9.5-9.7 9.5z" /></svg>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <i className="faisca" style={{ '--a': `${a}deg` }} key={a} />)}
      </span>
      <span className="num" aria-hidden="true"><span className="velho">{antes}</span><span className="novo">{depois}</span></span>
    </button>
  );
}

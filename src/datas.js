// Datas no horário de Brasília e a próxima atualização prevista do painel do TSE (06:25, 11:25, 15:25 e 20:25).
const dois = (n) => String(n).padStart(2, '0');
/** ISO → "20.10.2026 - 15:27" (horário de Brasília, como o site do TSE) */
export const dataTse = (iso) => {
  if (!iso) return '';
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('day')}.${g('month')}.${g('year')} - ${g('hour')}:${g('minute')}`;
};
/** ISO → "20/10 às 17h46" */
export const dataHora = (iso) => {
  if (!iso) return '';
  const p = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('day')}/${g('month')} às ${g('hour')}h${g('minute') === '00' ? '' : g('minute')}`;
};

// Horários de atualização do painel do TSE (informados no próprio site), em Brasília.
export const HORARIOS_TSE = ['06:25', '11:25', '15:25', '20:25'];
/** Próxima atualização prevista depois de `iso`: { texto, iso } */
export const proximaAtualizacao = (iso) => {
  const base = new Date(iso);
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  for (let d = 0; d < 3; d++) {
    const dia = f.format(new Date(base.getTime() + d * 86400000));
    for (const h of HORARIOS_TSE) { const t = new Date(`${dia}T${h}:00-03:00`); if (t > base) return { iso: t.toISOString(), texto: dataTse(t.toISOString()) }; }
  }
  return { iso: '', texto: '' };
};
/** "20/10 · 15h27" → "20/10 às 15h27" */
export const quando = (label) => String(label || '').replace(' · ', ' às ');

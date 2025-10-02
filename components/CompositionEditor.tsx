import React from 'react';

export type Row = { ingredient: string; cas: string; percent: string };

export default function CompositionEditor({ rows, onChange }: { rows: Row[]; onChange: (r: Row[]) => void }) {
  function update(i: number, patch: Partial<Row>) {
    const next = [...rows];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add() { onChange([...(rows||[]), { ingredient: '', cas: '', percent: '' }]); }
  function del(i: number) { const next = [...rows]; next.splice(i,1); onChange(next); }

  return (
    <div className="space-y-3">
      {(rows||[]).map((r,i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <label className="label">Ingredient</label>
            <input className="input" value={r.ingredient} onChange={e=>update(i,{ingredient:e.target.value})} placeholder="Polydimethylsiloxane" />
          </div>
          <div className="col-span-3">
            <label className="label">CAS</label>
            <input className="input" value={r.cas} onChange={e=>update(i,{cas:e.target.value})} placeholder="63148-62-9" />
          </div>
          <div className="col-span-3">
            <label className="label">Percent</label>
            <input className="input" value={r.percent} onChange={e=>update(i,{percent:e.target.value})} placeholder="1–3%" />
          </div>
          <div className="col-span-1 text-right">
            <button className="btn-outline px-3 py-2 rounded-lg" onClick={()=>del(i)}>Delete</button>
          </div>
        </div>
      ))}
      <button className="btn-secondary px-3 py-2 rounded-lg" onClick={add}>Add row</button>
    </div>
  );
}

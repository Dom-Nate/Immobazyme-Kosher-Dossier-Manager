import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import CompositionEditor, { Row } from '../components/CompositionEditor';
import dynamic from 'next/dynamic';

const UploadRow = dynamic(()=>import('../components/UploadRow'), { ssr: false });

export type DossierRow = {
  id: string;
  org_id: string;
  owner: string;
  name: string;
  cas_number: string | null;
  tds_notes: string | null;
  composition_notes: string | null;
  composition_rows: Row[];
  manufacturing_flowchart: string | null;
  shared_equipment_notes: string | null;
  allergens_pesach_notes: string | null;
  change_control_notes: string | null;
  use_point_notes: string | null;
  contact_conditions: string | null;
  fate_removal_notes: string | null;
  equipment_temperatures: string | null;
  campaigning_segregation: string | null;
  cleaning_validation: string | null;
  sds_path: string | null;
  sds_name: string | null;
  coa_path: string | null;
  coa_name: string | null;
  created_at: string;
  updated_at: string;
};

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID as string;

export default function Home() {
  const { user, loading } = useAuth();
  const [list, setList] = useState<DossierRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const current = useMemo(() => list.find(x => x.id === currentId) || null, [list, currentId]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('org_id', ORG_ID)
        .order('updated_at', { ascending: false });
      if (error) console.error(error);
      setList((data as any) || []);
      if (data && data.length && !currentId) setCurrentId(data[0].id);
    })();
  }, [user]);

  if (loading) return <Shell><div>Loading…</div></Shell>;
  if (!user) return <AuthScreen />;

  async function createDossier() {
    const name = prompt('Name of chemical?', 'New Chemical') || 'New Chemical';
    const { data, error } = await supabase.from('dossiers').insert({
      id: crypto.randomUUID(), org_id: ORG_ID, owner: user.id, name,
      composition_rows: [],
    }).select();
    if (error) return alert(error.message);
    setList(prev => [data![0] as any, ...prev]);
    setCurrentId((data![0] as any).id);
  }

  async function update(patch: Partial<DossierRow>) {
    if (!current) return;
    const { data, error } = await supabase
      .from('dossiers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select();
    if (error) return alert(error.message);
    const next = data![0] as DossierRow;
    setList(prev => prev.map(d => d.id === next.id ? next : d));
  }

  async function remove() {
    if (!current) return;
    if (!confirm('Delete this dossier?')) return;
    if (current.sds_path) await supabase.storage.from('files').remove([current.sds_path]);
    if (current.coa_path) await supabase.storage.from('files').remove([current.coa_path]);
    const { error } = await supabase.from('dossiers').delete().eq('id', current.id);
    if (error) return alert(error.message);
    setList(prev => prev.filter(d => d.id !== current.id));
    setCurrentId(list[0]?.id || null);
  }

  return (
    <Shell>
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-semibold">Dossiers</h1>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={createDossier}>New</button>
                <button className="btn-outline" onClick={() => supabase.auth.signOut()}>Sign out</button>
              </div>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {list.map(d => (
                <div key={d.id} className={`card cursor-pointer ${currentId===d.id?'ring-2 ring-black':''}`} onClick={()=>setCurrentId(d.id)}>
                  <div className="text-base font-medium">{d.name}</div>
                  <div className="text-xs text-gray-500">CAS: {d.cas_number || '—'}</div>
                  <div className="text-xs text-gray-500">Updated: {new Date(d.updated_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-8 space-y-4">
          {current ? (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input className="input text-xl font-semibold" value={current.name} onChange={e=>update({ name: e.target.value })} />
                    <div className="text-sm text-gray-500">ID: {current.id.slice(0,8)}…</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={remove}>Delete</button>
                  </div>
                </div>
              </div>

              <div className="card grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <label className="label">Primary CAS Number</label>
                  <input className="input" value={current.cas_number || ''} onChange={e=>update({ cas_number: e.target.value })} placeholder="63148-62-9" />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="label">Internal Notes / Alias</label>
                  <input className="input" value={current.tds_notes || ''} onChange={e=>update({ tds_notes: e.target.value })} placeholder="Catalogue code, vendor SKU, etc." />
                </div>
              </div>

              <div className="card">
                <div className="section-title">Product identity pack</div>
                <UploadRow label="SDS" orgId={ORG_ID} dossierId={current.id} currentName={current.sds_name} currentPath={current.sds_path} onUploaded={({name,path})=>update({ sds_name: name, sds_path: path })} />
                <div className="my-2 border-t" />
                <UploadRow label="CoA" orgId={ORG_ID} dossierId={current.id} currentName={current.coa_name} currentPath={current.coa_path} onUploaded={({name,path})=>update({ coa_name: name, coa_path: path })} />
              </div>

              <div className="card space-y-3">
                <div className="section-title">Qualitative & quantitative composition</div>
                <label className="label">General notes</label>
                <textarea className="input h-28" value={current.composition_notes || ''} onChange={e=>update({ composition_notes: e.target.value })} placeholder="Exact component list with CAS and % ranges; origin statements; absence of animal-derived inputs." />
                <CompositionEditor rows={(current.composition_rows || []) as Row[]} onChange={(rows)=>update({ composition_rows: rows as any })} />
              </div>

              <div className="card grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <div className="section-title">Manufacturing flowchart & controls</div>
                </div>
                <div className="col-span-12">
                  <label className="label">Flowchart & unit operations</label>
                  <textarea className="input h-24" value={current.manufacturing_flowchart || ''} onChange={e=>update({ manufacturing_flowchart: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Shared equipment / line use</label>
                  <textarea className="input h-24" value={current.shared_equipment_notes || ''} onChange={e=>update({ shared_equipment_notes: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Allergens & Pesach status</label>
                  <textarea className="input h-24" value={current.allergens_pesach_notes || ''} onChange={e=>update({ allergens_pesach_notes: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Change-control commitment</label>
                  <textarea className="input h-24" value={current.change_control_notes || ''} onChange={e=>update({ change_control_notes: e.target.value })} />
                </div>
              </div>

              <div className="card grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <div className="section-title">Your process usage</div>
                </div>
                <div className="col-span-12">
                  <label className="label">Use point(s)</label>
                  <textarea className="input h-24" value={current.use_point_notes || ''} onChange={e=>update({ use_point_notes: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Contact conditions</label>
                  <textarea className="input h-24" value={current.contact_conditions || ''} onChange={e=>update({ contact_conditions: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Fate & removal</label>
                  <textarea className="input h-24" value={current.fate_removal_notes || ''} onChange={e=>update({ fate_removal_notes: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Equipment & temperatures</label>
                  <textarea className="input h-24" value={current.equipment_temperatures || ''} onChange={e=>update({ equipment_temperatures: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Campaigning & segregation</label>
                  <textarea className="input h-24" value={current.campaigning_segregation || ''} onChange={e=>update({ campaigning_segregation: e.target.value })} />
                </div>
                <div className="col-span-12">
                  <label className="label">Cleaning validation</label>
                  <textarea className="input h-24" value={current.cleaning_validation || ''} onChange={e=>update({ cleaning_validation: e.target.value })} />
                </div>
              </div>
            </div>
          ) : (
            <div className="card">No dossiers yet. Click <b>New</b> to create your first dossier.</div>
          )}
        </main>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="container py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Immobazyme — Dossier Manager</div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}

function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user || null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); });
    return () => { sub?.subscription.unsubscribe(); };
  }, []);
  return { user, loading } as const;
}

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  async function send() {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    if (error) return alert(error.message);
    setSent(true);
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <div className="text-xl font-semibold mb-3">Sign in</div>
        <label className="label">Work email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@immobazyme.com" />
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={send}>Send magic link</button>
        </div>
        {sent && <div className="text-sm text-gray-500 mt-2">Check your inbox for the sign-in link.</div>}
      </div>
    </div>
  );
}

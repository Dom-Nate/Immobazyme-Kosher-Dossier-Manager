import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Row = { ingredient: string; cas: string; percent: string };
export type DossierRow = {
  id: string; org_id: string; owner: string; name: string; cas_number: string|null;
  tds_notes: string|null; composition_notes: string|null; composition_rows: Row[];
  manufacturing_flowchart: string|null; shared_equipment_notes: string|null;
  allergens_pesach_notes: string|null; change_control_notes: string|null;
  use_point_notes: string|null; contact_conditions: string|null; fate_removal_notes: string|null;
  equipment_temperatures: string|null; campaigning_segregation: string|null; cleaning_validation: string|null;
  sds_path: string|null; sds_name: string|null; coa_path: string|null; coa_name: string|null;
  created_at: string; updated_at: string;
};

const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || '00000000-0000-0000-0000-000000000000';

export default function Home(){
  const { user, loading } = useAuth();
  const [list, setList] = useState<DossierRow[]>([]);
  const [currentId, setCurrentId] = useState<string|null>(null);

  const current = useMemo(()=> list.find(x=>x.id===currentId)||null, [list,currentId]);

  // Runtime guard: if envs are not set, render instructions instead of crashing.
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL||'').includes('placeholder')) {
    return <Shell>
      <div style={{background:'#fff',padding:20,borderRadius:12,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <h2>Environment not configured</h2>
        <p>Set <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code>NEXT_PUBLIC_ORG_ID</code> in Vercel → Project Settings → Environment Variables, then redeploy.</p>
      </div>
    </Shell>;
  }

  useEffect(()=>{
    if(!user) return;
    (async()=>{
      const { data, error } = await supabase.from('dossiers').select('*').eq('org_id', ORG_ID).order('updated_at',{ascending:false});
      if(error) console.error(error);
      setList((data as any)||[]);
      if(data && data.length && !currentId) setCurrentId(data[0].id);
    })();
  }, [user]);

  if(loading) return <Shell><div>Loading…</div></Shell>;
  if(!user) return <AuthScreen/>;

  async function createDossier(){
    const name = 'New Chemical';
    const { data, error } = await supabase.from('dossiers').insert({ id: crypto.randomUUID(), org_id: ORG_ID, owner: user.id, name, composition_rows: [] }).select();
    if(error) return alert(error.message);
    setList(prev=>[data![0] as any,...prev]); setCurrentId((data![0] as any).id);
  }

  async function update(patch: Partial<DossierRow>){
    if(!current) return;
    const { data, error } = await supabase.from('dossiers').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', current.id).select();
    if(error) return alert(error.message);
    const next = data![0] as DossierRow;
    setList(prev=>prev.map(d=>d.id===next.id?next:d));
  }

  async function remove(){
    if(!current) return;
    if(!confirm('Delete this dossier?')) return;
    if(current.sds_path) await supabase.storage.from('files').remove([current.sds_path]);
    if(current.coa_path) await supabase.storage.from('files').remove([current.coa_path]);
    const { error } = await supabase.from('dossiers').delete().eq('id', current.id);
    if(error) return alert(error.message);
    setList(prev=>prev.filter(d=>d.id!==current.id)); setCurrentId(list[0]?.id||null);
  }

  return <Shell>
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1>Immobazyme — Dossier Manager</h1>
        <div>
          <button onClick={createDossier}>New</button>
          <button onClick={()=>supabase.auth.signOut()} style={{marginLeft:8}}>Sign out</button>
        </div>
      </div>
      <div>
        {current ? (
          <div>
            <input value={current.name} onChange={e=>update({name:e.target.value})}/>
            <button onClick={remove} style={{marginLeft:8}}>Delete</button>
          </div>
        ) : <div>No dossiers yet. Click New to create your first dossier.</div>}
      </div>
    </div>
  </Shell>;
}

function Shell({children}:{children:React.ReactNode}){ return <div style={{padding:24}}>{children}</div>; }

function useAuth(){
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{ setUser(data.user||null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session)=>{ setUser(session?.user || null); });
    return ()=>{ sub?.subscription.unsubscribe(); };
  },[]);
  return { user, loading } as const;
}
function AuthScreen(){
  const [email,setEmail]=useState(''); const [sent,setSent]=useState(false);
  async function send(){ const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.href } }); if(error) return alert(error.message); setSent(true); }
  return <div><h2>Sign in</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@immobazyme.com"/><button onClick={send}>Send magic link</button>{sent&&<div>Check your inbox.</div>}</div>;
}

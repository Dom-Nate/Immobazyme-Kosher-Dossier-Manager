import React, { useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UploadRow({
  label,
  orgId,
  dossierId,
  currentName,
  currentPath,
  onUploaded,
}: {
  label: 'SDS' | 'CoA';
  orgId: string;
  dossierId: string;
  currentName?: string | null;
  currentPath?: string | null;
  onUploaded: (info: { name: string; path: string }) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  async function upload(file: File) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${orgId}/dossiers/${dossierId}/${label.toLowerCase()}_${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from('files').upload(key, file, { upsert: true });
    if (error) return alert('Upload failed: ' + error.message);
    onUploaded({ name: file.name, path: key });
  }

  async function download() {
    if (!currentPath) return;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(currentPath, 60);
    if (error || !data?.signedUrl) return alert('Could not get download link');
    const a = document.createElement('a');
    a.href = data.signedUrl; a.download = currentName || label; a.click();
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-sm">{currentName || <span className="text-gray-400">No file uploaded</span>}</div>
      </div>
      <div className="flex gap-2">
        <input ref={ref} type="file" className="hidden" onChange={e=> e.target.files && upload(e.target.files[0]) } />
        <button className="btn-secondary" onClick={()=>ref.current?.click()}>Upload</button>
        {currentPath && <button className="btn-outline" onClick={download}>Download</button>}
      </div>
    </div>
  );
}

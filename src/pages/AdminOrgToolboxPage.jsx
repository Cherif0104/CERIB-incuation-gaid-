import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const TYPE_OPTIONS = [
  { value: '', label: '— Type —' },
  { value: 'pdf', label: 'PDF' },
  { value: 'word', label: 'Word' },
  { value: 'excel', label: 'Excel' },
  { value: 'link', label: 'Lien' },
  { value: 'other', label: 'Autre' },
];

function AdminOrgToolboxPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: '',
    file_url: '',
    sort_order: 0,
  });
  const [uploadFile, setUploadFile] = useState(null);
  const BUCKET = 'toolbox-documents';

  const fetchDocuments = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('toolbox_documents')
      .select('*')
      .eq('organisation_id', orgId)
      .order('sort_order', { ascending: true });
    if (e) {
      setError(e.message);
      setDocuments([]);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [orgId]);

  const openCreate = () => {
    setEditingId(null);
    setUploadFile(null);
    setForm({ title: '', type: '', file_url: '', sort_order: documents.length });
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditingId(doc.id);
    setUploadFile(null);
    setForm({
      title: doc.title || '',
      type: doc.type || '',
      file_url: doc.file_url || '',
      sort_order: doc.sort_order ?? 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setUploadFile(null);
    setForm({ title: '', type: '', file_url: '', sort_order: 0 });
  };

  const isStoragePath = (url) => typeof url === 'string' && url.trim() !== '' && !url.trim().toLowerCase().startsWith('http');

  const handleDownloadStorage = async (path) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    if (!form.title?.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    const hasLink = form.file_url?.trim();
    if (!uploadFile && !hasLink) {
      setError('Indiquez un fichier (upload) ou un lien alternatif.');
      return;
    }
    setSaving(true);
    setError(null);
    let fileUrlToSave = form.file_url?.trim() || '';
    if (uploadFile) {
      const path = `${orgId}/${crypto.randomUUID()}_${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, uploadFile, { upsert: false });
      if (uploadErr) {
        setSaving(false);
        setError(uploadErr.message || 'Erreur lors de l\'upload.');
        return;
      }
      fileUrlToSave = path;
    }
    if (editingId) {
      const { error: updateErr } = await supabase
        .from('toolbox_documents')
        .update({
          title: form.title.trim(),
          type: form.type || null,
          file_url: fileUrlToSave,
          sort_order: Number(form.sort_order) || 0,
        })
        .eq('id', editingId);
      setSaving(false);
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
    } else {
      const { error: insertErr } = await supabase.from('toolbox_documents').insert({
        organisation_id: orgId,
        title: form.title.trim(),
        type: form.type || null,
        file_url: fileUrlToSave,
        sort_order: Number(form.sort_order) || 0,
      });
      setSaving(false);
      if (insertErr) {
        setError(insertErr.message);
        return;
      }
    }
    closeModal();
    await fetchDocuments();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document de la boîte à outils ?')) return;
    setError(null);
    const { error: deleteErr } = await supabase.from('toolbox_documents').delete().eq('id', id);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    await fetchDocuments();
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Boîte à outils</h1>
        </header>
        <main className="flex-1 p-6">
          <p className="text-cerip-forest/70">Organisation non définie.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Boîte à outils</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Gérez les documents mis à disposition des incubés dans la boîte à outils du portail.
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cerip-forest/10">
            <h2 className="text-sm font-semibold text-cerip-forest">Documents</h2>
            <button
              type="button"
              onClick={openCreate}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:opacity-90"
            >
              Ajouter un document
            </button>
          </div>
          {loading ? (
            <div className="p-6 text-cerip-forest/70 text-sm">Chargement…</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-cerip-forest/70 text-sm">Aucun document. Ajoutez-en un pour qu’ils apparaissent dans la boîte à outils des incubés.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-cerip-forest/5">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-cerip-forest block truncate">{doc.title}</span>
                    <span className="text-xs text-cerip-forest/60">
                      {doc.type || '—'} · ordre {doc.sort_order ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isStoragePath(doc.file_url) ? (
                      <button
                        type="button"
                        onClick={() => handleDownloadStorage(doc.file_url)}
                        className="text-xs text-cerip-lime hover:underline"
                      >
                        Télécharger
                      </button>
                    ) : (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cerip-lime hover:underline"
                      >
                        Lien
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(doc)}
                      className="px-2 py-1 rounded text-xs font-medium text-cerip-forest bg-cerip-forest/10 hover:bg-cerip-forest/20"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="px-2 py-1 rounded text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta/10"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" aria-hidden onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="toolbox-modal-title">
              <h2 id="toolbox-modal-title" className="text-lg font-semibold text-cerip-forest px-4 pt-4">
                {editingId ? 'Modifier le document' : 'Ajouter un document'}
              </h2>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Titre *</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                    placeholder="Ex. Modèle business plan"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Type</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Fichier (prioritaire)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.webm,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  />
                  {editingId && form.file_url && isStoragePath(form.file_url) && (
                    <span className="text-xs text-cerip-forest/60 mt-1 block">Fichier actuel stocké. Choisir un nouveau pour remplacer.</span>
                  )}
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Lien alternatif (si pas de fichier ou vidéo longue)</span>
                  <input
                    type="url"
                    value={form.file_url}
                    onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                    placeholder="https://..."
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Ordre d&apos;affichage</span>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-3 py-1.5 rounded-lg text-sm font-medium text-cerip-forest bg-cerip-forest/10 hover:bg-cerip-forest/20">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminOrgToolboxPage;

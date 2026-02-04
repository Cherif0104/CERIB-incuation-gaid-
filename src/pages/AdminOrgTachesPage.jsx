import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminée' },
];

function AdminOrgTachesPage() {
  const { profile } = useOutletContext() || {};
  const { programmeId, projetId } = useParams();
  const [programme, setProgramme] = useState(null);
  const [projet, setProjet] = useState(null);
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    due_date: '',
    status: 'TODO',
  });

  useEffect(() => {
    if (!programmeId) return;
    const fetchProgramme = async () => {
      const { data } = await supabase.from('programmes').select('*').eq('id', programmeId).single();
      setProgramme(data ?? null);
    };
    fetchProgramme();
  }, [programmeId]);

  useEffect(() => {
    if (!projetId) return;
    const fetchProjet = async () => {
      const { data } = await supabase.from('projets').select('*').eq('id', projetId).single();
      setProjet(data ?? null);
    };
    fetchProjet();
  }, [projetId]);

  const fetchTaches = async () => {
    if (!projetId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('programme_taches')
      .select('*')
      .eq('projet_id', projetId)
      .order('sort_order')
      .order('created_at', { ascending: true });
    if (e) {
      setError(e.message);
      setTaches([]);
    } else {
      setTaches(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTaches();
  }, [projetId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projetId || !form.title.trim()) {
      setError('Le titre de la tâche est requis.');
      return;
    }
    setCreating(true);
    setError(null);
    const maxOrder = taches.length ? Math.max(...taches.map((t) => t.sort_order ?? 0), 0) + 1 : 0;
    const { error: insertErr } = await supabase.from('programme_taches').insert({
      projet_id: projetId,
      title: form.title.trim(),
      due_date: form.due_date || null,
      status: form.status,
      sort_order: maxOrder,
    });
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchTaches();
    setForm({ title: '', due_date: '', status: 'TODO' });
  };

  const handleUpdateStatus = async (id, status) => {
    const { error: upErr } = await supabase.from('programme_taches').update({ status }).eq('id', id);
    if (upErr) setError(upErr.message);
    else await fetchTaches();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    const { error: delErr } = await supabase.from('programme_taches').delete().eq('id', id);
    if (delErr) setError(delErr.message);
    else await fetchTaches();
  };

  if (!programmeId || !projetId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Tâches</h1>
        </header>
        <main className="flex-1 p-6">
          <p className="text-cerip-forest/70">Programme ou projet non défini.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <nav className="text-xs text-cerip-forest/70 mb-1">
          <Link to="/admin-org/programmes" className="hover:text-cerip-forest">Programmes</Link>
          <span className="mx-1">/</span>
          <Link to={`/admin-org/programmes/${programmeId}/projets`} className="hover:text-cerip-forest">{programme?.name ?? '…'}</Link>
          <span className="mx-1">/</span>
          <span className="text-cerip-forest">{projet?.name ?? '…'}</span>
        </nav>
        <h1 className="text-lg font-semibold text-cerip-forest">Tâches</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Tâches et activités du projet « {projet?.name ?? '…'} ».
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Ajouter une tâche
          </h2>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-cerip-forest/80">Titre</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex. Organiser la session de formation"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Échéance</span>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Statut</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Ajout…' : 'Ajouter la tâche'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Tâches existantes
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : taches.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune tâche. Ajoutez-en une ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {taches.map((t) => (
                <li key={t.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest">{t.title}</p>
                    <p className="text-xs text-cerip-forest/70">
                      {STATUS_OPTIONS.find((o) => o.value === t.status)?.label ?? t.status}
                      {t.due_date && ` · Échéance ${new Date(t.due_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.status !== 'DONE' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.id, 'DONE')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
                      >
                        Marquer terminée
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
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
    </div>
  );
}

export default AdminOrgTachesPage;

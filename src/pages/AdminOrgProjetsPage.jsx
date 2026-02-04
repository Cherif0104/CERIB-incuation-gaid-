import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const STATUS_OPTIONS = [
  { value: 'PLANIFIED', label: 'Planifié' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
];

function AdminOrgProjetsPage() {
  const { profile } = useOutletContext() || {};
  const { programmeId } = useParams();
  const orgId = profile?.organisation_id;
  const [programme, setProgramme] = useState(null);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    objectives: '',
    status: 'PLANIFIED',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (!programmeId) return;
    const fetchProgramme = async () => {
      const { data, error: e } = await supabase.from('programmes').select('*').eq('id', programmeId).single();
      if (e) setProgramme(null);
      else setProgramme(data);
    };
    fetchProgramme();
  }, [programmeId]);

  const fetchProjets = async () => {
    if (!programmeId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('projets')
      .select('*')
      .eq('programme_id', programmeId)
      .order('created_at', { ascending: false });
    if (e) {
      setError(e.message);
      setProjets([]);
    } else {
      setProjets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjets();
  }, [programmeId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!programmeId || !form.name.trim()) {
      setError('Le nom du projet est requis.');
      return;
    }
    setCreating(true);
    setError(null);
    const { error: insertErr } = await supabase.from('projets').insert({
      programme_id: programmeId,
      name: form.name.trim(),
      objectives: form.objectives.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchProjets();
    setForm({ name: '', objectives: '', status: 'PLANIFIED', start_date: '', end_date: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce projet et toutes ses tâches ?')) return;
    const { error: delErr } = await supabase.from('projets').delete().eq('id', id);
    if (delErr) setError(delErr.message);
    else await fetchProjets();
  };

  if (!programmeId || !orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Projets</h1>
        </header>
        <main className="flex-1 p-6">
          <p className="text-cerip-forest/70">Programme ou organisation non défini.</p>
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
          <span className="text-cerip-forest">{programme?.name ?? '…'}</span>
        </nav>
        <h1 className="text-lg font-semibold text-cerip-forest">Projets</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Projets du programme « {programme?.name ?? '…'} ». Créez des projets et gérez les tâches.
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
            Créer un projet
          </h2>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Nom du projet</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Formation marketing digital"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Objectifs (optionnel)</span>
              <textarea
                value={form.objectives}
                onChange={(e) => setForm((f) => ({ ...f, objectives: e.target.value }))}
                placeholder="Description des objectifs"
                rows={2}
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
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
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Date de début</span>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Date de fin</span>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Créer le projet'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Projets existants
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : projets.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun projet. Créez-en un ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {projets.map((p) => (
                <li key={p.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest">{p.name}</p>
                    <p className="text-xs text-cerip-forest/70">
                      {STATUS_OPTIONS.find((o) => o.value === p.status)?.label ?? p.status}
                      {p.start_date && ` · ${new Date(p.start_date).toLocaleDateString('fr-FR')}`}
                      {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin-org/programmes/${programmeId}/projets/${p.id}/taches`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
                    >
                      Voir les tâches →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
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

export default AdminOrgProjetsPage;

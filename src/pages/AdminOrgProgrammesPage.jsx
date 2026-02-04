import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AdminOrgProgrammesPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    funder: '',
    start_date: '',
    end_date: '',
    budget: '',
  });

  const fetchProgrammes = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('programmes')
      .select('*')
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false });
    if (e) {
      setError(e.message);
      setProgrammes([]);
    } else {
      setProgrammes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProgrammes();
  }, [orgId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    if (!form.name.trim()) {
      setError('Le nom du programme est requis.');
      return;
    }
    setCreating(true);
    setError(null);
    const { error: insertErr } = await supabase.from('programmes').insert({
      organisation_id: orgId,
      name: form.name.trim(),
      funder: form.funder.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: form.budget ? parseFloat(form.budget) : null,
    });
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchProgrammes();
    setForm({ name: '', funder: '', start_date: '', end_date: '', budget: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce programme et tous ses projets et tâches ?')) return;
    const { error: delErr } = await supabase.from('programmes').delete().eq('id', id);
    if (delErr) setError(delErr.message);
    else await fetchProgrammes();
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Programmes</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Programmes</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Gérez les programmes financés (UNICEF, GIZ, fondations, etc.) et leurs projets.
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
            Créer un programme
          </h2>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Nom du programme</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Entrepreneuriat femmes 2025"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Financeur</span>
                <input
                  type="text"
                  value={form.funder}
                  onChange={(e) => setForm((f) => ({ ...f, funder: e.target.value }))}
                  placeholder="Ex. UNICEF, GIZ, UMOA"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Budget (optionnel)</span>
              <input
                type="number"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                placeholder="Ex. 5000000"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30 w-48"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Créer le programme'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Programmes existants
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : programmes.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun programme. Créez-en un ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {programmes.map((p) => (
                <li key={p.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest">{p.name}</p>
                    <p className="text-xs text-cerip-forest/70">
                      {p.funder || '—'} · {p.start_date ? new Date(p.start_date).toLocaleDateString('fr-FR') : '—'} → {p.end_date ? new Date(p.end_date).toLocaleDateString('fr-FR') : '—'}
                      {p.budget != null && ` · ${Number(p.budget).toLocaleString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin-org/programmes/${p.id}/projets`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
                    >
                      Voir les projets →
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

export default AdminOrgProgrammesPage;

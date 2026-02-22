import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AdminOrgMatrixagePage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [assignations, setAssignations] = useState([]);
  const [incubes, setIncubes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [coachs, setCoachs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    incube_id: '',
    promotion_id: '',
    coach_id: '',
  });

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const [a, i, p, c] = await Promise.all([
      supabase.from('assignations').select('*, incubes(full_name, email), promotions(name), staff_users(full_name)').eq('organisation_id', orgId).order('created_at', { ascending: false }),
      supabase.from('incubes').select('id, full_name, email').eq('organisation_id', orgId).order('full_name'),
      supabase.from('promotions').select('id, name').eq('organisation_id', orgId).order('name'),
      supabase.from('staff_users').select('id, full_name').eq('organisation_id', orgId).eq('role', 'COACH').order('full_name'),
    ]);
    if (a.error) setError(a.error.message);
    else setAssignations(a.data || []);
    if (i.error && !a.error) setError(i.error.message);
    else setIncubes(i.data || []);
    if (p.error && !a.error) setError(p.error.message);
    else setPromotions(p.data || []);
    if (c.error && !a.error) setError(c.error.message);
    else setCoachs(c.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!orgId || !form.incube_id || !form.promotion_id || !form.coach_id) {
      setError('Sélectionnez un incubé, une promotion et un coach.');
      return;
    }
    setAdding(true);
    setError(null);
    const { error: insertErr } = await supabase.from('assignations').insert({
      organisation_id: orgId,
      incube_id: form.incube_id,
      promotion_id: form.promotion_id,
      coach_id: form.coach_id,
    });
    setAdding(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchData();
    setForm({ incube_id: '', promotion_id: '', coach_id: '' });
  };

  const handleRemoveAssignation = async (row) => {
    if (!window.confirm(`Retirer l'assignation de ${row.incubes?.full_name ?? 'cet incubé'} pour cette promotion ?`)) return;
    setDeletingId(row.id);
    setError(null);
    const { error: delErr } = await supabase.from('assignations').delete().eq('id', row.id);
    setDeletingId(null);
    if (delErr) setError(delErr.message);
    else await fetchData();
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Matrixage</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Matrixage</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Assignez chaque incubé à une promotion et à un coach. Le coach ne voit que les incubés qui lui sont assignés.
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
            Nouvelle assignation
          </h2>
          <form onSubmit={handleAdd} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Incubé</span>
                <select
                  value={form.incube_id}
                  onChange={(e) => setForm((f) => ({ ...f, incube_id: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                >
                  <option value="">— Choisir —</option>
                  {incubes.map((x) => (
                    <option key={x.id} value={x.id}>{x.full_name} ({x.email})</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Promotion</span>
                <select
                  value={form.promotion_id}
                  onChange={(e) => setForm((f) => ({ ...f, promotion_id: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                >
                  <option value="">— Choisir —</option>
                  {promotions.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Coach</span>
                <select
                  value={form.coach_id}
                  onChange={(e) => setForm((f) => ({ ...f, coach_id: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                >
                  <option value="">— Choisir —</option>
                  {coachs.map((x) => (
                    <option key={x.id} value={x.id}>{x.full_name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={adding || !form.incube_id || !form.promotion_id || !form.coach_id}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {adding ? 'Ajout…' : 'Assigner'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Assignations existantes
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : assignations.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune assignation. Créez-en une ci-dessus.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cerip-forest/10 bg-cerip-forest-light/50">
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Incubé</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Promotion</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Coach</th>
                    <th className="text-right px-4 py-3 font-medium text-cerip-forest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignations.map((row) => (
                    <tr key={row.id} className="border-b border-cerip-forest/5 hover:bg-cerip-forest-light/30">
                      <td className="px-4 py-3 text-cerip-forest">{row.incubes?.full_name ?? '—'} <span className="text-cerip-forest/70">({row.incubes?.email})</span></td>
                      <td className="px-4 py-3 text-cerip-forest/80">{row.promotions?.name ?? row.promotion_id}</td>
                      <td className="px-4 py-3 text-cerip-forest/80">{row.staff_users?.full_name ?? row.coach_id}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          onClick={() => handleRemoveAssignation(row)}
                          className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          {deletingId === row.id ? '…' : 'Retirer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminOrgMatrixagePage;

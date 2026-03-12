import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const PARCOURS_OPTIONS = [
  { value: 'P1', label: 'P1 uniquement' },
  { value: 'P2', label: 'P2 uniquement' },
  { value: 'MIXTE', label: 'P1 + P2 (Mixte)' },
];
const START_MODE_OPTIONS = [
  { value: 'P1', label: 'Démarrer en P1' },
  { value: 'P2', label: 'Démarrer en P2' },
];

function AdminOrgPromotionsPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    parcours_type: 'P1',
    start_mode: 'P1',
    start_date: '',
    end_date: '',
    end_rule: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    parcours_type: 'P1',
    start_mode: 'P1',
    start_date: '',
    end_date: '',
    end_rule: '',
  });

  const fetchPromotions = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('promotions')
      .select('*')
      .eq('organisation_id', orgId)
      .order('name');
    if (e) {
      setError(e.message);
      toast.error(e.message);
      setPromotions([]);
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromotions();
  }, [orgId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    const id = form.id.trim().toLowerCase().replace(/\s+/g, '-') || form.name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id || !form.name.trim()) {
      setError('Nom et identifiant requis.');
      return;
    }
    setCreating(true);
    setError(null);
    const { error: insertErr } = await supabase.from('promotions').insert({
      id,
      name: form.name.trim(),
      organisation_id: orgId,
      parcours_type: form.parcours_type,
      start_mode: form.start_mode,
      start_date: form.start_date?.trim() || null,
      end_date: form.end_date?.trim() || null,
      end_rule: form.end_rule.trim() || null,
    });
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      toast.error(insertErr.message);
      return;
    }
    toast.success('Promotion créée');
    await fetchPromotions();
    setForm({ id: '', name: '', parcours_type: 'P1', start_mode: 'P1', start_date: '', end_date: '', end_rule: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const { error: upErr } = await supabase
      .from('promotions')
      .update({
        name: editForm.name.trim(),
        parcours_type: editForm.parcours_type,
        start_mode: editForm.start_mode,
        start_date: editForm.start_date?.trim() || null,
        end_date: editForm.end_date?.trim() || null,
        end_rule: editForm.end_rule.trim() || null,
      })
      .eq('id', editing.id);
    if (upErr) {
      setError(upErr.message);
      toast.error(upErr.message);
    } else {
      toast.success('Promotion mise à jour');
      setEditing(null);
      await fetchPromotions();
    }
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`Supprimer la promotion « ${promo.name } » ? Les assignations liées seront supprimées.`)) return;
    setDeletingId(promo.id);
    setError(null);
    const { error: delErr } = await supabase.from('promotions').delete().eq('id', promo.id);
    setDeletingId(null);
    if (delErr) {
      setError(delErr.message);
      toast.error(delErr.message);
    } else {
      toast.success('Promotion supprimée');
      await fetchPromotions();
    }
  };

  const openEdit = (p) => {
    setEditing(p);
    setEditForm({
      name: p.name || '',
      parcours_type: p.parcours_type || 'P1',
      start_mode: p.start_mode || 'P1',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      end_rule: p.end_rule || '',
    });
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Promotions</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Promotions</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Créez et gérez les promotions (sessions/cohortes) : date de démarrage, type de parcours. Les modules pédagogiques sont ensuite créés par promotion.
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
            Créer une promotion
          </h2>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Nom de la promotion</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex. Promotion Start 2025"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Identifiant (slug)</span>
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Ex. promo-2025-1 (optionnel, dérivé du nom)"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30 font-mono"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Type de parcours</span>
                <select
                  value={form.parcours_type}
                  onChange={(e) => setForm((f) => ({ ...f, parcours_type: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                >
                  {PARCOURS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Démarrage</span>
                <select
                  value={form.start_mode}
                  onChange={(e) => setForm((f) => ({ ...f, start_mode: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                >
                  {START_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Date de début (cohorte)</span>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
                <span className="text-xs text-cerip-forest/60">Démarrage de la session</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Date de fin (optionnel)</span>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Règle de fin (optionnel)</span>
              <input
                type="text"
                value={form.end_rule}
                onChange={(e) => setForm((f) => ({ ...f, end_rule: e.target.value }))}
                placeholder="Ex. SESSION_END, CERTIFICATION"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Créer la promotion'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Promotions existantes
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : promotions.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune promotion. Créez-en une ci-dessus.</div>
          ) : (
            <>
              <ul className="divide-y divide-cerip-forest/5">
                {promotions.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                    <div>
                      <p className="font-medium text-cerip-forest">{p.name}</p>
                      <p className="text-xs text-cerip-forest/70 font-mono">
                        {p.id} · {p.parcours_type} · Démarrage {p.start_mode}
                        {p.start_date && ` · Début ${new Date(p.start_date).toLocaleDateString('fr-FR')}`}
                        {p.end_rule ? ` · ${p.end_rule}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin-org/modules?promotion=${encodeURIComponent(p.id)}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime/20 text-cerip-forest hover:bg-cerip-lime/30"
                      >
                        Modules
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === p.id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {editing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
                <div className="bg-white rounded-xl shadow-xl border border-cerip-forest/10 w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold text-cerip-forest mb-4">Modifier la promotion</h3>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-cerip-forest/80">Nom</span>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                        required
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-cerip-forest/80">Type de parcours</span>
                        <select
                          value={editForm.parcours_type}
                          onChange={(e) => setEditForm((f) => ({ ...f, parcours_type: e.target.value }))}
                          className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                        >
                          {PARCOURS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-cerip-forest/80">Démarrage</span>
                        <select
                          value={editForm.start_mode}
                          onChange={(e) => setEditForm((f) => ({ ...f, start_mode: e.target.value }))}
                          className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                        >
                          {START_MODE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-cerip-forest/80">Date de début</span>
                        <input
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
                          className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-cerip-forest/80">Date de fin (optionnel)</span>
                        <input
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                          className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-cerip-forest/80">Règle de fin (optionnel)</span>
                      <input
                        type="text"
                        value={editForm.end_rule}
                        onChange={(e) => setEditForm((f) => ({ ...f, end_rule: e.target.value }))}
                        className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark">
                        Enregistrer
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminOrgPromotionsPage;

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AdminOrgCoachsPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [coachs, setCoachs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    auth_user_id: '',
  });

  const fetchCoachs = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('staff_users')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('role', 'COACH')
      .order('full_name');
    if (e) {
      setError(e.message);
      setCoachs([]);
    } else {
      setCoachs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoachs();
  }, [orgId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    const uid = form.auth_user_id.trim();
    if (!uid || !form.full_name.trim() || !form.email.trim()) {
      setError('Nom, e-mail et UID Auth requis.');
      return;
    }
    setAdding(true);
    setError(null);
    const { error: insertErr } = await supabase.from('staff_users').insert({
      auth_user_id: uid,
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      role: 'COACH',
      organisation_id: orgId,
    });
    setAdding(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchCoachs();
    setForm({ full_name: '', email: '', auth_user_id: '' });
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Coachs</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Coachs</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Liste des coachs de votre organisation. C&apos;est l&apos;Admin qui assigne les incubés aux coachs (Matrixage).
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
            Lier un coach (compte existant)
          </h2>
          <p className="px-4 pt-2 text-xs text-cerip-forest/70">
            Créez d&apos;abord l&apos;utilisateur dans Supabase (Authentication → Users → Add user), puis copiez son UID et renseignez les champs ci-dessous.
          </p>
          <form onSubmit={handleAdd} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Nom complet</span>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ex. Marie Diallo"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">E-mail</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="coach@exemple.sn"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">UID (Auth) du compte Supabase</span>
              <input
                type="text"
                value={form.auth_user_id}
                onChange={(e) => setForm((f) => ({ ...f, auth_user_id: e.target.value }))}
                placeholder="Ex. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30 font-mono"
                required
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {adding ? 'Ajout…' : 'Lier comme coach'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Coachs de l&apos;organisation
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : coachs.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun coach. Liez un compte ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {coachs.map((c) => (
                <li key={c.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest">{c.full_name}</p>
                    <p className="text-xs text-cerip-forest/70">{c.email}</p>
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

export default AdminOrgCoachsPage;

import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AdminOrgCertificateursPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [certificateurs, setCertificateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [createResultPassword, setCreateResultPassword] = useState(null);
  const [createResultEmailSent, setCreateResultEmailSent] = useState(null);

  const fetchCertificateurs = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('staff_users')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('role', 'CERTIFICATEUR')
      .order('full_name');
    if (e) {
      setError(e.message);
      setCertificateurs([]);
    } else {
      setCertificateurs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificateurs();
  }, [orgId]);

  const handleCreateCertificateur = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    const email = (createForm.email || '').trim().toLowerCase();
    if (!email) {
      setError('E-mail requis.');
      return;
    }
    const pwd = (createForm.password || '').trim();
    if (pwd && pwd.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères (ou laisser vide pour en générer un).');
      return;
    }
    setCreating(true);
    setError(null);
    setCreateResultPassword(null);
    setCreateResultEmailSent(null);
    const { data, error: fnErr } = await supabase.functions.invoke('create-platform-user', {
      body: {
        email,
        full_name: (createForm.full_name || '').trim() || email,
        password: pwd || undefined,
        role: 'CERTIFICATEUR',
        organisation_id: orgId,
      },
    });
    setCreating(false);
    if (fnErr) {
      setError(fnErr.message || 'Erreur lors de la création du compte.');
      return;
    }
    if (!data?.success) {
      setError(data?.error || 'Erreur lors de la création du compte.');
      return;
    }
    if (data.temporary_password) setCreateResultPassword(data.temporary_password);
    if (data.email_sent) setCreateResultEmailSent(email);
    setCreateForm({ full_name: '', email: '', password: '' });
    await fetchCertificateurs();
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Certificateurs</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Certificateurs</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Liste des certificateurs de votre organisation. Ils animent les sessions d&apos;examen et valident les certifications.
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
            Créer un compte certificateur
          </h2>
          <p className="px-4 pt-2 text-xs text-cerip-forest/70">
            Créez un compte avec e-mail et mot de passe. Le certificateur pourra modifier son mot de passe depuis son profil.
          </p>
          <form onSubmit={handleCreateCertificateur} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Nom complet</span>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ex. Amadou Fall"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">E-mail *</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="certificateur@exemple.sn"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                  required
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Mot de passe (optionnel)</span>
              <input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Vide = généré automatiquement"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            {createResultPassword && (
              <div className="rounded-lg border border-cerip-forest/15 bg-cerip-forest-light/40 px-3 py-2 space-y-1">
                <p className="text-xs font-medium text-cerip-forest/80">Mot de passe temporaire à communiquer</p>
                <p className="text-sm font-mono text-cerip-forest break-all select-all">{createResultPassword}</p>
                {createResultEmailSent && (
                  <p className="text-xs text-cerip-forest/80">Un email a été envoyé à {createResultEmailSent} avec les instructions de connexion.</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Créer le compte'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Certificateurs de l&apos;organisation
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : certificateurs.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun certificateur. Créez un compte ci-dessus.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {certificateurs.map((c) => (
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

export default AdminOrgCertificateursPage;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { STAFF_ROLE_LABELS as ROLE_LABELS } from '../data/roleLabels';

function SuperAdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [orgsById, setOrgsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [createCertForm, setCreateCertForm] = useState({ full_name: '', email: '', password: '' });
  const [creatingCert, setCreatingCert] = useState(false);
  const [createCertPasswordResult, setCreateCertPasswordResult] = useState(null);
  const [createCertEmailSent, setCreateCertEmailSent] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [{ data, error: e }, { data: orgs, error: eOrgs }] = await Promise.all([
        supabase.from('staff_users').select('*').order('created_at', { ascending: false }),
        supabase.from('organisations').select('id, name'),
      ]);
      if (e || eOrgs) {
        setError((e || eOrgs)?.message || 'Erreur lors du chargement du staff.');
        setLoading(false);
        return;
      }
      setStaff(data || []);
      setOrgsById(
        (orgs || []).reduce((acc, o) => {
          acc[o.id] = o.name || o.id;
          return acc;
        }, {}),
      );
      setLoading(false);
    };
    load();
  }, []);

  const organisations = Array.from(
    new Set(staff.map((s) => s.organisation_id).filter(Boolean)),
  );

  const filteredStaff = staff.filter((s) => {
    if (roleFilter && s.role !== roleFilter) return false;
    if (orgFilter && s.organisation_id !== orgFilter) return false;
    return true;
  }).sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'full_name') {
      return (a.full_name || '').localeCompare(b.full_name || '') * dir;
    }
    if (sortBy === 'email') {
      return (a.email || '').localeCompare(b.email || '') * dir;
    }
    if (sortBy === 'role') {
      return (a.role || '').localeCompare(b.role || '') * dir;
    }
    if (sortBy === 'organisation_id') {
      return (a.organisation_id || '').localeCompare(b.organisation_id || '') * dir;
    }
    // created_at par défaut
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return (da - db) * dir;
  });

  const handleCreateSuperCertificateur = async (e) => {
    e.preventDefault();
    const email = (createCertForm.email || '').trim().toLowerCase();
    if (!email) {
      setError('E-mail requis.');
      return;
    }
    const pwd = (createCertForm.password || '').trim();
    if (pwd && pwd.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères (ou laisser vide pour en générer un).');
      return;
    }
    setCreatingCert(true);
    setError(null);
    setCreateCertPasswordResult(null);
    setCreateCertEmailSent(null);
    const { data, error: fnErr } = await supabase.functions.invoke('create-platform-user', {
      body: {
        email,
        full_name: (createCertForm.full_name || '').trim() || email,
        password: pwd || undefined,
        role: 'CERTIFICATEUR',
        organisation_id: null,
      },
    });
    setCreatingCert(false);
    if (fnErr) {
      setError(fnErr.message || 'Erreur lors de la création du compte.');
      return;
    }
    if (!data?.success) {
      setError(data?.error || 'Erreur lors de la création du compte.');
      return;
    }
    if (data.temporary_password) setCreateCertPasswordResult(data.temporary_password);
    if (data.email_sent) setCreateCertEmailSent(email);
    setCreateCertForm({ full_name: '', email: '', password: '' });
    setStaff((prev) => prev); // trigger re-fetch below via reload
    const [{ data: staffData }] = await Promise.all([
      supabase.from('staff_users').select('*').order('created_at', { ascending: false }),
    ]);
    setStaff(staffData || []);
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">Super Admin – Staff & rôles</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">
          Vue globale de tous les comptes staff (Super Admin, Admin Org, Coach, Certificateur).
        </p>
      </header>
      <main className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Créer un super certificateur (sans organisation)
          </h2>
          <p className="px-4 pt-2 text-xs text-cerip-forest/70">
            Ce certificateur pourra intervenir sur plusieurs organisations. Laissez le mot de passe vide pour en générer un.
          </p>
          <form onSubmit={handleCreateSuperCertificateur} className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">Nom complet</span>
                <input
                  type="text"
                  value={createCertForm.full_name}
                  onChange={(e) => setCreateCertForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Ex. Amadou Fall"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-cerip-forest/80">E-mail *</span>
                <input
                  type="email"
                  value={createCertForm.email}
                  onChange={(e) => setCreateCertForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="certificateur@exemple.sn"
                  className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Mot de passe (optionnel)</span>
              <input
                type="password"
                value={createCertForm.password}
                onChange={(e) => setCreateCertForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Vide = généré"
                className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
              />
            </label>
            {createCertPasswordResult && (
              <div className="rounded-lg border border-cerip-forest/15 bg-cerip-forest-light/40 px-3 py-2 space-y-1">
                <p className="text-xs font-medium text-cerip-forest/80">Mot de passe temporaire à communiquer</p>
                <p className="text-sm font-mono text-cerip-forest break-all select-all">{createCertPasswordResult}</p>
                {createCertEmailSent && (
                  <p className="text-xs text-cerip-forest/80">Un email a été envoyé à {createCertEmailSent} avec les instructions de connexion.</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={creatingCert}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50"
            >
              {creatingCert ? 'Création…' : 'Créer le compte'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-cerip-forest/10">
            <h2 className="text-sm font-semibold text-cerip-forest">Tous les membres du staff</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="">Tous rôles</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="">Toutes organisations</option>
                {organisations.map((id) => (
                  <option key={id} value={id}>
                    {orgsById[id] || id}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="created_at">Tri : plus récent</option>
                <option value="full_name">Nom</option>
                <option value="email">Email</option>
                <option value="role">Rôle</option>
                <option value="organisation_id">Organisation</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cerip-forest/20 text-cerip-forest bg-white"
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">
              Aucun membre du staff pour ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-cerip-forest-light/40 text-cerip-forest/80">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Nom</th>
                    <th className="px-4 py-2 text-left font-medium">Email</th>
                    <th className="px-4 py-2 text-left font-medium">Rôle</th>
                    <th className="px-4 py-2 text-left font-medium">Organisation</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cerip-forest/10">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-cerip-forest-light/30">
                      <td className="px-4 py-2 text-cerip-forest">
                        <Link
                          to={`/super-admin/staff/${s.id}`}
                          className="text-cerip-forest hover:text-cerip-lime font-medium"
                        >
                          {s.full_name || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-cerip-forest/80">
                        <Link
                          to={`/super-admin/staff/${s.id}`}
                          className="hover:underline"
                        >
                          {s.email}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-cerip-forest/80">
                        {ROLE_LABELS[s.role] ?? s.role}
                      </td>
                      <td className="px-4 py-2 text-cerip-forest/80">
                        {s.organisation_id ? (
                          <Link
                            to={`/super-admin/organisations/${s.organisation_id}`}
                            className="text-cerip-lime hover:underline"
                          >
                            {orgsById[s.organisation_id] || s.organisation_id}
                          </Link>
                        ) : (
                          <span className="text-cerip-forest/50">Aucune</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-cerip-forest/70 whitespace-nowrap">
                        {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
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

export default SuperAdminStaffPage;


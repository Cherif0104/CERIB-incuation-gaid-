import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function computeInvitationCodeStatus(code) {
  const now = new Date();
  const expiresAt = code.expires_at ? new Date(code.expires_at) : null;
  const isExpired = expiresAt ? expiresAt <= now : false;
  const isSaturated = code.used_count >= code.max_uses;
  if (isExpired) return 'expiré';
  if (isSaturated) return 'saturé';
  return 'actif';
}

function computeAdminInvitationStatus(inv) {
  const now = new Date();
  const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null;
  if (inv.used_at) return 'utilisée';
  if (expiresAt && expiresAt <= now) return 'expirée';
  return 'en attente';
}

function SuperAdminInvitationsPage() {
  const [codes, setCodes] = useState([]);
  const [adminInvites, setAdminInvites] = useState([]);
  const [orgsById, setOrgsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orgFilter, setOrgFilter] = useState('');
  const [stateFilterCodes, setStateFilterCodes] = useState('');
  const [stateFilterAdmins, setStateFilterAdmins] = useState('');
  const [sortCodesBy, setSortCodesBy] = useState('created_at');
  const [sortCodesDir, setSortCodesDir] = useState('desc');
  const [sortAdminsBy, setSortAdminsBy] = useState('created_at');
  const [sortAdminsDir, setSortAdminsDir] = useState('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [codesRes, adminRes, orgsRes] = await Promise.all([
        supabase.from('invitation_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('admin_invitations').select('*').order('created_at', { ascending: false }),
        supabase.from('organisations').select('id, name'),
      ]);
      if (codesRes.error || adminRes.error) {
        setError((codesRes.error || adminRes.error)?.message || 'Erreur lors du chargement des invitations.');
        setLoading(false);
        return;
      }
      setCodes(codesRes.data || []);
      setAdminInvites(adminRes.data || []);
      setOrgsById(
        (orgsRes.data || []).reduce((acc, o) => {
          acc[o.id] = o.name || o.id;
          return acc;
        }, {}),
      );
      setLoading(false);
    };
    load();
  }, []);

  const allOrgIds = Array.from(
    new Set([
      ...codes.map((c) => c.organisation_id).filter(Boolean),
      ...adminInvites.map((i) => i.organisation_id).filter(Boolean),
    ]),
  );

  const filteredCodes = codes.filter((c) => {
    if (orgFilter && c.organisation_id !== orgFilter) return false;
    const status = computeInvitationCodeStatus(c);
    if (stateFilterCodes && status !== stateFilterCodes) return false;
    return true;
  }).sort((a, b) => {
    const dir = sortCodesDir === 'asc' ? 1 : -1;
    if (sortCodesBy === 'organisation_id') {
      return (a.organisation_id || '').localeCompare(b.organisation_id || '') * dir;
    }
    if (sortCodesBy === 'expires_at') {
      const da = a.expires_at ? new Date(a.expires_at).getTime() : 0;
      const db = b.expires_at ? new Date(b.expires_at).getTime() : 0;
      return (da - db) * dir;
    }
    // created_at par défaut
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return (da - db) * dir;
  });

  const filteredAdminInvites = adminInvites.filter((i) => {
    if (orgFilter && i.organisation_id !== orgFilter) return false;
    const status = computeAdminInvitationStatus(i);
    if (stateFilterAdmins && status !== stateFilterAdmins) return false;
    return true;
  }).sort((a, b) => {
    const dir = sortAdminsDir === 'asc' ? 1 : -1;
    if (sortAdminsBy === 'organisation_id') {
      return (a.organisation_id || '').localeCompare(b.organisation_id || '') * dir;
    }
    if (sortAdminsBy === 'expires_at') {
      const da = a.expires_at ? new Date(a.expires_at).getTime() : 0;
      const db = b.expires_at ? new Date(b.expires_at).getTime() : 0;
      return (da - db) * dir;
    }
    // created_at par défaut
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return (da - db) * dir;
  });

  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => computeInvitationCodeStatus(c) === 'actif').length;
  const totalUses = codes.reduce((sum, c) => sum + (c.used_count || 0), 0);

  const handleRevokeCode = async (code) => {
    if (!window.confirm(`Révoquer définitivement le code ${code.code} ?`)) return;
    try {
      const { error } = await supabase
        .from('invitation_codes')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', code.id);
      if (error) {
        // Erreur affichée en haut
        // eslint-disable-next-line no-console
        console.error('Erreur révocation code:', error);
        return;
      }
      setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, revoked_at: new Date().toISOString() } : c)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Erreur révocation code:', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">Super Admin – Invitations</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">
          Suivi des codes d’invitation incubés et des invitations administrateur.
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Codes d’invitation (incubés)</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : totalCodes}</p>
            <p className="text-xs text-cerip-forest/70 mt-1">
              {loading ? '' : `${activeCodes} actifs · ${totalCodes - activeCodes} expirés / saturés`}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Utilisations totales</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : totalUses}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Invitations admin</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : adminInvites.length}</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-cerip-forest/10">
            <h2 className="text-sm font-semibold text-cerip-forest">Codes d’invitation incubés</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="">Toutes organisations</option>
                {allOrgIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <select
                value={stateFilterCodes}
                onChange={(e) => setStateFilterCodes(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="">Tous états</option>
                <option value="actif">Actifs</option>
                <option value="expiré">Expirés</option>
                <option value="saturé">Saturés</option>
              </select>
              <select
                value={sortCodesBy}
                onChange={(e) => setSortCodesBy(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="created_at">Tri : création</option>
                <option value="expires_at">Expiration</option>
                <option value="organisation_id">Organisation</option>
              </select>
              <button
                type="button"
                onClick={() => setSortCodesDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cerip-forest/20 text-cerip-forest bg-white"
              >
                {sortCodesDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun code pour ces critères.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-cerip-forest-light/40 text-cerip-forest/80">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Code</th>
                    <th className="px-4 py-2 text-left font-medium">Organisation</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Utilisations</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Expire le</th>
                    <th className="px-4 py-2 text-left font-medium">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cerip-forest/10">
                  {filteredCodes.map((c) => {
                    const status = computeInvitationCodeStatus(c);
                    return (
                      <tr key={c.id} className="hover:bg-cerip-forest-light/30">
                        <td className="px-4 py-2 text-cerip-forest font-mono text-xs">{c.code}</td>
                        <td className="px-4 py-2 text-cerip-forest/80">{orgsById[c.organisation_id] || c.organisation_id}</td>
                        <td className="px-4 py-2 text-cerip-forest/80">
                          {c.used_count} / {c.max_uses}
                        </td>
                        <td className="px-4 py-2 text-cerip-forest/80 whitespace-nowrap">
                          {c.expires_at ? new Date(c.expires_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2 text-cerip-forest/80 capitalize">
                          {status}
                          {status === 'actif' && (
                            <button
                              type="button"
                              onClick={() => handleRevokeCode(c)}
                              className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cerip-magenta/10 text-cerip-magenta hover:bg-cerip-magenta/20"
                            >
                              Révoquer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-cerip-forest/10">
            <h2 className="text-sm font-semibold text-cerip-forest">Invitations administrateur</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={stateFilterAdmins}
                onChange={(e) => setStateFilterAdmins(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="">Tous états</option>
                <option value="en attente">En attente</option>
                <option value="expirée">Expirées</option>
                <option value="utilisée">Utilisées</option>
              </select>
              <select
                value={sortAdminsBy}
                onChange={(e) => setSortAdminsBy(e.target.value)}
                className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
              >
                <option value="created_at">Tri : création</option>
                <option value="expires_at">Expiration</option>
                <option value="organisation_id">Organisation</option>
              </select>
              <button
                type="button"
                onClick={() => setSortAdminsDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-cerip-forest/20 text-cerip-forest bg-white"
              >
                {sortAdminsDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : filteredAdminInvites.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune invitation admin pour ces critères.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-cerip-forest-light/40 text-cerip-forest/80">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Email</th>
                    <th className="px-4 py-2 text-left font-medium">Nom</th>
                    <th className="px-4 py-2 text-left font-medium">Organisation</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Créée le</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Expire le</th>
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Utilisée le</th>
                    <th className="px-4 py-2 text-left font-medium">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cerip-forest/10">
                  {filteredAdminInvites.map((inv) => {
                    const status = computeAdminInvitationStatus(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-cerip-forest-light/30">
                        <td className="px-4 py-2 text-cerip-forest/90">{inv.email}</td>
                        <td className="px-4 py-2 text-cerip-forest/80">{inv.full_name || '—'}</td>
                        <td className="px-4 py-2 text-cerip-forest/80">{orgsById[inv.organisation_id] || inv.organisation_id}</td>
                        <td className="px-4 py-2 text-cerip-forest/70 whitespace-nowrap">
                          {inv.created_at ? new Date(inv.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2 text-cerip-forest/70 whitespace-nowrap">
                          {inv.expires_at ? new Date(inv.expires_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2 text-cerip-forest/70 whitespace-nowrap">
                          {inv.used_at ? new Date(inv.used_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2 text-cerip-forest/80 capitalize">{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SuperAdminInvitationsPage;


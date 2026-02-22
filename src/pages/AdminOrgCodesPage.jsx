import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function generateCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toLowerCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AdminOrgCodesPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    expiresInDays: 30,
    maxUses: 1,
  });
  const [copyId, setCopyId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCodes = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false });
    if (e) {
      setError(e.message);
      setCodes([]);
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, [orgId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(form.expiresInDays));
    setCreating(true);
    setError(null);
    const { error: insertErr } = await supabase.from('invitation_codes').insert({
      code,
      organisation_id: orgId,
      expires_at: expiresAt.toISOString(),
      max_uses: Number(form.maxUses) || 1,
      created_by: session.user.id,
    });
    setCreating(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    await fetchCodes();
    setForm({ expiresInDays: 30, maxUses: 1 });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Supprimer le code « ${row.code} » ? Il ne pourra plus être utilisé.`)) return;
    setDeletingId(row.id);
    setError(null);
    const { error: delErr } = await supabase.from('invitation_codes').delete().eq('id', row.id);
    setDeletingId(null);
    if (delErr) setError(delErr.message);
    else await fetchCodes();
  };

  const copyToClipboard = (code, id) => {
    const url = `${window.location.origin}/accept-invitation?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyId(id);
      setTimeout(() => setCopyId(null), 2000);
    });
  };

  if (!orgId) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
          <h1 className="text-lg font-semibold text-cerip-forest">Codes d&apos;invitation</h1>
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
        <h1 className="text-lg font-semibold text-cerip-forest">Codes d&apos;invitation</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Générez des codes pour que les incubés puissent s&apos;inscrire et rejoindre votre organisation.
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
            Créer un code
          </h2>
          <form onSubmit={handleCreate} className="p-4 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Validité (jours)</span>
              <input
                type="number"
                min={1}
                max={365}
                value={form.expiresInDays}
                onChange={(e) => setForm((f) => ({ ...f, expiresInDays: e.target.value }))}
                className="w-24 rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-cerip-forest/80">Utilisations max</span>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                className="w-24 rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {creating ? 'Création…' : 'Générer un code'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Codes existants
          </h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : codes.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun code pour le moment. Créez-en un ci-dessus.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cerip-forest/10 bg-cerip-forest-light/50">
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Expire le</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Utilisations</th>
                    <th className="text-left px-4 py-3 font-medium text-cerip-forest">Créé le</th>
                    <th className="text-right px-4 py-3 font-medium text-cerip-forest">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((row) => {
                    const expired = new Date(row.expires_at) < new Date();
                    const exhausted = row.used_count >= row.max_uses;
                    return (
                      <tr key={row.id} className="border-b border-cerip-forest/5 hover:bg-cerip-forest-light/30">
                        <td className="px-4 py-3 font-mono text-cerip-forest">{row.code}</td>
                        <td className="px-4 py-3 text-cerip-forest/80">
                          {formatDate(row.expires_at)}
                          {(expired || exhausted) && (
                            <span className="ml-1 text-cerip-magenta text-xs">
                              {expired ? '(expiré)' : exhausted ? '(épuisé)' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-cerip-forest/80">{row.used_count} / {row.max_uses}</td>
                        <td className="px-4 py-3 text-cerip-forest/70">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(row.code, row.id)}
                            className="text-cerip-magenta hover:underline text-xs font-medium mr-2"
                          >
                            {copyId === row.id ? 'Copié ✓' : 'Copier le lien'}
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === row.id}
                            onClick={() => handleDelete(row)}
                            className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50"
                          >
                            {deletingId === row.id ? '…' : 'Supprimer'}
                          </button>
                        </td>
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

export default AdminOrgCodesPage;

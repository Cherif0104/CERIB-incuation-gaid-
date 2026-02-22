import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function SuperAdminDemandesPage() {
  const [items, setItems] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [filterOrg, setFilterOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paramModalUser, setParamModalUser] = useState(null);
  const [paramForm, setParamForm] = useState({ full_name: '', email: '', temps_h: 4, sessions: 2, max_sos: 1, max_rdv: 1 });
  const [savingParam, setSavingParam] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: orgs } = await supabase.from('organisations').select('id, name').order('name');
      setOrganisations(orgs ?? []);

      const { data: requests, error: reqErr } = await supabase
        .from('coaching_requests')
        .select(`
          id,
          incube_id,
          status,
          message,
          created_at,
          mois_num,
          request_type,
          incubes ( id, full_name, email, organisation_id, temps_h, sessions, max_sos, max_rdv ),
          organisations ( id, name )
        `)
        .order('created_at', { ascending: false });

      if (reqErr) {
        setError(reqErr.message);
        setItems([]);
      } else {
        setItems(requests ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredItems = filterOrg
    ? items.filter((r) => r.incubes?.organisation_id === filterOrg)
    : items;

  const openParamModal = (incube) => {
    if (!incube) return;
    setParamModalUser(incube);
    setParamForm({
      full_name: incube.full_name ?? '',
      email: incube.email ?? '',
      temps_h: incube.temps_h ?? 4,
      sessions: incube.sessions ?? 2,
      max_sos: incube.max_sos ?? 1,
      max_rdv: incube.max_rdv ?? 1,
    });
  };

  const handleSaveParametres = async () => {
    if (!paramModalUser?.id) return;
    setSavingParam(true);
    setError(null);
    const { error: err } = await supabase
      .from('incubes')
      .update({
        full_name: paramForm.full_name,
        email: paramForm.email,
        temps_h: paramForm.temps_h,
        sessions: paramForm.sessions,
        max_sos: paramForm.max_sos,
        max_rdv: paramForm.max_rdv,
      })
      .eq('id', paramModalUser.id);
    setSavingParam(false);
    if (err) setError(err.message);
    else {
      setParamModalUser(null);
      setItems((prev) =>
        prev.map((r) =>
          r.incubes?.id === paramModalUser.id
            ? { ...r, incubes: { ...r.incubes, ...paramForm } }
            : r
        )
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">DEMANDES & ALERTES</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">Vue agrégée des demandes (toutes organisations).</p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-cerip-forest/80">Organisation</label>
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest bg-white"
          >
            <option value="">Toutes</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Liste des entrées [Étudiant] – Mois</h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune demande.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {filteredItems.map((r) => {
                const incube = r.incubes;
                const label = incube ? `${incube.full_name || incube.email} – Mois ${r.mois_num ?? '?'}` : `Incubé ${r.incube_id?.slice(0, 8)}…`;
                return (
                  <li key={r.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-cerip-forest-light/30">
                    <div>
                      <p className="font-medium text-cerip-forest flex items-center gap-2 flex-wrap">
                        {label}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-cerip-forest/10 text-cerip-forest/80'}`}>
                          {r.status}
                        </span>
                        {r.request_type && r.request_type !== 'COACHING' && (
                          <span className="text-xs text-cerip-forest/60">· {r.request_type}</span>
                        )}
                      </p>
                      <p className="text-xs text-cerip-forest/70">
                        {r.organisations?.name ?? ''} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {r.message && <p className="text-sm text-cerip-forest/80 mt-1 truncate max-w-md">{r.message}</p>}
                    </div>
                    {incube && (
                      <button
                        type="button"
                        onClick={() => openParamModal(incube)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20"
                      >
                        Paramètres étudiant
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {paramModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-cerip-forest/10">
            <h3 className="text-lg font-bold text-cerip-forest mb-4">PARAMÈTRES ÉTUDIANT</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Nom</label>
                <input type="text" value={paramForm.full_name} onChange={(e) => setParamForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Email</label>
                <input type="email" value={paramForm.email} onChange={(e) => setParamForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Temps (h)</label>
                  <input type="number" min={0} value={paramForm.temps_h} onChange={(e) => setParamForm((f) => ({ ...f, temps_h: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Sessions</label>
                  <input type="number" min={0} value={paramForm.sessions} onChange={(e) => setParamForm((f) => ({ ...f, sessions: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Max SOS</label>
                  <input type="number" min={0} value={paramForm.max_sos} onChange={(e) => setParamForm((f) => ({ ...f, max_sos: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cerip-forest/70 mb-1">Max RDV</label>
                  <input type="number" min={0} value={paramForm.max_rdv} onChange={(e) => setParamForm((f) => ({ ...f, max_rdv: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setParamModalUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-cerip-magenta border border-cerip-magenta hover:bg-cerip-magenta/10">Annuler</button>
              <button type="button" disabled={savingParam} onClick={handleSaveParametres} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-70">SAUVEGARDER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDemandesPage;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function SuperAdminContenuPage() {
  const [organisations, setOrganisations] = useState([]);
  const [toolboxByOrg, setToolboxByOrg] = useState({});
  const [modulesCountByOrg, setModulesCountByOrg] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: orgs, error: orgErr } = await supabase.from('organisations').select('id, name').order('name');
      if (orgErr) {
        setError(orgErr.message);
        setLoading(false);
        return;
      }
      setOrganisations(orgs ?? []);

      const { data: toolbox } = await supabase.from('toolbox_documents').select('id, organisation_id, title, type, sort_order').order('sort_order');
      const byOrg = {};
      (toolbox ?? []).forEach((d) => {
        if (!byOrg[d.organisation_id]) byOrg[d.organisation_id] = [];
        byOrg[d.organisation_id].push(d);
      });
      setToolboxByOrg(byOrg);

      const { data: modules } = await supabase.from('learning_modules').select('id, organisation_id');
      const countByOrg = {};
      (modules ?? []).forEach((m) => {
        const oid = m.organisation_id ?? '_null';
        countByOrg[oid] = (countByOrg[oid] || 0) + 1;
      });
      setModulesCountByOrg(countByOrg);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">NOUVEAU / CONTENU</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">Boîte à outils (documents) et modules pédagogiques par organisation.</p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Contenu par organisation</h2>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {organisations.map((org) => (
                <li key={org.id} className="px-4 py-4 hover:bg-cerip-forest-light/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-cerip-forest">{org.name}</p>
                      <p className="text-xs text-cerip-forest/70">
                        Boîte à outils : {(toolboxByOrg[org.id] ?? []).length} document(s) · Modules : {modulesCountByOrg[org.id] ?? 0}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/super-admin/organisations/${org.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20"
                      >
                        Détail org
                      </Link>
                    </div>
                  </div>
                  {(toolboxByOrg[org.id] ?? []).length > 0 && (
                    <ul className="mt-2 ml-4 text-xs text-cerip-forest/80 space-y-0.5">
                      {(toolboxByOrg[org.id] ?? []).slice(0, 5).map((d) => (
                        <li key={d.id}>· {d.title} {d.type && `(${d.type})`}</li>
                      ))}
                      {(toolboxByOrg[org.id] ?? []).length > 5 && <li>… et {(toolboxByOrg[org.id] ?? []).length - 5} autre(s)</li>}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-cerip-forest/70">
          Pour ajouter ou modifier des documents de la boîte à outils et des modules, utilisez le détail de chaque organisation (lien « Détail org ») ou les pages dédiées Admin Org (modules, etc.).
        </p>
      </main>
    </div>
  );
}

export default SuperAdminContenuPage;

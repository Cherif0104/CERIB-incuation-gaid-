import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function SuperAdminProgrammesPage() {
  const [programmes, setProgrammes] = useState([]);
  const [projetsByProgramme, setProjetsByProgramme] = useState({});
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: orgs, error: eOrg } = await supabase.from('organisations').select('id, name').order('name');
      if (eOrg) {
        setError(eOrg.message);
        setLoading(false);
        return;
      }
      setOrganisations(orgs || []);

      const { data: progs, error: eProg } = await supabase
        .from('programmes')
        .select('*')
        .order('organisation_id')
        .order('created_at', { ascending: false });
      if (eProg) {
        setError(eProg.message);
        setProgrammes([]);
        setLoading(false);
        return;
      }
      setProgrammes(progs || []);

      if ((progs || []).length > 0) {
        const ids = (progs || []).map((p) => p.id);
        const { data: projs, error: eProj } = await supabase
          .from('projets')
          .select('id, programme_id, name, status')
          .in('programme_id', ids);
        if (!eProj && projs) {
          const byProg = {};
          projs.forEach((pr) => {
            if (!byProg[pr.programme_id]) byProg[pr.programme_id] = [];
            byProg[pr.programme_id].push(pr);
          });
          setProjetsByProgramme(byProg);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Programmes & Projets</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Vue agrégée des programmes et projets par organisation (lecture seule).
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
        ) : programmes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-6 text-center text-cerip-forest/70 text-sm">
            Aucun programme pour le moment. Les organisations peuvent en créer depuis leur espace Admin.
          </div>
        ) : (
          <div className="space-y-6">
            {organisations.filter((o) => programmes.some((p) => p.organisation_id === o.id)).map((org) => (
              <section key={org.id} className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
                <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10 bg-cerip-forest-light/30">
                  {org.name}
                </h2>
                <ul className="divide-y divide-cerip-forest/5">
                  {programmes
                    .filter((p) => p.organisation_id === org.id)
                    .map((prog) => {
                      const projs = projetsByProgramme[prog.id] || [];
                      const done = projs.filter((p) => p.status === 'COMPLETED').length;
                      return (
                        <li key={prog.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-cerip-forest">{prog.name}</p>
                              <p className="text-xs text-cerip-forest/70">
                                {prog.funder || '—'} · {prog.start_date ? new Date(prog.start_date).toLocaleDateString('fr-FR') : '—'} → {prog.end_date ? new Date(prog.end_date).toLocaleDateString('fr-FR') : '—'}
                                {prog.budget != null && ` · ${Number(prog.budget).toLocaleString('fr-FR')}`}
                              </p>
                              <p className="text-xs text-cerip-forest/60 mt-1">
                                {projs.length} projet(s) · {done} terminé(s)
                              </p>
                            </div>
                          </div>
                          {projs.length > 0 && (
                            <ul className="mt-2 ml-4 space-y-1">
                              {projs.map((pr) => (
                                <li key={pr.id} className="text-xs text-cerip-forest/80">
                                  · {pr.name} — {pr.status === 'COMPLETED' ? 'Terminé' : pr.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié'}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default SuperAdminProgrammesPage;

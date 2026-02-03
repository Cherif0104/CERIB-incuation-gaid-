import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';

function AdminOrgDashboard() {
  const { profile } = useOutletContext() ?? {};
  const orgId = profile?.organisation_id;
  const [kpis, setKpis] = useState({
    incubes: null,
    promotions: null,
    coachs: null,
    invitationCodesUsed: null,
    invitationCodesTotal: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const [
        { count: incubes },
        { count: promotions },
        { count: coachs },
        { data: codes },
      ] = await Promise.all([
        supabase.from('incubes').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        supabase.from('staff_users').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('role', 'COACH'),
        supabase.from('invitation_codes').select('code, used_count, max_uses').eq('organisation_id', orgId),
      ]);
      const totalUsed = (codes ?? []).reduce((acc, c) => acc + (Number(c.used_count) || 0), 0);
      const totalMax = (codes ?? []).reduce((acc, c) => acc + (Number(c.max_uses) || 0), 0);
      setKpis({
        incubes: incubes ?? 0,
        promotions: promotions ?? 0,
        coachs: coachs ?? 0,
        invitationCodesUsed: totalUsed,
        invitationCodesTotal: totalMax,
      });
    };
    load().finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">
          Pilotage
        </h1>
        <p className="text-sm text-cerip-forest/70 mt-1">
          Vue d&apos;ensemble de votre organisation — promotions, incubés, coachs et invitations.
        </p>
      </header>
      <main className="flex-1 p-6">
        {!orgId ? (
          <p className="text-sm text-cerip-forest/70">Organisation non définie.</p>
        ) : loading ? (
          <p className="text-sm text-cerip-forest/70">Chargement des indicateurs…</p>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
              <MetricCard
                label="Incubés"
                value={kpis.incubes}
                subText="Dans l'organisation"
                animationDelay={0}
              />
              <MetricCard
                label="Promotions"
                value={kpis.promotions}
                subText="Actives"
                animationDelay={60}
              />
              <MetricCard
                label="Coachs"
                value={kpis.coachs}
                subText="Assignés"
                animationDelay={120}
              />
              <MetricCard
                label="Invitations"
                value={kpis.invitationCodesTotal ? `${kpis.invitationCodesUsed} / ${kpis.invitationCodesTotal}` : '—'}
                subText="Utilisées / max"
                animationDelay={180}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
                <h2 className="text-base font-semibold text-cerip-forest mb-2">
                  Incubés
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Aperçu de l&apos;avancement (parcours, scores, modules).
                </p>
                <Link
                  to="/admin-org/incubes"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Voir les incubés →
                </Link>
              </div>
              <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
                <h2 className="text-base font-semibold text-cerip-forest mb-2">
                  Promotions
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Créez et gérez les promotions (Start-Session, Incubation, etc.).
                </p>
                <Link
                  to="/admin-org/promotions"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Voir les promotions →
                </Link>
              </div>
              <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
                <h2 className="text-base font-semibold text-cerip-forest mb-2">
                  Codes d&apos;invitation
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Générez des codes pour enrôler les incubés.
                </p>
                <a
                  href="/admin-org/codes"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Gérer les codes →
                </a>
              </div>
            </div>
            <div className="mt-4 dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
              <h2 className="text-base font-semibold text-cerip-forest mb-2">
                Matrixage : Incubé + Promo + Coach
              </h2>
              <p className="text-xs text-cerip-forest/70 mb-2">
                Assignez les incubés aux promotions et aux coachs.
              </p>
              <Link
                to="/admin-org/matrixage"
                className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
              >
                Accéder au matrixage →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminOrgDashboard;

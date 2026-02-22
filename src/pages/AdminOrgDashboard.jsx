import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';

function AdminOrgDashboard() {
  const { profile } = useOutletContext() ?? {};
  const orgId = profile?.organisation_id;
  const [kpis, setKpis] = useState({
    incubes: null,
    promotions: null,
    coachs: null,
    modules: null,
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
        { count: modules },
        { data: codes },
      ] = await Promise.all([
        supabase.from('incubes').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        supabase.from('staff_users').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('role', 'COACH'),
        supabase.from('learning_modules').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        supabase.from('invitation_codes').select('code, used_count, max_uses').eq('organisation_id', orgId),
      ]);
      const totalUsed = (codes ?? []).reduce((acc, c) => acc + (Number(c.used_count) || 0), 0);
      const totalMax = (codes ?? []).reduce((acc, c) => acc + (Number(c.max_uses) || 0), 0);
      setKpis({
        incubes: incubes ?? 0,
        promotions: promotions ?? 0,
        coachs: coachs ?? 0,
        modules: modules ?? 0,
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
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20 mb-8">
              <div className="relative z-10">
                <p className="text-cerip-lime font-semibold text-sm uppercase tracking-wider mb-1">Pilotage</p>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">Votre organisation</h2>
                <p className="text-white/85 text-sm md:text-base mb-4">
                  Vue d&apos;ensemble des incubés, promotions, coachs et modules.
                </p>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="text-white/90 text-sm">
                    <strong className="text-cerip-lime tabular-nums">{kpis.incubes}</strong> incubés
                  </span>
                  <span className="text-white/90 text-sm">
                    <strong className="text-cerip-lime tabular-nums">{kpis.modules}</strong> modules
                  </span>
                </div>
                <Link
                  to="/admin-org/incubes"
                  className="inline-block min-w-[200px] py-3 px-6 rounded-2xl text-base font-bold bg-cerip-lime text-cerip-forest hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-center"
                >
                  Voir les incubés
                </Link>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
            </section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cerip-forest/70 mb-4">Vue d&apos;ensemble</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
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
                label="Modules"
                value={kpis.modules}
                subText="Pédagogiques"
                animationDelay={140}
              />
              <MetricCard
                label="Invitations"
                value={kpis.invitationCodesTotal ? `${kpis.invitationCodesUsed} / ${kpis.invitationCodesTotal}` : '—'}
                subText="Utilisées / max"
                animationDelay={180}
              />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cerip-forest/70 mb-4 mt-8">Accès rapides</h2>
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
                  Coachs
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Gérez les coachs et formateurs de votre organisation.
                </p>
                <Link
                  to="/admin-org/coachs"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Voir les coachs →
                </Link>
              </div>
              <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
                <h2 className="text-base font-semibold text-cerip-forest mb-2">
                  Modules pédagogiques
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Créez les parcours et contenus par phase (P1/P2) et par mois (1–4) pour incubés et coachs.
                </p>
                <Link
                  to="/admin-org/modules"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Gérer les modules →
                </Link>
              </div>
              <div className="dashboard-card bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md hover:border-cerip-forest/15 transition-all duration-300">
                <h2 className="text-base font-semibold text-cerip-forest mb-2">
                  Codes d&apos;invitation
                </h2>
                <p className="text-xs text-cerip-forest/70 mb-2">
                  Générez des codes pour enrôler les incubés.
                </p>
                <Link
                  to="/admin-org/codes"
                  className="text-sm font-medium text-cerip-lime hover:text-cerip-lime-dark hover:underline"
                >
                  Gérer les codes →
                </Link>
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

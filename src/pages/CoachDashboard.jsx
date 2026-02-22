import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MetricCard from '../components/MetricCard';

function CoachDashboard() {
  const { profile } = useOutletContext() ?? {};
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({ incubesAssignes: null, demandesEnAttente: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [
          { data: assignationsData },
          { count: demandesEnAttente },
        ] = await Promise.all([
          supabase.from('assignations').select('incube_id').eq('coach_id', profile.id),
          supabase.from('coaching_requests').select('*', { count: 'exact', head: true }).eq('coach_id', profile.id).eq('status', 'PENDING'),
        ]);
        const uniqueIncubes = new Set((assignationsData ?? []).map((a) => a.incube_id)).size;
        setKpis({
          incubesAssignes: uniqueIncubes,
          demandesEnAttente: demandesEnAttente ?? 0,
        });
      } catch (err) {
        setError(err?.message ?? 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  return (
    <div className="flex-1 flex flex-col p-6">
      {loading ? (
        <p className="text-sm text-cerip-forest/70">Chargement des indicateurs…</p>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20 mb-8">
            <div className="relative z-10">
              <p className="text-cerip-lime font-semibold text-sm uppercase tracking-wider mb-1">Coach</p>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">Vos incubés et demandes</h2>
              <p className="text-white/85 text-sm md:text-base mb-4">
                Sélectionnez un étudiant dans la liste « DEMANDES & ALERTES » à gauche pour afficher sa fiche (inspection, validation, paramètres, contact).
              </p>
              <div className="flex flex-wrap items-center gap-6 mb-4">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/80 text-xs uppercase tracking-wider">Incubés assignés</p>
                  <p className="text-2xl font-bold text-cerip-lime tabular-nums">{kpis.incubesAssignes}</p>
                  <p className="text-white/70 text-xs">À votre charge</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/80 text-xs uppercase tracking-wider">Demandes en attente</p>
                  <p className="text-2xl font-bold text-cerip-lime tabular-nums">{kpis.demandesEnAttente}</p>
                  <p className="text-white/70 text-xs">À traiter</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">Choisissez un incubé dans le menu de gauche pour ouvrir sa fiche.</p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
          </section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cerip-forest/70 mb-4">Vue d&apos;ensemble</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
            <MetricCard
              label="Incubés assignés"
              value={kpis.incubesAssignes}
              subText="À votre charge"
              animationDelay={0}
            />
            <MetricCard
              label="Demandes en attente"
              value={kpis.demandesEnAttente}
              subText="À traiter"
              animationDelay={60}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5">
            <p className="text-cerip-forest/60 text-sm">Aucune fiche sélectionnée. Choisissez un incubé dans le menu de gauche pour ouvrir sa fiche.</p>
          </div>
        </>
      )}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
      )}
    </div>
  );
}

export default CoachDashboard;

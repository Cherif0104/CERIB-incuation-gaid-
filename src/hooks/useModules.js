import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const REQUIRED_QUIZ_SCORE_PCT = 70;

export function useModules(profile) {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id || !profile?.current_parcours) return;
    setLoadError(null);
    setLoading(true);
    const load = async () => {
      try {
        const { data: assignationsData } = await supabase
          .from('assignations')
          .select('promotion_id')
          .eq('incube_id', profile.id);
        const promotionIds = [...new Set((assignationsData ?? []).map((a) => a.promotion_id).filter(Boolean))];
        const { data: mods, error: modsError } = await supabase
          .from('learning_modules')
          .select('id, title, description, sort_order, type, payload, parcours_phase, mois, promotion_id')
          .or(`organisation_id.eq.${profile.organisation_id},organisation_id.is.null`)
          .or(`parcours_phase.eq.${profile.current_parcours},parcours_phase.eq.P3`)
          .order('sort_order');
        if (modsError) throw modsError;
        const filtered = (mods ?? []).filter(
          (m) => m.promotion_id == null || promotionIds.length === 0 || promotionIds.includes(m.promotion_id)
        );
        setModules(filtered);
        const { data: prog, error: progError } = await supabase
          .from('incube_module_progress')
          .select('module_id, completed_at, score_pct')
          .eq('incube_id', profile.id);
        if (progError) throw progError;
        const byModule = {};
        (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
        setProgress(byModule);
      } catch (e) {
        setLoadError({ scope: 'modules', message: e?.message || 'Erreur de chargement des modules.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id, profile?.organisation_id, profile?.current_parcours, retryKey]);

  const moisList = useMemo(() => {
    const set = new Set();
    modules.forEach((m) => { if (m.mois != null) set.add(m.mois); });
    const arr = [...set].sort((a, b) => a - b);
    return arr.length > 0 ? arr : [1];
  }, [modules]);

  const isModuleUnlocked = (list, module, index) => {
    if (index === 0) return true;
    const prev = list[index - 1];
    const prevProg = progress[prev?.id];
    if (!prevProg?.completed_at) return false;
    if (prev.type === 'quiz' && prevProg.score_pct != null) return Number(prevProg.score_pct) >= REQUIRED_QUIZ_SCORE_PCT;
    return true;
  };

  const nextModule = useMemo(() => {
    return modules.find((m, i) => {
      if (i === 0) return !progress[m.id]?.completed_at;
      const prev = modules[i - 1];
      const prevProg = progress[prev?.id];
      if (!prevProg?.completed_at) return false;
      if (prev.type === 'quiz' && prevProg.score_pct != null && Number(prevProg.score_pct) < REQUIRED_QUIZ_SCORE_PCT) return false;
      return !progress[m.id]?.completed_at;
    });
  }, [modules, progress]);

  const markCompleted = async (module, scorePct = null) => {
    if (!profile?.id || !module?.id) return;
    const { error } = await supabase.from('incube_module_progress').upsert(
      { incube_id: profile.id, module_id: module.id, completed_at: new Date().toISOString(), score_pct: scorePct },
      { onConflict: 'incube_id,module_id' }
    );
    if (!error) {
      const { data: prog } = await supabase.from('incube_module_progress').select('module_id, completed_at, score_pct').eq('incube_id', profile.id);
      const byModule = {};
      (prog ?? []).forEach((p) => { byModule[p.module_id] = p; });
      setProgress(byModule);
    }
    return !error;
  };

  const retry = () => setRetryKey((k) => k + 1);

  return {
    modules,
    progress,
    loading,
    loadError,
    moisList,
    nextModule,
    REQUIRED_QUIZ_SCORE_PCT,
    isModuleUnlocked,
    markCompleted,
    retry,
  };
}

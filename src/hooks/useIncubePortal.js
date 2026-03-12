import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCoachData } from './useCoachData';
import { useModules } from './useModules';
import { useCoaching } from './useCoaching';
import { useToolbox } from './useToolbox';
import { useMoisValidation } from './useMoisValidation';

export function useIncubePortal(profile, onRefreshProfile) {
  const { coachId, coachName, loadError: coachError, retry: retryCoach } = useCoachData(profile?.id);
  const { moisValidated, loadError: moisError, retry: retryMois } = useMoisValidation(profile?.id);
  const { documents: toolboxDocuments, loadError: toolboxError, retry: retryToolbox } = useToolbox(profile?.organisation_id);
  const coaching = useCoaching(profile?.id, coachId, profile?.organisation_id);
  const modulesData = useModules(profile);
  const [promotionNames, setPromotionNames] = useState([]);

  const [canStartExam, setCanStartExam] = useState(false);
  const [openSession, setOpenSession] = useState(null);

  useEffect(() => {
    if (!profile?.organisation_id || profile?.global_status !== 'COACH_VALIDATED') {
      setCanStartExam(false);
      setOpenSession(null);
      return;
    }
    const now = new Date().toISOString();
    supabase
      .from('certification_sessions')
      .select('id, name, start_at, end_at')
      .eq('organisation_id', profile.organisation_id)
      .eq('status', 'OPEN')
      .lte('start_at', now)
      .gte('end_at', now)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setCanStartExam(false);
          setOpenSession(null);
          return;
        }
        setOpenSession(data);
        setCanStartExam(true);
      })
      .catch(() => {
        setCanStartExam(false);
        setOpenSession(null);
      });
  }, [profile?.organisation_id, profile?.global_status]);

  const loadError = coachError || moisError || toolboxError || coaching.loadError || modulesData.loadError;

  const retryLoad = (scope) => {
    if (scope === 'coach') retryCoach();
    else if (scope === 'mois') retryMois();
    else if (scope === 'toolbox') retryToolbox();
    else if (scope === 'messages' || scope === 'coaching') coaching.retry();
    else if (scope === 'modules') modulesData.retry();
  };

  return {
    coachId,
    coachName,
    moisValidated,
    toolboxDocuments,
    promotionNames,
    ...coaching,
    ...modulesData,
    canStartExam,
    openSession,
    loadError,
    retryLoad,
    onRefreshProfile,
  };
}

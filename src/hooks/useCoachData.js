import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCoachData(profileId) {
  const [coachId, setCoachId] = useState(null);
  const [coachName, setCoachName] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profileId) return;
    setLoadError(null);
    const fetchCoach = async () => {
      try {
        const { data, error } = await supabase
          .from('assignations')
          .select('coach_id')
          .eq('incube_id', profileId)
          .limit(1);
        if (error) throw error;
        const cid = data?.[0]?.coach_id ?? null;
        setCoachId(cid);
        if (cid) {
          const { data: staff, error: staffError } = await supabase
            .from('staff_users')
            .select('full_name')
            .eq('id', cid)
            .single();
          if (staffError) throw staffError;
          setCoachName(staff?.full_name ?? null);
        } else {
          setCoachName(null);
        }
      } catch (e) {
        setLoadError({ scope: 'coach', message: e?.message || 'Erreur de chargement du coach.' });
      }
    };
    fetchCoach();
  }, [profileId, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { coachId, coachName, loadError, retry };
}

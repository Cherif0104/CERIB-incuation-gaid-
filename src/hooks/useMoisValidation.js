import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMoisValidation(profileId) {
  const [moisValidated, setMoisValidated] = useState(new Set());
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profileId) return;
    setLoadError(null);
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('incube_mois_validation')
          .select('mois_num')
          .eq('incube_id', profileId);
        if (error) throw error;
        setMoisValidated(new Set((data ?? []).map((r) => r.mois_num)));
      } catch (e) {
        setLoadError({ scope: 'mois', message: e?.message || 'Erreur de chargement des mois validés.' });
      }
    };
    fetch();
  }, [profileId, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { moisValidated, loadError, retry };
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useToolbox(organisationId) {
  const [documents, setDocuments] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!organisationId) return;
    setLoadError(null);
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('toolbox_documents')
          .select('id, title, type, file_url, sort_order')
          .eq('organisation_id', organisationId)
          .order('sort_order');
        if (error) throw error;
        setDocuments(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'toolbox', message: e?.message || 'Erreur de chargement de la boîte à outils.' });
      }
    };
    fetch();
  }, [organisationId, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { documents, loadError, retry };
}

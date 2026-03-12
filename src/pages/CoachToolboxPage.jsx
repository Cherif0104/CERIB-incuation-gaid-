import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Page Coach : consultation des documents de la boîte à outils de l'organisation.
 * Lecture seule — la gestion (ajout/modification) est réservée à l'Admin Org.
 */
function CoachToolboxPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('toolbox_documents')
        .select('id, title, type, file_url, sort_order')
        .eq('organisation_id', orgId)
        .order('sort_order');
      if (!error) setDocuments(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [orgId]);

  const isStoragePath = (url) => typeof url === 'string' && url.trim() !== '' && !url.trim().toLowerCase().startsWith('http');

  const handleDownload = async (doc) => {
    if (isStoragePath(doc.file_url)) {
      const { data } = await supabase.storage.from('toolbox-documents').createSignedUrl(doc.file_url, 3600);
      if (data?.signedUrl) window.open(data.signedUrl);
    } else {
      window.open(doc.file_url, '_blank');
    }
  };

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-cerip-forest/70">Organisation non définie.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Boîte à outils</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Documents mis à disposition des incubés. La gestion (ajout, modification) se fait depuis l&apos;Admin Organisation.
        </p>
      </header>
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-cerip-forest/70 text-sm">Chargement…</p>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-cerip-forest/10 bg-cerip-forest-light/30 p-6 text-center">
            <p className="text-cerip-forest/70 text-sm">Aucun document dans la boîte à outils pour le moment.</p>
            <p className="text-xs text-cerip-forest/60 mt-2">L&apos;administrateur de l&apos;organisation peut en ajouter.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white border border-cerip-forest/10 hover:border-cerip-forest/20"
              >
                <div>
                  <span className="font-medium text-cerip-forest">{doc.title}</span>
                  {doc.type && <span className="text-xs text-cerip-forest/60 ml-2">({doc.type})</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark"
                >
                  Télécharger
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default CoachToolboxPage;

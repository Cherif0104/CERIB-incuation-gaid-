import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function IncubeToolboxPage() {
  const navigate = useNavigate();
  const { profile, promotionNames } = useOutletContext() || {};
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile?.organisation_id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('toolbox_documents')
        .select('id, title, type, file_url, sort_order')
        .eq('organisation_id', profile.organisation_id)
        .order('sort_order');
      if (!error) setDocuments(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [profile?.organisation_id]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate('/incube')}
        className="mb-6 text-sm font-medium text-cerip-forest/80 hover:text-cerip-forest flex items-center gap-1"
      >
        ← Retour au parcours
      </button>
      <div className="bg-cerip-forest-mid text-white rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-cerip-lime mb-1">Boîte à outils</h2>
        {promotionNames?.length > 0 && (
          <p className="text-white/80 text-xs mb-4">Ressources de ta cohorte {promotionNames[0]}</p>
        )}
        {(!promotionNames || promotionNames.length === 0) && <div className="mb-4" />}
        {loading ? (
          <p className="text-white/80 text-sm">Chargement…</p>
        ) : documents.length === 0 ? (
          <p className="text-white/80 text-sm">Aucun document pour le moment.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {documents.map((doc) => {
              const isStoragePath = doc.file_url && !String(doc.file_url).trim().toLowerCase().startsWith('http');
              return (
                <li key={doc.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{doc.title}</span>
                  {isStoragePath ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const { data } = await supabase.storage.from('toolbox-documents').createSignedUrl(doc.file_url, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-cerip-forest hover:bg-white"
                    >
                      Télécharger
                    </button>
                  ) : (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cerip-lime text-cerip-forest hover:bg-white">
                      Télécharger
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" onClick={() => navigate('/incube')} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-magenta text-white hover:opacity-90">
          Retour au parcours
        </button>
      </div>
    </div>
  );
}

export default IncubeToolboxPage;

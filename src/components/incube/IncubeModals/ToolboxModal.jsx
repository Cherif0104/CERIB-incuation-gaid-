import React from 'react';
import { supabase } from '../../../lib/supabaseClient';

function ToolboxModal({ documents, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
      <div className="bg-cerip-forest-mid text-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-cerip-lime mb-4">Boîte à outils</h3>
        <ul className="space-y-3 mb-6">
          {documents.length === 0 ? (
            <li className="text-white/80 text-sm">Aucun document pour le moment.</li>
          ) : (
            documents.map((doc) => {
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
            })
          )}
        </ul>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-magenta text-white hover:opacity-90">
          Fermer
        </button>
      </div>
    </div>
  );
}

export default ToolboxModal;

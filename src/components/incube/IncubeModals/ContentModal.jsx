import React from 'react';
import { getEmbedVideoUrl } from '../incubeUtils';

function ContentModal({ module, signedDocumentUrl, signedVideoUrl, onClose, onMarkCompleted }) {
  const p = module?.payload || {};
  const videoSrc = p.video_file_path ? signedVideoUrl : p.video_url;
  const docSrc = p.document_file_path ? signedDocumentUrl : p.document_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
        <h3 className="text-base font-semibold text-cerip-forest mb-4">{module?.title}</h3>
        {module?.type === 'text' && p.body != null && p.body !== '' && (
          <div className="text-sm text-cerip-forest/90 whitespace-pre-wrap mb-6">{p.body}</div>
        )}
        {module?.type === 'text' && (docSrc || (p.document_file_path && signedDocumentUrl)) && (
          <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
            <iframe title="Document" src={docSrc || signedDocumentUrl} className="w-full h-full" />
          </div>
        )}
        {module?.type === 'document' && (docSrc || (p.document_file_path && signedDocumentUrl)) && (
          <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
            <iframe title="Document" src={docSrc || signedDocumentUrl} className="w-full h-full" />
          </div>
        )}
        {module?.type === 'video' && (p.video_url || p.video_file_path) && (() => {
          if (!videoSrc) return <p className="mb-6 text-sm text-cerip-forest/70">Chargement de la vidéo…</p>;
          const embedUrl = getEmbedVideoUrl(videoSrc);
          return embedUrl ? (
            <div className="aspect-video mb-6">
              <iframe title={module?.title} src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen />
            </div>
          ) : (
            <div className="mb-6">
              <video controls className="w-full rounded-lg" src={videoSrc}>
                Ton navigateur ne supporte pas la lecture. <a href={videoSrc} target="_blank" rel="noopener noreferrer" className="text-cerip-lime underline">Ouvrir le lien</a>
              </video>
            </div>
          );
        })()}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
            Fermer
          </button>
          <button
            type="button"
            onClick={async () => {
              await onMarkCompleted(module);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
          >
            {module?.type === 'text' ? 'Marquer comme lu' : module?.type === 'document' ? 'Marquer comme consulté' : 'Marquer comme vu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentModal;

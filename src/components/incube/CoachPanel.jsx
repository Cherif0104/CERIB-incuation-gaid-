import React, { useState } from 'react';

const TABS = ['messages', 'rdv', 'mes_rdv', 'sos'];

function CoachPanel({
  coachName,
  coachingRequests,
  messages,
  onDemanderCoaching,
  onDemanderRdv,
  onSendMessage,
  onSendSosUrgence,
  onClose,
  isMobile,
  embeddedPage = false,
}) {
  const [activeTab, setActiveTab] = useState('messages');
  const [rdvMessage, setRdvMessage] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [newMessageBody, setNewMessageBody] = useState('');
  const [sosBody, setSosBody] = useState('');
  const [sending, setSending] = useState(false);
  const [rdvSending, setRdvSending] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [sosSending, setSosSending] = useState(false);

  const handleDemanderCoaching = async () => {
    setSending(true);
    const ok = await onDemanderCoaching(coachMessage);
    setSending(false);
    if (ok) {
      setCoachMessage('');
      setActiveTab('messages');
    }
  };

  const handleDemanderRdv = async () => {
    setRdvSending(true);
    const ok = await onDemanderRdv(rdvMessage);
    setRdvSending(false);
    if (ok) {
      setRdvMessage('');
      setActiveTab('mes_rdv');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageBody.trim()) return;
    setMessageSending(true);
    const ok = await onSendMessage(newMessageBody);
    setMessageSending(false);
    if (ok) setNewMessageBody('');
  };

  const handleSosUrgence = async () => {
    if (!sosBody.trim()) return;
    setSosSending(true);
    const ok = await onSendSosUrgence(sosBody);
    setSosSending(false);
    if (ok) {
      setSosBody('');
      setActiveTab('messages');
    }
  };

  const rdvList = coachingRequests.filter((r) => r.request_type === 'RDV');

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-cerip-forest/10 flex flex-col ${isMobile ? 'fixed inset-4 z-50 md:max-w-lg md:max-h-[85vh] md:inset-auto' : embeddedPage ? 'w-full min-h-0 flex-1' : 'max-w-lg max-h-[85vh]'}`}>
      <div className="p-4 border-b border-cerip-forest/10 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-lg font-bold text-cerip-forest">Mon coach</h3>
          {coachName ? (
            <span className="text-sm text-cerip-forest/70 block mt-0.5">{coachName}</span>
          ) : (
            <span className="text-sm text-cerip-forest/60 block mt-0.5">Aucun coach assigné. Contacte ton organisation pour être assigné à un coach.</span>
          )}
        </div>
        {!embeddedPage && onClose && (
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-cerip-forest/70 hover:bg-cerip-forest/10" aria-label="Fermer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="flex border-b border-cerip-forest/10 bg-cerip-forest-light/30">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${activeTab === tab ? 'bg-white text-cerip-forest border-b-2 border-cerip-lime' : 'text-cerip-forest/70 hover:bg-white/50'}`}
          >
            {tab === 'messages' && 'Messages'}
            {tab === 'rdv' && 'Demander RDV'}
            {tab === 'mes_rdv' && `Mes RDV (${rdvList.length})`}
            {tab === 'sos' && 'SOS urgence'}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {!coachName && (
          <div className="rounded-xl bg-cerip-forest/5 border border-cerip-forest/10 p-4 mb-4">
            <p className="text-sm text-cerip-forest/80">Tu n&apos;as pas encore de coach assigné. Demande à ton organisation (Admin) de t&apos;assigner un coach via le Matrixage. Une fois assigné, tu pourras envoyer des messages, demander des RDV et des sessions de coaching.</p>
          </div>
        )}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="space-y-2 min-h-[120px] max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-cerip-forest/70">{coachName ? 'Aucun message.' : 'Assignation en attente.'}</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`text-sm p-2 rounded-lg ${msg.from_incube ? 'bg-cerip-lime/15 ml-4' : 'bg-cerip-forest/10 mr-4'}`}>
                    {msg.is_urgence && <span className="text-cerip-magenta font-medium text-xs">SOS </span>}
                    {msg.body}
                    <span className="block text-xs text-cerip-forest/60 mt-1">{new Date(msg.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                placeholder={coachName ? 'Message rapide…' : 'Assignation en attente'}
                disabled={!coachName}
                className="flex-1 min-h-[60px] px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={!coachName || messageSending || !newMessageBody.trim()}
                onClick={handleSendMessage}
                className="self-end px-4 py-2 rounded-lg text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-50"
              >
                {messageSending ? '…' : 'Envoyer'}
              </button>
            </div>
            <div className="pt-2 border-t border-cerip-forest/10">
              <p className="text-xs text-cerip-forest/70 mb-2">Demande de session coaching</p>
              <textarea
                value={coachMessage}
                onChange={(e) => setCoachMessage(e.target.value)}
                placeholder={coachName ? 'Précisez votre besoin (optionnel)…' : 'Assignation en attente'}
                disabled={!coachName}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button type="button" disabled={!coachName || sending} onClick={handleDemanderCoaching} className="w-full py-2 rounded-lg text-sm font-medium bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20 disabled:opacity-50">
                {sending ? 'Envoi…' : 'Demander une session'}
              </button>
            </div>
          </div>
        )}
        {activeTab === 'rdv' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-cerip-forest">Message (optionnel)</label>
            <textarea
              value={rdvMessage}
              onChange={(e) => setRdvMessage(e.target.value)}
              placeholder={coachName ? 'Précisez votre besoin si vous le souhaitez…' : 'Assignation en attente'}
              disabled={!coachName}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button type="button" disabled={!coachName || rdvSending} onClick={handleDemanderRdv} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark disabled:opacity-70">
              {rdvSending ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        )}
        {activeTab === 'mes_rdv' && (
          <div className="space-y-4">
            {rdvList.length === 0 ? (
              <p className="text-sm text-cerip-forest/70">Aucun RDV programmé pour le moment.</p>
            ) : (
              rdvList.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-cerip-forest/10 bg-cerip-forest-light/30 space-y-2">
                  <p className="text-xs font-medium text-cerip-forest/70">
                    {r.scheduled_at
                      ? new Date(r.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
                      : new Date(r.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                    {' · '}
                    <span className={r.status === 'PENDING' ? 'text-cerip-magenta' : 'text-cerip-forest/80'}>{r.status === 'PENDING' ? 'À venir' : 'Passé'}</span>
                  </p>
                  {r.objectif && <p className="text-sm text-cerip-forest"><span className="text-cerip-forest/70">Objectif :</span> {r.objectif}</p>}
                  {r.travail_preparatoire && <p className="text-sm text-cerip-forest/80"><span className="text-cerip-forest/70">Travail préparatoire :</span> {r.travail_preparatoire}</p>}
                  {r.meeting_link && (
                    <a href={r.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-cerip-forest hover:bg-cerip-lime-dark">
                      Rejoindre le RDV
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <p className="text-sm text-cerip-forest/80">{coachName ? "En cas d'urgence, ton coach sera notifié immédiatement." : "Assignation en attente. Une fois ton coach assigné, tu pourras envoyer des alertes SOS."}</p>
            <textarea
              value={sosBody}
              onChange={(e) => setSosBody(e.target.value)}
              placeholder={coachName ? 'Décrivez votre urgence…' : 'Assignation en attente'}
              disabled={!coachName}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-cerip-forest/20 text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={!coachName || sosSending || !sosBody.trim()}
              onClick={handleSosUrgence}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-70"
            >
              {sosSending ? 'Envoi…' : 'Envoyer SOS'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CoachPanel;

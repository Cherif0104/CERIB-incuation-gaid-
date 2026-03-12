import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CoachPanel from '../components/incube/CoachPanel';
import { useIncubePortal } from '../hooks/useIncubePortal';

function IncubeCoachPage() {
  const navigate = useNavigate();
  const { profile, onRefreshProfile } = useOutletContext();
  const data = useIncubePortal(profile, onRefreshProfile);
  const {
    coachName,
    coachingRequests,
    messages,
    demanderCoaching,
    demanderRdv,
    sendMessage,
    sendSosUrgence,
  } = data;

  return (
    <div className="flex flex-col h-full p-4 md:p-6">
      <button
        type="button"
        onClick={() => navigate('/incube')}
        className="mb-4 self-start text-sm font-medium text-cerip-forest/80 hover:text-cerip-forest flex items-center gap-1"
      >
        ← Retour au parcours
      </button>
      <div className="flex-1 min-h-0 flex flex-col max-w-2xl w-full mx-auto">
        <CoachPanel
          coachName={coachName}
          coachingRequests={coachingRequests}
          messages={messages}
          onDemanderCoaching={demanderCoaching}
          onDemanderRdv={demanderRdv}
          onSendMessage={sendMessage}
          onSendSosUrgence={sendSosUrgence}
          onClose={() => navigate('/incube')}
          isMobile={false}
          embeddedPage
        />
      </div>
    </div>
  );
}

export default IncubeCoachPage;

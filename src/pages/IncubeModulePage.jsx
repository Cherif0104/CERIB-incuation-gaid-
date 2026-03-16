import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { getEmbedVideoUrl } from '../components/incube/incubeUtils';

const REQUIRED_QUIZ_SCORE_PCT = 70;

function IncubeModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { profile, onRefreshProfile } = useOutletContext();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState(null);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (!moduleId || !profile?.id) return;
    const load = async () => {
      const { data: mod, error } = await supabase
        .from('learning_modules')
        .select('id, title, type, payload')
        .eq('id', moduleId)
        .single();
      if (error || !mod) {
        setLoading(false);
        return;
      }
      setModule(mod);
      if (mod.type === 'quiz') {
        const { data: questions } = await supabase
          .from('module_quiz_questions')
          .select('id, question_text, sort_order')
          .eq('module_id', mod.id)
          .order('sort_order');
        const qs = questions ?? [];
        const withChoices = await Promise.all(
          qs.map(async (q) => {
            const { data: choices } = await supabase
              .from('module_quiz_choices')
              .select('id, choice_text, is_correct, sort_order')
              .eq('question_id', q.id)
              .order('sort_order');
            return { ...q, choices: choices ?? [] };
          })
        );
        const valid = withChoices.filter(
          (q) => (q.question_text || '').trim() && (q.choices || []).length >= 2 && (q.choices || []).some((c) => c.is_correct)
        );
        setQuizQuestions(valid);
      } else {
        const p = mod.payload || {};
        if (p.document_file_path) {
          const { data: d } = await supabase.storage.from('module-assets').createSignedUrl(p.document_file_path, 3600);
          setSignedDocumentUrl(d?.signedUrl ?? null);
        }
        if (p.video_file_path) {
          const { data: d } = await supabase.storage.from('module-assets').createSignedUrl(p.video_file_path, 3600);
          setSignedVideoUrl(d?.signedUrl ?? null);
        }
      }
      setLoading(false);
    };
    load();
  }, [moduleId, profile?.id]);

  const markCompleted = async (scorePct = null) => {
    if (!profile?.id || !module?.id) return false;
    const { error } = await supabase.from('incube_module_progress').upsert(
      { incube_id: profile.id, module_id: module.id, completed_at: new Date().toISOString(), score_pct: scorePct },
      { onConflict: 'incube_id,module_id' }
    );
    if (!error) onRefreshProfile?.();
    return !error;
  };

  const submitQuiz = async () => {
    if (!module || !profile?.id) return;
    const total = quizQuestions.length;
    let correct = 0;
    quizQuestions.forEach((q) => {
      const choiceId = quizAnswers[q.id];
      const choice = q.choices?.find((c) => c.id === choiceId);
      if (choice?.is_correct) correct += 1;
    });
    const scorePct = total ? Math.round((correct / total) * 100 * 100) / 100 : 0;
    const passed = scorePct >= REQUIRED_QUIZ_SCORE_PCT;
    setQuizSubmitting(true);
    // Ne marquer complété que si le quiz est réussi (≥ 70 %)
    const ok = passed ? await markCompleted(scorePct) : true;
    setQuizSubmitting(false);
    if (ok) {
      setQuizResult({ scorePct, passed });
      if (!passed) {
        toast.error(`Score insuffisant (${scorePct} %). Il faut au moins ${REQUIRED_QUIZ_SCORE_PCT} % pour débloquer l'étape suivante.`);
      }
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleBack = () => navigate('/incube');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-cerip-forest/80">Chargement…</p>
      </div>
    );
  }
  if (!module) {
    return (
      <div className="p-6">
        <p className="text-cerip-forest/80">Module introuvable.</p>
        <button type="button" onClick={handleBack} className="mt-4 text-cerip-lime font-medium hover:underline">
          Retour au parcours
        </button>
      </div>
    );
  }

  const p = module.payload || {};
  const videoSrc = p.video_file_path ? signedVideoUrl : p.video_url;
  const docSrc = p.document_file_path ? signedDocumentUrl : p.document_url;

  if (module.type === 'quiz') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button type="button" onClick={handleBack} className="mb-6 text-sm font-medium text-cerip-forest/80 hover:text-cerip-forest flex items-center gap-1">
          ← Retour au parcours
        </button>
        <div className="bg-white rounded-2xl border border-cerip-forest/10 shadow-sm p-6">
          {quizResult ? (
            <>
              <h2 className="text-lg font-bold text-cerip-forest mb-2">Résultat</h2>
              <p className="text-2xl font-bold text-cerip-lime mb-1">Bien joué !</p>
              <p className="text-sm text-cerip-forest/80 mb-2">Score : <strong className="tabular-nums">{quizResult.scorePct} %</strong></p>
              <p className="text-sm text-cerip-forest/80 mb-6">
                {quizResult.passed ? 'Étape suivante débloquée.' : `Rejoue pour débloquer (note ≥ ${REQUIRED_QUIZ_SCORE_PCT} %).`}
              </p>
              <button type="button" onClick={handleBack} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
                Retour au parcours
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-cerip-forest mb-4">{module.title}</h2>
              <div className="space-y-4">
                {quizQuestions.map((q) => (
                  <div key={q.id}>
                    <p className="text-sm font-medium text-cerip-forest mb-2">{q.question_text}</p>
                    <div className="space-y-1">
                      {q.choices?.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={quizAnswers[q.id] === c.id}
                            onChange={() => setQuizAnswers((a) => ({ ...a, [q.id]: c.id }))}
                            className="text-cerip-lime focus:ring-cerip-lime"
                          />
                          <span className="text-sm text-cerip-forest/90">{c.choice_text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button type="button" onClick={handleBack} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={quizSubmitting || Object.keys(quizAnswers).length < quizQuestions.length}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
                >
                  {quizSubmitting ? 'Envoi…' : 'Valider le quiz'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button type="button" onClick={handleBack} className="mb-6 text-sm font-medium text-cerip-forest/80 hover:text-cerip-forest flex items-center gap-1">
        ← Retour au parcours
      </button>
      <div className="bg-white rounded-2xl border border-cerip-forest/10 shadow-sm p-6">
        <h2 className="text-lg font-bold text-cerip-forest mb-4">{module.title}</h2>
        {module.type === 'text' && p.body != null && p.body !== '' && (
          <div className="text-sm text-cerip-forest/90 whitespace-pre-wrap mb-6">{p.body}</div>
        )}
        {module.type === 'text' && (docSrc || (p.document_file_path && signedDocumentUrl)) && (
          <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
            <iframe title="Document" src={docSrc || signedDocumentUrl} className="w-full h-full" />
          </div>
        )}
        {module.type === 'document' && (docSrc || (p.document_file_path && signedDocumentUrl)) && (
          <div className="mb-6 h-[60vh] min-h-[300px] rounded-lg border border-cerip-forest/10 overflow-hidden">
            <iframe title="Document" src={docSrc || signedDocumentUrl} className="w-full h-full" />
          </div>
        )}
        {module.type === 'video' && (p.video_url || p.video_file_path) && (() => {
          if (!videoSrc) return <p className="mb-6 text-sm text-cerip-forest/70">Chargement de la vidéo…</p>;
          const embedUrl = getEmbedVideoUrl(videoSrc);
          return embedUrl ? (
            <div className="aspect-video mb-6">
              <iframe title={module.title} src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen />
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
          <button type="button" onClick={handleBack} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
            Fermer
          </button>
          <button
            type="button"
            onClick={async () => { await markCompleted(); handleBack(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
          >
            {module.type === 'text' ? 'Marquer comme lu' : module.type === 'document' ? 'Marquer comme consulté' : 'Marquer comme vu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncubeModulePage;

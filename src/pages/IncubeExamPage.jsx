import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const EXAM_DURATION_MINUTES = 30;

function IncubeExamPage({ profile, onDone, onLogout }) {
  const navigate = useNavigate();
  const submittedRef = useRef(false);
  const [candidate, setCandidate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_MINUTES * 60);

  useEffect(() => {
    if (!profile?.id || !profile?.organisation_id) return;
    const load = async () => {
      const { data: cand } = await supabase
        .from('certification_candidates')
        .select('id, exam_status, exam_result, exam_started_at')
        .eq('incube_id', profile.id)
        .eq('exam_status', 'IN_PROGRESS')
        .maybeSingle();
      if (!cand) {
        setLoading(false);
        return;
      }
      setCandidate(cand);
      const started = cand.exam_started_at ? new Date(cand.exam_started_at).getTime() : Date.now();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const total = EXAM_DURATION_MINUTES * 60;
      setSecondsLeft(Math.max(0, total - elapsed));

      const { data: qs } = await supabase
        .from('exam_questions')
        .select('id, question_text, sort_order')
        .eq('organisation_id', profile.organisation_id)
        .order('sort_order');
      const withChoices = await Promise.all(
        (qs ?? []).map(async (q) => {
          const { data: choices } = await supabase
            .from('exam_question_choices')
            .select('id, choice_text, sort_order')
            .eq('question_id', q.id)
            .order('sort_order');
          return { ...q, choices: choices ?? [] };
        })
      );
      setQuestions(withChoices);
      setLoading(false);
    };
    load();
  }, [profile?.id, profile?.organisation_id]);

  useEffect(() => {
    if (!candidate || result) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [candidate, result]);

  useEffect(() => {
    if (secondsLeft === 0 && !result && candidate && !submittedRef.current) {
      submittedRef.current = true;
      handleSubmit();
    }
  }, [secondsLeft, candidate, result]);

  const handleSubmit = async () => {
    if (!candidate || submitting) return;
    setSubmitting(true);
    setError(null);
    const pAnswers = Object.entries(answers).map(([questionId, choiceId]) => ({
      question_id: questionId,
      choice_id: choiceId,
    }));
    const { data, error: rpcError } = await supabase.rpc('submit_certification_exam', {
      p_candidate_id: candidate.id,
      p_answers: pAnswers,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (data?.ok === false) {
      setError(data.error ?? 'Erreur lors de la soumission');
      return;
    }
    setResult(data);
    onDone?.();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cerip-forest-light flex items-center justify-center">
        <p className="text-cerip-forest">Chargement de l’examen…</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-cerip-forest-light flex flex-col items-center justify-center p-6">
        <p className="text-cerip-forest mb-4">Aucun examen en cours.</p>
        <button
          type="button"
          onClick={() => navigate('/incube', { replace: true })}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
        >
          Retour à mon parcours
        </button>
      </div>
    );
  }

  if (result && result.ok !== false) {
    const ok = result.result === 'CERTIFIED';
    return (
      <div className="min-h-screen bg-cerip-forest-light flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-cerip-forest/10 bg-white">
          <span className="font-semibold text-cerip-forest text-sm">Savana · Examen</span>
          <button
            type="button"
            onClick={() => navigate('/incube', { replace: true })}
            className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
          >
            Retour au parcours
          </button>
        </header>
        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className={`bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-8 max-w-md w-full text-center ${ok ? 'border-cerip-lime/30' : ''}`}>
            <h1 className={`text-xl font-semibold mb-2 ${ok ? 'text-cerip-lime' : 'text-cerip-magenta'}`}>
              {ok ? 'Félicitations, vous êtes certifié !' : 'Examen terminé'}
            </h1>
            <p className="text-sm text-cerip-forest/80 mb-4">
              Score : {result.score_pct != null ? `${Number(result.score_pct)} %` : '—'}
            </p>
            <p className="text-xs text-cerip-forest/70">
              {result.result === 'CERTIFIED' ? 'Vous avez atteint le seuil requis (≥ 70 %).' : 'Le seuil de 70 % n’a pas été atteint.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/incube', { replace: true })}
              className="mt-6 px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
            >
              Retour à mon parcours
            </button>
          </div>
        </main>
      </div>
    );
  }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-cerip-forest-light flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-cerip-forest/10 bg-white">
        <span className="font-semibold text-cerip-forest text-sm">Savana · Examen de certification</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-medium ${secondsLeft <= 300 ? 'text-cerip-magenta' : 'text-cerip-forest'}`} aria-live="polite">
            {timeStr}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-magenta hover:bg-cerip-magenta-light transition"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 mb-4">{error}</div>
        )}
        <p className="text-xs text-cerip-forest/70 mb-6">
          Répondez à toutes les questions puis validez. Temps restant : {timeStr}. L’examen sera soumis automatiquement à la fin du temps.
        </p>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 p-4">
              <p className="text-sm font-medium text-cerip-forest mb-3">
                {idx + 1}. {q.question_text}
              </p>
              <div className="space-y-2">
                {q.choices.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer rounded-lg border border-cerip-forest/10 px-3 py-2 hover:bg-cerip-forest-light/30">
                    <input
                      type="radio"
                      name={`exam-q-${q.id}`}
                      checked={answers[q.id] === c.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                      className="text-cerip-lime focus:ring-cerip-lime"
                    />
                    <span className="text-sm text-cerip-forest/90">{c.choice_text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {questions.length === 0 && (
          <p className="text-sm text-cerip-forest/70 text-center py-8">Aucune question configurée pour cet examen. Contactez le certificateur.</p>
        )}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
          >
            {submitting ? 'Envoi…' : 'Soumettre l’examen'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default IncubeExamPage;

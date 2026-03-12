import React from 'react';

function QuizModal({ module, questions, answers, result, submitting, requiredScore, onChangeAnswer, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        {result ? (
          <>
            <h3 className="text-base font-semibold text-cerip-forest mb-2">Résultat</h3>
            <p className="text-2xl font-bold text-cerip-lime mb-1">Bien joué !</p>
            <p className="text-sm text-cerip-forest/80 mb-2">Score : <strong className="tabular-nums">{result.scorePct} %</strong></p>
            <p className="text-sm text-cerip-forest/80 mb-6">
              {result.passed ? 'Étape suivante débloquée.' : `Rejoue pour débloquer (note ≥ ${requiredScore} %).`}
            </p>
            <button type="button" onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark transition">
              Retour au parcours
            </button>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-cerip-forest mb-4">{module?.title}</h3>
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-cerip-forest mb-2">{q.question_text}</p>
                  <div className="space-y-1">
                    {q.choices?.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === c.id}
                          onChange={() => onChangeAnswer(q.id, c.id)}
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
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10 transition">
                Annuler
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
              >
                {submitting ? 'Envoi…' : 'Valider le quiz'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default QuizModal;

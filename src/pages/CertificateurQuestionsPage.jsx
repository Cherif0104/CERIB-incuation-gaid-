import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function CertificateurQuestionsPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ question_text: '', choices: [{ choice_text: '', is_correct: false }] });

  const fetchQuestions = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('exam_questions')
      .select('id, question_text, sort_order')
      .eq('organisation_id', orgId)
      .order('sort_order');
    if (!e) {
      const withChoices = await Promise.all(
        (data || []).map(async (q) => {
          const { data: choices } = await supabase
            .from('exam_question_choices')
            .select('id, choice_text, is_correct, sort_order')
            .eq('question_id', q.id)
            .order('sort_order');
          return { ...q, choices: choices || [] };
        })
      );
      setQuestions(withChoices);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchQuestions().finally(() => setLoading(false));
  }, [orgId]);

  const openAdd = () => {
    setForm({ question_text: '', choices: [{ choice_text: '', is_correct: false }] });
    setModal('add');
    setError(null);
  };

  const openEdit = (q) => {
    setForm({
      question_text: q.question_text,
      choices: (q.choices || []).length
        ? q.choices.map((c) => ({ id: c.id, choice_text: c.choice_text, is_correct: c.is_correct }))
        : [{ choice_text: '', is_correct: false }],
    });
    setModal(q.id);
    setError(null);
  };

  const addChoice = () => {
    setForm((f) => ({ ...f, choices: [...f.choices, { choice_text: '', is_correct: false }] }));
  };

  const updateChoice = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      choices: f.choices.map((c, i) =>
        i === idx ? { ...c, [field]: value } : field === 'is_correct' ? { ...c, is_correct: false } : c
      ),
    }));
  };

  const removeChoice = (idx) => {
    if (form.choices.length <= 1) return;
    setForm((f) => ({ ...f, choices: f.choices.filter((_, i) => i !== idx) }));
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    if (!orgId || !form.question_text.trim()) return;
    const choices = form.choices.filter((c) => c.choice_text?.trim());
    if (choices.length < 2 || !choices.some((c) => c.is_correct)) {
      setError('Ajoutez au moins 2 réponses et cochez la bonne.');
      return;
    }
    setSaving(true);
    setError(null);
    if (modal === 'add') {
      const { data: q, error: insQ } = await supabase
        .from('exam_questions')
        .insert({ organisation_id: orgId, question_text: form.question_text.trim(), sort_order: questions.length })
        .select('id')
        .single();
      if (insQ) {
        setSaving(false);
        setError(insQ.message);
        return;
      }
      for (let i = 0; i < choices.length; i++) {
        await supabase.from('exam_question_choices').insert({
          question_id: q.id,
          choice_text: choices[i].choice_text.trim(),
          is_correct: !!choices[i].is_correct,
          sort_order: i,
        });
      }
    } else {
      const qId = modal;
      await supabase.from('exam_questions').update({ question_text: form.question_text.trim() }).eq('id', qId);
      const existingIds = form.choices.map((c) => c.id).filter(Boolean);
      const { data: existing } = await supabase.from('exam_question_choices').select('id').eq('question_id', qId);
      const toDelete = (existing || []).filter((e) => !existingIds.includes(e.id)).map((e) => e.id);
      for (const id of toDelete) await supabase.from('exam_question_choices').delete().eq('id', id);
      for (let i = 0; i < choices.length; i++) {
        const c = choices[i];
        if (c.id) {
          await supabase.from('exam_question_choices').update({ choice_text: c.choice_text.trim(), is_correct: !!c.is_correct, sort_order: i }).eq('id', c.id);
        } else {
          await supabase.from('exam_question_choices').insert({
            question_id: qId,
            choice_text: c.choice_text.trim(),
            is_correct: !!c.is_correct,
            sort_order: i,
          });
        }
      }
    }
    setSaving(false);
    setModal(null);
    fetchQuestions();
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Supprimer cette question et ses réponses ?')) return;
    await supabase.from('exam_question_choices').delete().eq('question_id', id);
    await supabase.from('exam_questions').delete().eq('id', id);
    fetchQuestions();
  };

  if (!orgId) {
    return (
      <div className="p-6">
        <p className="text-cerip-forest/70">Aucune organisation assignée.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <h1 className="text-lg font-semibold text-cerip-forest">Banque de questions d'examen</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Gérez les questions du QCM de certification pour votre organisation. Ordre d'affichage = ordre d'ajout.
        </p>
      </header>
      <main className="flex-1 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 mb-4">{error}</div>
        )}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark transition"
          >
            Ajouter une question
          </button>
        </div>
        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : questions.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune question. Ajoutez-en pour que l'examen soit proposé aux incubés.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/10">
              {questions.map((q, idx) => (
                <li key={q.id} className="px-4 py-3 flex items-start justify-between gap-4 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest text-sm">{idx + 1}. {q.question_text}</p>
                    <ul className="mt-1 ml-4 text-xs text-cerip-forest/70 space-y-0.5">
                      {q.choices?.map((c) => (
                        <li key={c.id}>{c.is_correct ? '✓ ' : ''}{c.choice_text}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => openEdit(q)} className="px-2 py-1 rounded text-xs font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                      Modifier
                    </button>
                    <button type="button" onClick={() => deleteQuestion(q.id)} className="px-2 py-1 rounded text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light">
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-base font-semibold text-cerip-forest mb-4">{modal === 'add' ? 'Nouvelle question' : 'Modifier la question'}</h2>
              <form onSubmit={saveQuestion} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Énoncé</span>
                  <textarea
                    value={form.question_text}
                    onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime focus:border-cerip-forest/30"
                    required
                  />
                </label>
                <div>
                  <span className="text-xs font-medium text-cerip-forest/80 block mb-2">Réponses (cochez la bonne)</span>
                  {form.choices.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={!!c.is_correct}
                        onChange={() => updateChoice(idx, 'is_correct', true)}
                        className="text-cerip-lime focus:ring-cerip-lime"
                      />
                      <input
                        type="text"
                        value={c.choice_text}
                        onChange={(e) => updateChoice(idx, 'choice_text', e.target.value)}
                        placeholder="Texte de la réponse"
                        className="flex-1 rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      />
                      <button type="button" onClick={() => removeChoice(idx)} className="p-2 text-cerip-magenta hover:bg-cerip-magenta-light rounded" aria-label="Supprimer">
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addChoice} className="text-xs font-medium text-cerip-lime hover:underline mt-1">
                    + Ajouter une réponse
                  </button>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setModal(null)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CertificateurQuestionsPage;

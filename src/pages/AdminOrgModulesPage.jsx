import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AdminOrgModulesPage() {
  const { profile } = useOutletContext() || {};
  const orgId = profile?.organisation_id;
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [quizModal, setQuizModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'text', parcours_phase: 'P1' });
  const [quizForm, setQuizForm] = useState({ questions: [] });

  const fetchModules = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('learning_modules')
      .select('id, title, description, sort_order, type, parcours_phase')
      .eq('organisation_id', orgId)
      .order('sort_order');
    if (!e) setModules(data || []);
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchModules().finally(() => setLoading(false));
  }, [orgId]);

  const openAdd = () => {
    setForm({ title: '', description: '', type: 'text', parcours_phase: 'P1' });
    setModal('add');
    setError(null);
  };

  const openEdit = (m) => {
    setForm({ title: m.title, description: m.description || '', type: m.type, parcours_phase: m.parcours_phase });
    setModal(m.id);
    setError(null);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    if (!orgId || !form.title.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      organisation_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      parcours_phase: form.parcours_phase,
      sort_order: modal === 'add' ? modules.length : undefined,
    };
    if (modal === 'add') {
      const { error: ins } = await supabase.from('learning_modules').insert(payload);
      if (ins) setError(ins.message);
      else setModal(null);
    } else {
      const { id, ...up } = payload;
      const { error: upErr } = await supabase.from('learning_modules').update(up).eq('id', modal);
      if (upErr) setError(upErr.message);
      else setModal(null);
    }
    setSaving(false);
    fetchModules();
  };

  const deleteModule = async (id) => {
    if (!confirm('Supprimer ce module (et ses questions si quiz) ?')) return;
    await supabase.from('learning_modules').delete().eq('id', id);
    fetchModules();
  };

  const openQuizEditor = async (module) => {
    const { data: qs } = await supabase
      .from('module_quiz_questions')
      .select('id, question_text, sort_order')
      .eq('module_id', module.id)
      .order('sort_order');
    const withChoices = await Promise.all(
      (qs || []).map(async (q) => {
        const { data: choices } = await supabase
          .from('module_quiz_choices')
          .select('id, choice_text, is_correct, sort_order')
          .eq('question_id', q.id)
          .order('sort_order');
        return { ...q, choices: choices || [] };
      })
    );
    setQuizForm({
      module,
      questions: withChoices.length
        ? withChoices.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            choices: q.choices.map((c) => ({ id: c.id, choice_text: c.choice_text, is_correct: c.is_correct })),
          }))
        : [{ question_text: '', choices: [{ choice_text: '', is_correct: false }] }],
    });
    setQuizModal(module.id);
    setError(null);
  };

  const addQuizQuestion = () => {
    setQuizForm((f) => ({ ...f, questions: [...f.questions, { question_text: '', choices: [{ choice_text: '', is_correct: false }] }] }));
  };

  const updateQuizQuestion = (qIdx, field, value) => {
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === qIdx ? { ...q, [field]: value } : q)),
    }));
  };

  const updateQuizChoice = (qIdx, cIdx, field, value) => {
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qIdx
          ? q
          : {
              ...q,
              choices: q.choices.map((c, j) =>
                j === cIdx ? { ...c, [field]: value } : field === 'is_correct' ? { ...c, is_correct: false } : c
              ),
            }
      ),
    }));
  };

  const addQuizChoice = (qIdx) => {
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === qIdx ? { ...q, choices: [...q.choices, { choice_text: '', is_correct: false }] } : q)),
    }));
  };

  const removeQuizChoice = (qIdx, cIdx) => {
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === qIdx ? { ...q, choices: q.choices.filter((_, j) => j !== cIdx) } : q)),
    }));
  };

  const removeQuizQuestion = (qIdx) => {
    setQuizForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qIdx) }));
  };

  const saveQuizContent = async (e) => {
    e.preventDefault();
    const { module } = quizForm;
    if (!module?.id) return;
    setSaving(true);
    setError(null);
    for (const q of quizForm.questions) {
      if (!q.question_text?.trim()) continue;
      const choices = (q.choices || []).filter((c) => c.choice_text?.trim());
      if (choices.length < 2 || !choices.some((c) => c.is_correct)) continue;
      let qId = q.id;
      if (!qId) {
        const { data: inserted } = await supabase
          .from('module_quiz_questions')
          .insert({ module_id: module.id, question_text: q.question_text.trim(), sort_order: quizForm.questions.indexOf(q) })
          .select('id')
          .single();
        qId = inserted?.id;
      } else {
        await supabase.from('module_quiz_questions').update({ question_text: q.question_text.trim(), sort_order: quizForm.questions.indexOf(q) }).eq('id', qId);
      }
      if (!qId) continue;
      const { data: existingChoices } = await supabase.from('module_quiz_choices').select('id').eq('question_id', qId);
      const keptIds = choices.map((c) => c.id).filter(Boolean);
      for (const ex of existingChoices || []) {
        if (!keptIds.includes(ex.id)) await supabase.from('module_quiz_choices').delete().eq('id', ex.id);
      }
      for (let i = 0; i < choices.length; i++) {
        const c = choices[i];
        if (c.id) {
          await supabase.from('module_quiz_choices').update({ choice_text: c.choice_text.trim(), is_correct: !!c.is_correct, sort_order: i }).eq('id', c.id);
        } else {
          await supabase.from('module_quiz_choices').insert({
            question_id: qId,
            choice_text: c.choice_text.trim(),
            is_correct: !!c.is_correct,
            sort_order: i,
          });
        }
      }
    }
    setSaving(false);
    setQuizModal(null);
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
        <h1 className="text-lg font-semibold text-cerip-forest">Modules pédagogiques</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          Créez les contenus de formation (texte, vidéo, quiz) pour les phases P1 et P2.
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
            Ajouter un module
          </button>
        </div>
        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/5 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : modules.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucun module. Ajoutez-en pour que les incubés voient le parcours.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/10">
              {modules.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest text-sm">{m.title}</p>
                    <p className="text-xs text-cerip-forest/70">{m.parcours_phase} · {m.type}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {m.type === 'quiz' && (
                      <button
                        type="button"
                        onClick={() => openQuizEditor(m)}
                        className="px-2 py-1 rounded text-xs font-medium text-cerip-lime hover:bg-cerip-lime/10"
                      >
                        Questions
                      </button>
                    )}
                    <button type="button" onClick={() => openEdit(m)} className="px-2 py-1 rounded text-xs font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                      Modifier
                    </button>
                    <button type="button" onClick={() => deleteModule(m.id)} className="px-2 py-1 rounded text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light">
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
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-md w-full p-6">
              <h2 className="text-base font-semibold text-cerip-forest mb-4">{modal === 'add' ? 'Nouveau module' : 'Modifier le module'}</h2>
              <form onSubmit={saveModule} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Titre</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Description (optionnel)</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Phase</span>
                  <select
                    value={form.parcours_phase}
                    onChange={(e) => setForm((f) => ({ ...f, parcours_phase: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Type</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                  >
                    <option value="text">Texte</option>
                    <option value="video">Vidéo</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </label>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setModal(null)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {quizModal && quizForm.module && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
              <h2 className="text-base font-semibold text-cerip-forest mb-2">Questions du quiz : {quizForm.module.title}</h2>
              <form onSubmit={saveQuizContent} className="space-y-6">
                {quizForm.questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-lg border border-cerip-forest/10 p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <input
                        type="text"
                        value={q.question_text}
                        onChange={(e) => updateQuizQuestion(qIdx, 'question_text', e.target.value)}
                        placeholder="Énoncé de la question"
                        className="flex-1 rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      />
                      <button type="button" onClick={() => removeQuizQuestion(qIdx)} className="p-1 text-cerip-magenta hover:bg-cerip-magenta-light rounded" aria-label="Supprimer question">
                        ×
                      </button>
                    </div>
                    <div className="ml-4 space-y-1">
                      <span className="text-xs text-cerip-forest/70">Réponses (cochez la bonne)</span>
                      {(q.choices || []).map((c, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            checked={!!c.is_correct}
                            onChange={() => updateQuizChoice(qIdx, cIdx, 'is_correct', true)}
                            className="text-cerip-lime focus:ring-cerip-lime"
                          />
                          <input
                            type="text"
                            value={c.choice_text}
                            onChange={(e) => updateQuizChoice(qIdx, cIdx, 'choice_text', e.target.value)}
                            placeholder="Réponse"
                            className="flex-1 rounded border border-cerip-forest/20 px-2 py-1 text-sm"
                          />
                          <button type="button" onClick={() => removeQuizChoice(qIdx, cIdx)} className="p-1 text-cerip-magenta rounded" aria-label="Supprimer">×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addQuizChoice(qIdx)} className="text-xs text-cerip-lime hover:underline">+ Réponse</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addQuizQuestion} className="text-sm font-medium text-cerip-lime hover:underline">
                  + Ajouter une question
                </button>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setQuizModal(null)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                    Fermer
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                    Enregistrer
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

export default AdminOrgModulesPage;

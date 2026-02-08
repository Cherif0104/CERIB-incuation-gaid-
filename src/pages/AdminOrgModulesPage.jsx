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
  const [formStep, setFormStep] = useState(1);
  const [quizModal, setQuizModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'text', parcours_phase: 'P1', sort_order: 0, content_body: '', video_url: '', document_url: '' });
  const [quizForm, setQuizForm] = useState({ questions: [] });

  const fetchModules = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('learning_modules')
      .select('id, title, description, sort_order, type, parcours_phase, payload')
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
    setForm({ title: '', description: '', type: 'text', parcours_phase: 'P1', sort_order: modules.length, content_body: '', video_url: '', document_url: '' });
    setModal('add');
    setFormStep(1);
    setError(null);
  };

  const openEdit = (m) => {
    const order = m.sort_order != null ? Number(m.sort_order) : modules.findIndex((x) => x.id === m.id);
    const payload = m.payload && typeof m.payload === 'object' ? m.payload : {};
    setForm({
      title: m.title,
      description: m.description || '',
      type: m.type,
      parcours_phase: m.parcours_phase,
      sort_order: order >= 0 ? order : 0,
      content_body: payload.body ?? '',
      video_url: payload.video_url ?? '',
      document_url: payload.document_url ?? '',
    });
    setModal(m.id);
    setFormStep(1);
    setError(null);
  };

  const closeModuleModal = () => {
    setModal(null);
    setFormStep(1);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    if (!orgId || !form.title.trim()) return;
    setSaving(true);
    setError(null);
    const sortOrder = Math.max(0, Number(form.sort_order) || 0);
    const payloadJson = {};
    if (form.type === 'text') {
      if (form.content_body != null) payloadJson.body = form.content_body;
      if (form.document_url?.trim()) payloadJson.document_url = form.document_url.trim();
    }
    if (form.type === 'video' && form.video_url != null) payloadJson.video_url = form.video_url.trim() || null;
    if (form.type === 'document' && form.document_url != null) payloadJson.document_url = form.document_url.trim() || null;
    const payload = {
      organisation_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      parcours_phase: form.parcours_phase,
      sort_order: modal === 'add' ? Math.min(sortOrder, modules.length) : sortOrder,
      payload: payloadJson,
    };
    if (modal === 'add') {
      const { error: ins } = await supabase.from('learning_modules').insert(payload);
      if (ins) setError(ins.message);
      else closeModuleModal();
    } else {
      const { organisation_id: _o, ...up } = payload;
      const { error: upErr } = await supabase.from('learning_modules').update(up).eq('id', modal);
      if (upErr) setError(upErr.message);
      else closeModuleModal();
    }
    setSaving(false);
    fetchModules();
  };

  const canGoStep2 = form.title.trim().length > 0;
  const moduleFormSteps = [
    { num: 1, label: 'Informations générales' },
    { num: 2, label: 'Contenu' },
  ];

  const deleteModule = async (id) => {
    if (!confirm('Supprimer ce module (et ses questions si quiz) ?')) return;
    await supabase.from('learning_modules').delete().eq('id', id);
    fetchModules();
  };

  const moveModule = async (index, direction) => {
    if (index <= 0 && direction === 'up') return;
    if (index >= modules.length - 1 && direction === 'down') return;
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const curr = modules[index];
    const other = modules[otherIndex];
    if (!curr?.id || !other?.id) return;
    const currOrder = curr.sort_order != null ? Number(curr.sort_order) : index;
    const otherOrder = other.sort_order != null ? Number(other.sort_order) : otherIndex;
    setError(null);
    const { error: e1 } = await supabase.from('learning_modules').update({ sort_order: otherOrder }).eq('id', curr.id);
    if (e1) {
      setError(e1.message);
      return;
    }
    const { error: e2 } = await supabase.from('learning_modules').update({ sort_order: currOrder }).eq('id', other.id);
    if (e2) {
      setError(e2.message);
      return;
    }
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
      const questionText = (q.question_text || '').trim();
      const choices = (q.choices || []).filter((c) => (c.choice_text || '').trim());
      let qId = q.id;
      if (!qId) {
        const { data: inserted } = await supabase
          .from('module_quiz_questions')
          .insert({ module_id: module.id, question_text: questionText || null, sort_order: quizForm.questions.indexOf(q) })
          .select('id')
          .single();
        qId = inserted?.id;
      } else {
        await supabase.from('module_quiz_questions').update({ question_text: questionText || null, sort_order: quizForm.questions.indexOf(q) }).eq('id', qId);
      }
      if (!qId) continue;
      const { data: existingChoices } = await supabase.from('module_quiz_choices').select('id').eq('question_id', qId);
      const keptIds = choices.map((c) => c.id).filter(Boolean);
      for (const ex of existingChoices || []) {
        if (!keptIds.includes(ex.id)) await supabase.from('module_quiz_choices').delete().eq('id', ex.id);
      }
      for (let i = 0; i < choices.length; i++) {
        const c = choices[i];
        const choiceText = (c.choice_text || '').trim();
        if (c.id) {
          await supabase.from('module_quiz_choices').update({ choice_text: choiceText, is_correct: !!c.is_correct, sort_order: i }).eq('id', c.id);
        } else {
          await supabase.from('module_quiz_choices').insert({
            question_id: qId,
            choice_text: choiceText || ' ',
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
              {modules.map((m, index) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-cerip-forest-light/30">
                  <div>
                    <p className="font-medium text-cerip-forest text-sm">{m.title}</p>
                    <p className="text-xs text-cerip-forest/70">{m.parcours_phase} · {m.type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex flex-col" aria-label="Ordre">
                      <button
                        type="button"
                        onClick={() => moveModule(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-cerip-forest/70 hover:bg-cerip-forest/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Monter"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveModule(index, 'down')}
                        disabled={index === modules.length - 1}
                        className="p-1 rounded text-cerip-forest/70 hover:bg-cerip-forest/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Descendre"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-lg w-full p-6 my-8">
              <h2 className="text-base font-semibold text-cerip-forest mb-2">{modal === 'add' ? 'Nouveau module' : 'Modifier le module'}</h2>
              <div className="flex gap-2 mb-6">
                {moduleFormSteps.map((s) => (
                  <div
                    key={s.num}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      formStep === s.num ? 'bg-cerip-lime text-white' : formStep > s.num ? 'bg-cerip-forest/10 text-cerip-forest' : 'bg-cerip-forest/5 text-cerip-forest/60'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20">{s.num}</span>
                    {s.label}
                  </div>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); if (formStep === 2) saveModule(e); else setFormStep(2); }} className="space-y-4">
                {formStep === 1 && (
                  <>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Titre</span>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                        placeholder="Ex. Introduction au parcours"
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
                        placeholder="Courte description du module"
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
                        <option value="P3">P3 (optionnel)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Type de module</span>
                      <select
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      >
                        <option value="text">Texte</option>
                        <option value="video">Vidéo (YouTube, etc.)</option>
                        <option value="document">Document (PDF, Google Docs, tableur)</option>
                        <option value="quiz">Quiz</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Ordre / Priorité</span>
                      <input
                        type="number"
                        min={0}
                        value={form.sort_order}
                        onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      />
                      <span className="text-xs text-cerip-forest/60 block mt-0.5">Position dans le parcours (0 = premier).</span>
                    </label>
                  </>
                )}
                {formStep === 2 && (
                  <>
                    {form.type === 'text' && (
                      <>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">Contenu (texte affiché à l&apos;incubé)</span>
                          <textarea
                            value={form.content_body}
                            onChange={(e) => setForm((f) => ({ ...f, content_body: e.target.value }))}
                            rows={6}
                            className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                            placeholder="Contenu du module ou laissez vide si vous mettez uniquement un lien document ci-dessous"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">Lien document (optionnel)</span>
                          <input
                            type="url"
                            value={form.document_url}
                            onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                            placeholder="https://…"
                          />
                        </label>
                      </>
                    )}
                    {form.type === 'document' && (
                      <label className="block">
                        <span className="text-xs font-medium text-cerip-forest/80">URL du document</span>
                        <input
                          type="url"
                          value={form.document_url}
                          onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                          placeholder="Lien PDF, Google Docs, Google Sheets, etc."
                        />
                        <span className="text-xs text-cerip-forest/60 block mt-0.5">L&apos;incubé pourra ouvrir le document dans un nouvel onglet.</span>
                      </label>
                    )}
                    {form.type === 'video' && (
                      <label className="block">
                        <span className="text-xs font-medium text-cerip-forest/80">URL vidéo</span>
                        <input
                          type="url"
                          value={form.video_url}
                          onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                          placeholder="https://www.youtube.com/embed/… ou lien direct"
                        />
                      </label>
                    )}
                    {form.type === 'quiz' && (
                      <p className="text-sm text-cerip-forest/80 rounded-lg bg-cerip-forest/5 border border-cerip-forest/10 px-4 py-3">
                        Après enregistrement, vous pourrez ajouter les questions du quiz via le bouton &quot;Questions&quot; sur ce module.
                      </p>
                    )}
                  </>
                )}
                <div className="flex gap-2 justify-end pt-2 border-t border-cerip-forest/10">
                  <button type="button" onClick={closeModuleModal} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                    Annuler
                  </button>
                  {formStep === 2 ? (
                    <>
                      <button type="button" onClick={() => setFormStep(1)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                        Précédent
                      </button>
                      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </>
                  ) : (
                    <button type="submit" disabled={!canGoStep2} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                      Suivant
                    </button>
                  )}
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

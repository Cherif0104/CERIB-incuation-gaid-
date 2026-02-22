import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Page Admin Org : Modules pédagogiques.
 * Formulaire de création/édition en 3 étapes : 1) Identité & cible (titre, promo, formateur),
 * 2) Parcours (phase, mois, type, ordre), 3) Contenu (selon type : texte, vidéo, document, quiz).
 * Liste des modules avec Modifier, Supprimer, Questions (quiz), réordonnancement.
 * @see docs/modules-et-formulaires.md
 */
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
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'text', parcours_phase: 'P1', phase_custom: '', mois: '', sort_order: 0, promotion_id: '', formateur_id: '', content_body: '', video_url: '', document_url: '' });
  const [quizForm, setQuizForm] = useState({ questions: [] });
  const [promotions, setPromotions] = useState([]);
  const [coachs, setCoachs] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);

  const fetchModules = async () => {
    if (!orgId) return;
    const { data, error: e } = await supabase
      .from('learning_modules')
      .select('id, title, description, sort_order, type, parcours_phase, mois, payload, promotion_id, formateur_id')
      .eq('organisation_id', orgId)
      .order('sort_order');
    if (!e) setModules(data || []);
  };

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    fetchModules().finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const [r1, r2] = await Promise.all([
        supabase.from('promotions').select('id, name').eq('organisation_id', orgId).order('name'),
        supabase.from('staff_users').select('id, full_name').eq('organisation_id', orgId).eq('role', 'COACH').order('full_name'),
      ]);
      setPromotions(r1.data || []);
      setCoachs(r2.data || []);
    };
    load();
  }, [orgId]);

  const openAdd = () => {
    setForm({ title: '', description: '', type: 'text', parcours_phase: 'P1', phase_custom: '', mois: '', sort_order: modules.length, promotion_id: '', formateur_id: '', content_body: '', video_url: '', document_url: '' });
    setVideoFile(null);
    setDocumentFile(null);
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
      mois: m.mois != null ? String(m.mois) : '',
      sort_order: order >= 0 ? order : 0,
      promotion_id: m.promotion_id ?? '',
      formateur_id: m.formateur_id ?? '',
      content_body: payload.body ?? '',
      video_url: payload.video_url ?? '',
      document_url: payload.document_url ?? '',
    });
    setVideoFile(null);
    setDocumentFile(null);
    setModal(m.id);
    setFormStep(1);
    setError(null);
  };

  const closeModuleModal = () => {
    setModal(null);
    setFormStep(1);
    setVideoFile(null);
    setDocumentFile(null);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    if (!orgId || !form.title.trim()) return;
    if (modal === 'add' && (!form.promotion_id || !form.formateur_id)) {
      setError('Veuillez sélectionner une promotion et un formateur.');
      return;
    }
    setSaving(true);
    setError(null);
    const sortOrder = Math.max(0, Number(form.sort_order) || 0);
    const payloadJson = {};
    if (form.type === 'text') {
      if (form.content_body != null) payloadJson.body = form.content_body;
      if (form.video_url?.trim()) payloadJson.video_url = form.video_url.trim();
      if (form.document_url?.trim()) payloadJson.document_url = form.document_url.trim();
    }
    if (form.type === 'video' && form.video_url != null) payloadJson.video_url = form.video_url.trim() || null;
    if (form.type === 'document' && form.document_url != null) payloadJson.document_url = form.document_url.trim() || null;
    const moisNum = form.mois !== '' && form.mois != null ? parseInt(form.mois, 10) : null;
    const phaseValue = form.parcours_phase === 'Autre' ? (form.phase_custom?.trim() || 'P3') : form.parcours_phase;
    const payload = {
      organisation_id: orgId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      parcours_phase: phaseValue,
      mois: moisNum >= 1 && moisNum <= 12 ? moisNum : null,
      sort_order: modal === 'add' ? Math.min(sortOrder, modules.length) : sortOrder,
      payload: payloadJson,
      promotion_id: form.promotion_id || null,
      formateur_id: form.formateur_id || null,
    };
    let moduleId = modal === 'add' ? null : modal;
    if (modal === 'add') {
      const { data: inserted, error: ins } = await supabase.from('learning_modules').insert(payload).select('id').single();
      if (ins) {
        setError(ins.message);
        setSaving(false);
        return;
      }
      moduleId = inserted?.id;
    } else {
      const { organisation_id: _o, ...up } = payload;
      const { error: upErr } = await supabase.from('learning_modules').update(up).eq('id', modal);
      if (upErr) {
        setError(upErr.message);
        setSaving(false);
        return;
      }
    }
    if (moduleId && (videoFile || documentFile)) {
      const updatePayload = { ...payloadJson };
      if (videoFile) {
        const ext = videoFile.name.split('.').pop() || 'mp4';
        const path = `${orgId}/${moduleId}/video.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('module-assets').upload(path, videoFile, { upsert: true });
        if (uploadErr) setError('Erreur upload vidéo : ' + uploadErr.message);
        else updatePayload.video_file_path = path;
      }
      if (documentFile) {
        const ext = documentFile.name.split('.').pop() || 'pdf';
        const path = `${orgId}/${moduleId}/document.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('module-assets').upload(path, documentFile, { upsert: true });
        if (uploadErr) setError('Erreur upload document : ' + uploadErr.message);
        else updatePayload.document_file_path = path;
      }
      await supabase.from('learning_modules').update({ payload: updatePayload }).eq('id', moduleId);
    }
    setSaving(false);
    closeModuleModal();
    fetchModules();
  };

  const canGoStep2 = form.title.trim().length > 0 && (!!form.promotion_id || modal !== 'add') && (!!form.formateur_id || modal !== 'add');
  const moduleFormSteps = [
    { num: 1, label: 'Identité & cible' },
    { num: 2, label: 'Parcours' },
    { num: 3, label: 'Contenu' },
  ];
  const canGoStep3 = canGoStep2;
  const goToStep = (num) => {
    if (num === 1) {
      setError(null);
      setFormStep(1);
      return;
    }
    if (num === 2) {
      if (canGoStep2) {
        setError(null);
        setFormStep(2);
      }
      return;
    }
    if (num === 3) {
      if (canGoStep3) {
        setError(null);
        setFormStep(3);
      } else {
        setError('Complétez l\'étape 1 (Identité & cible) pour accéder au contenu.');
        document.querySelector('.admin-modules-error')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }
  };

  const deleteModule = async (id) => {
    if (!window.confirm('Supprimer ce module définitivement ? Les questions du quiz seront aussi supprimées.')) return;
    setError(null);
    setDeletingId(id);
    const { error } = await supabase.from('learning_modules').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      setError('Erreur lors de la suppression : ' + error.message);
      document.querySelector('.admin-modules-error')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    if (modal === id) closeModuleModal();
    await fetchModules();
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
          Créez les parcours et contenus de formation (texte, vidéo, quiz) par phase (P1/P2) et par mois (1–4). Les modules et mois définis ici sont ceux affichés dans le portail incubé et le suivi coach.
        </p>
      </header>
      <main className="flex-1 p-6">
        {error && (
          <div className="admin-modules-error rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 mb-4" role="alert">
            {error}
          </div>
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
                    <p className="text-xs text-cerip-forest/70">
                      {m.parcours_phase} · {m.type}
                      {m.mois != null && <span> · Mois {m.mois}</span>}
                      {m.promotion_id && <span> · {promotions.find((p) => p.id === m.promotion_id)?.name ?? m.promotion_id}</span>}
                      {m.formateur_id && <span> · {coachs.find((c) => c.id === m.formateur_id)?.full_name ?? 'Formateur'}</span>}
                    </p>
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
                    <button
                      type="button"
                      onClick={() => deleteModule(m.id)}
                      disabled={deletingId === m.id}
                      className="px-2 py-1 rounded text-xs font-medium text-cerip-magenta hover:bg-cerip-magenta-light disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deletingId === m.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-lg border border-cerip-forest/10 max-w-3xl w-full p-6 md:p-8 my-8">
              <h2 className="text-base font-semibold text-cerip-forest mb-2">{modal === 'add' ? 'Nouveau module' : 'Modifier le module'}</h2>
              <div className="flex gap-2 mb-4">
                {moduleFormSteps.map((s) => (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => goToStep(s.num)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      formStep === s.num ? 'bg-cerip-lime text-white' : formStep > s.num ? 'bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/15' : (s.num === 2 || s.num === 3) && canGoStep2 ? 'bg-cerip-forest/5 text-cerip-forest/70 hover:bg-cerip-forest/10' : 'bg-cerip-forest/5 text-cerip-forest/60 cursor-default'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20">{s.num}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              {formStep === 1 && !canGoStep2 && (
                <p className="text-xs text-cerip-forest/70 mb-4 rounded-lg bg-cerip-forest/5 border border-cerip-forest/10 px-3 py-2">
                  Complétez l&apos;étape 1 (titre, promotion, formateur) puis cliquez sur Suivant pour accéder au parcours et au contenu.
                </p>
              )}
              {error && error.includes('Complétez l\'étape 1') && (
                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); if (formStep === 3) saveModule(e); else if (formStep === 1) setFormStep(2); else setFormStep(3); }} className="space-y-4">
                {formStep === 1 && (
                  <>
                    <h3 className="text-sm font-semibold text-cerip-forest mb-2">Identité & cible</h3>
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
                    <div className="rounded-lg bg-cerip-forest/5 border border-cerip-forest/10 px-4 py-3 text-xs text-cerip-forest/80">
                      Chaque module doit être associé à une promotion et à un formateur (entraîneur). Ces liaisons assurent l&apos;interopérabilité avec les Incubés, Codes, Promotions et Coachs.
                    </div>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Promotion (obligatoire)</span>
                      <select
                        value={form.promotion_id}
                        onChange={(e) => setForm((f) => ({ ...f, promotion_id: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      >
                        <option value="">Sélectionner une promotion</option>
                        {promotions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Formateur / Entraîneur (obligatoire)</span>
                      <select
                        value={form.formateur_id}
                        onChange={(e) => setForm((f) => ({ ...f, formateur_id: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      >
                        <option value="">Sélectionner un formateur</option>
                        {coachs.map((c) => (
                          <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {formStep === 2 && (
                  <>
                    <h3 className="text-sm font-semibold text-cerip-forest mb-2">Parcours</h3>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Phase (extensible)</span>
                      <select
                        value={form.parcours_phase}
                        onChange={(e) => setForm((f) => ({ ...f, parcours_phase: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      >
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                        <option value="Autre">Autre (saisir ci-dessous)</option>
                      </select>
                      {form.parcours_phase === 'Autre' && (
                        <input
                          type="text"
                          value={form.phase_custom}
                          onChange={(e) => setForm((f) => ({ ...f, phase_custom: e.target.value }))}
                          placeholder="Ex. P4, Phase avancée…"
                          className="mt-2 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                        />
                      )}
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-cerip-forest/80">Mois (parcours incubé, extensible)</span>
                      <select
                        value={form.mois}
                        onChange={(e) => setForm((f) => ({ ...f, mois: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                      >
                        <option value="">Non assigné</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <option key={n} value={n}>Mois {n}</option>
                        ))}
                      </select>
                      <span className="text-xs text-cerip-forest/60 block mt-0.5">Correspond aux mois du portail incubé et au suivi coach.</span>
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
                {formStep === 3 && (
                  <>
                    <h3 className="text-sm font-semibold text-cerip-forest mb-2">Contenu</h3>
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
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">Ou document à uploader (PDF)</span>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            className="mt-1 w-full text-sm text-cerip-forest file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cerip-forest/10 file:text-cerip-forest"
                          />
                          {documentFile && <span className="text-xs text-cerip-forest/70 block mt-1">{documentFile.name}</span>}
                        </label>
                      </>
                    )}
                    {form.type === 'document' && (
                      <>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">URL du document (optionnel)</span>
                          <input
                            type="url"
                            value={form.document_url}
                            onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                            placeholder="Lien PDF, Google Docs, etc."
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">Ou document à uploader (PDF)</span>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            className="mt-1 w-full text-sm text-cerip-forest file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cerip-forest/10 file:text-cerip-forest"
                          />
                          {documentFile && <span className="text-xs text-cerip-forest/70 block mt-1">{documentFile.name}</span>}
                        </label>
                        <span className="text-xs text-cerip-forest/60 block">L&apos;incubé visualisera le document dans l&apos;application (intra).</span>
                      </>
                    )}
                    {form.type === 'video' && (
                      <>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">URL vidéo (YouTube, Vimeo, lien direct)</span>
                          <input
                            type="url"
                            value={form.video_url}
                            onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
                            placeholder="https://www.youtube.com/… ou lien direct"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-cerip-forest/80">Ou fichier vidéo à uploader</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                            className="mt-1 w-full text-sm text-cerip-forest file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cerip-forest/10 file:text-cerip-forest"
                          />
                          {videoFile && <span className="text-xs text-cerip-forest/70 block mt-1">{videoFile.name}</span>}
                        </label>
                      </>
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
                  {formStep === 1 && (
                    <button type="submit" disabled={!canGoStep2} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                      Suivant
                    </button>
                  )}
                  {formStep === 2 && (
                    <>
                      <button type="button" onClick={() => setFormStep(1)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                        Précédent
                      </button>
                      <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark">
                        Suivant
                      </button>
                    </>
                  )}
                  {formStep === 3 && (
                    <>
                      <button type="button" onClick={() => setFormStep(2)} className="px-3 py-2 rounded-lg text-sm font-medium text-cerip-forest/80 hover:bg-cerip-forest/10">
                        Précédent
                      </button>
                      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                        {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </>
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

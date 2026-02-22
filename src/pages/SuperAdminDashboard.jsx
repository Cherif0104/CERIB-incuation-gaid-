import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LEGAL_FORMS } from '../data/legalForms';
import { SECTORS } from '../data/sectors';
import { SENEGAL_GEO, getDepartmentsByRegion, getCommunesByDepartment } from '../data/senegalGeo';

const ACCOUNT_TYPES = ['STANDARD', 'PREMIUM'];

const initialCreateForm = () => ({
  id: '',
  name: '',
  legal_form: '',
  quota_incubes: 0,
  quota_coachs: 0,
  sector_activity: '',
  region: '',
  department: '',
  commune: '',
  address: '',
  phone: '',
  email_org: '',
  ninea: '',
  account_type: 'STANDARD',
  admin_email: '',
  admin_full_name: '',
  admin_password: '',
});

function SuperAdminDashboard() {
  const [organisations, setOrganisations] = useState([]);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalIncubes: 0,
    totalCoachs: 0,
    totalPromotions: 0,
    totalModules: 0,
    totalCertSessions: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quotaModalOrg, setQuotaModalOrg] = useState(null);
  const [quotaForm, setQuotaForm] = useState({ quota_incubes: 0, quota_coachs: 0 });
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createError, setCreateError] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createSuccessAdminPassword, setCreateSuccessAdminPassword] = useState(null);
  const [createSuccessAdminEmail, setCreateSuccessAdminEmail] = useState(null);
  const [filterRegion, setFilterRegion] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: orgs, error: e1 } = await supabase
        .from('organisations')
        .select('*')
        .order('name');
      if (e1) {
        setError(e1.message);
        setLoading(false);
        return;
      }
    const safeOrgs = orgs || [];
    setOrganisations(safeOrgs);

    const [
      { count: incubeCount, error: eIncubes },
      { count: coachCount, error: eCoachs },
      { count: promoCount, error: ePromos },
      { count: moduleCount, error: eModules },
      { count: certCount, error: eCert },
    ] = await Promise.all([
      supabase.from('incubes').select('*', { count: 'exact', head: true }),
      supabase.from('staff_users').select('*', { count: 'exact', head: true }).eq('role', 'COACH'),
      supabase.from('promotions').select('*', { count: 'exact', head: true }),
      supabase.from('learning_modules').select('*', { count: 'exact', head: true }),
      supabase.from('certification_sessions').select('*', { count: 'exact', head: true }),
    ]);

    if (eIncubes || eCoachs || ePromos || eModules || eCert) {
      const firstError = eIncubes || eCoachs || ePromos || eModules || eCert;
      console.warn('Erreur chargement KPIs Super Admin:', firstError);
    }

    setStats({
      totalOrgs: safeOrgs.length,
          totalIncubes: incubeCount ?? 0,
      totalCoachs: coachCount ?? 0,
      totalPromotions: promoCount ?? 0,
      totalModules: moduleCount ?? 0,
      totalCertSessions: certCount ?? 0,
      suspended: safeOrgs.filter((o) => o.is_suspended).length,
    });
      setLoading(false);
    };

  useEffect(() => {
    load();
  }, []);

  const handleToggleSuspended = async (e, org) => {
    e.preventDefault();
    e.stopPropagation();
    const { error: err } = await supabase
      .from('organisations')
      .update({ is_suspended: !org.is_suspended })
      .eq('id', org.id);
    if (err) setError(err.message);
    else {
      setOrganisations((prev) => prev.map((o) => (o.id === org.id ? { ...o, is_suspended: !o.is_suspended } : o)));
      setStats((s) => ({ ...s, suspended: org.is_suspended ? s.suspended - 1 : s.suspended + 1 }));
    }
  };

  const openQuotaModal = (e, org) => {
    e.preventDefault();
    e.stopPropagation();
    setQuotaModalOrg(org);
    setQuotaForm({ quota_incubes: org.quota_incubes ?? 0, quota_coachs: org.quota_coachs ?? 0 });
    setError(null);
  };

  const closeQuotaModal = () => {
    setQuotaModalOrg(null);
  };

  const handleSaveQuotas = async (e) => {
    e.preventDefault();
    if (!quotaModalOrg) return;
    setSavingQuotas(true);
    setError(null);
    const qi = Math.max(0, Number(quotaForm.quota_incubes) || 0);
    const qc = Math.max(0, Number(quotaForm.quota_coachs) || 0);
    const { error: err } = await supabase
      .from('organisations')
      .update({ quota_incubes: qi, quota_coachs: qc })
      .eq('id', quotaModalOrg.id);
    setSavingQuotas(false);
    if (err) setError(err.message);
    else {
      setOrganisations((prev) => prev.map((o) => (o.id === quotaModalOrg.id ? { ...o, quota_incubes: qi, quota_coachs: qc } : o)));
      closeQuotaModal();
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm(initialCreateForm());
    setCreateError(null);
    setCreateSuccessAdminPassword(null);
    setCreateSuccessAdminEmail(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
    setCreateSuccessAdminPassword(null);
    setCreateSuccessAdminEmail(null);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    const id = (createForm.id || '').trim().replace(/\s+/g, '-').toLowerCase();
    const name = (createForm.name || '').trim();
    if (!id || !name) {
      setCreateError('Identifiant et nom sont obligatoires.');
      return;
    }
    if (/\s/.test(createForm.id)) {
      setCreateError('L\'identifiant ne doit pas contenir d\'espaces (utilisez un slug).');
      return;
    }
    const qi = Math.max(0, Number(createForm.quota_incubes) || 0);
    const qc = Math.max(0, Number(createForm.quota_coachs) || 0);

    setCreateSaving(true);
    const regionLabel = createForm.region ? SENEGAL_GEO.find((r) => r.id === createForm.region)?.label ?? createForm.region : null;
    const regionData = SENEGAL_GEO.find((r) => r.id === createForm.region);
    const deptLabel = (regionData?.departments?.find((d) => d.id === createForm.department)?.label ?? createForm.department) || null;
    const communeLabel = (regionData?.departments?.find((d) => d.id === createForm.department)?.communes?.find((c) => c.id === createForm.commune)?.label ?? createForm.commune) || null;

    const { error: err } = await supabase.from('organisations').insert({
      id,
      name,
      account_type: createForm.account_type || 'STANDARD',
      legal_form: createForm.legal_form || null,
      sector_activity: createForm.sector_activity || null,
      region: regionLabel,
      department: deptLabel,
      commune: communeLabel,
      address: (createForm.address || '').trim() || null,
      phone: (createForm.phone || '').trim() || null,
      email_org: (createForm.email_org || '').trim() || null,
      ninea: (createForm.ninea || '').trim() || null,
      quota_incubes: qi,
      quota_coachs: qc,
    });
    if (err) {
      setCreateSaving(false);
      setCreateError(err.message || 'Erreur lors de la création.');
      return;
    }

    const adminEmail = (createForm.admin_email || '').trim().toLowerCase();
    if (adminEmail) {
      const adminPassword = (createForm.admin_password || '').trim();
      if (adminPassword && adminPassword.length < 6) {
        setCreateSaving(false);
        setCreateError('Le mot de passe admin doit faire au moins 6 caractères (ou laisser vide pour en générer un).');
        return;
      }
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('create-platform-user', {
        body: {
          email: adminEmail,
          full_name: (createForm.admin_full_name || '').trim() || adminEmail,
          password: adminPassword || undefined,
          role: 'ADMIN_ORG',
          organisation_id: id,
        },
      });
      if (fnErr) {
        setCreateSaving(false);
        setCreateError(fnErr.message || 'Organisation créée mais erreur lors de la création du compte admin.');
        return;
      }
      if (!fnData?.success) {
        setCreateSaving(false);
        setCreateError(fnData?.error || 'Organisation créée mais erreur lors de la création du compte admin.');
        return;
      }
      const tempPassword = fnData.temporary_password;
      if (tempPassword) {
        setCreateSuccessAdminPassword(tempPassword);
      }
      if (fnData.email_sent) setCreateSuccessAdminEmail(adminEmail);
      setCreateSaving(false);
      if (!tempPassword) {
        closeCreateModal();
      }
      load();
      return;
    }

    setCreateSaving(false);
    closeCreateModal();
    load();
  };

  const departmentsForRegion = getDepartmentsByRegion(createForm.region);
  const communesForDept = getCommunesByDepartment(createForm.region, createForm.department);

  const filteredOrganisations = organisations.filter((o) => {
    if (filterRegion && o.region !== filterRegion) return false;
    if (filterSector && o.sector_activity !== filterSector) return false;
    if (filterStatus === 'active' && o.is_suspended) return false;
    if (filterStatus === 'suspended' && !o.is_suspended) return false;
    return true;
  });

  const regionOptions = Array.from(
    new Set(organisations.map((o) => o.region).filter(Boolean)),
  );
  const sectorOptions = Array.from(
    new Set(organisations.map((o) => o.sector_activity).filter(Boolean)),
  );

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">Super Admin – Vue globale</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">Monitoring des organisations, quotas et suspension.</p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cerip-forest/90 via-cerip-forest-mid to-cerip-forest text-white p-6 md:p-8 shadow-xl border border-cerip-forest/20">
          <div className="relative z-10">
            <p className="text-cerip-lime font-semibold text-sm uppercase tracking-wider mb-1">Vue globale</p>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">Plateforme Savana</h2>
            <p className="text-white/85 text-sm md:text-base mb-4">
              Organisations, quotas, suspension et indicateurs globaux.
            </p>
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <span className="text-white/90 text-sm">
                <strong className="text-cerip-lime tabular-nums">{loading ? '—' : stats.totalOrgs}</strong> organisations
              </span>
              <span className="text-white/90 text-sm">
                <strong className="text-cerip-lime tabular-nums">{loading ? '—' : stats.totalIncubes}</strong> incubés
              </span>
              <span className="text-white/90 text-sm">
                <strong className="text-cerip-lime tabular-nums">{loading ? '—' : stats.suspended}</strong> suspendues
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-block min-w-[220px] py-3 px-6 rounded-2xl text-base font-bold bg-cerip-lime text-cerip-forest hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-center"
            >
              Créer une organisation
            </button>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-cerip-lime/10 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
        </section>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Organisations</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : stats.totalOrgs}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Incubés totaux</p>
            <p className="text-2xl font-bold text-cerip-lime">{loading ? '—' : stats.totalIncubes}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Coachs</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : stats.totalCoachs}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Promotions</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : stats.totalPromotions}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Modules</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : stats.totalModules}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-cerip-forest/70 uppercase tracking-wider mb-1">Suspendues</p>
            <p className="text-2xl font-bold text-cerip-forest">{loading ? '—' : stats.suspended}</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-cerip-forest/10">
            <h2 className="text-sm font-semibold text-cerip-forest">Liste des organisations</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
                >
                  <option value="">Toutes régions</option>
                  {regionOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
                >
                  <option value="">Tous secteurs</option>
                  {sectorOptions.map((s) => (
                    <option key={s} value={s}>
                      {SECTORS.find((x) => x.id === s)?.label ?? s}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-cerip-forest/20 px-2 py-1 text-xs text-cerip-forest bg-white"
                >
                  <option value="">Toutes</option>
                  <option value="active">Actives</option>
                  <option value="suspended">Suspendues</option>
                </select>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark focus:ring-2 focus:ring-cerip-lime/40 focus:ring-offset-2 transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Ajouter une organisation
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Chargement…</div>
          ) : filteredOrganisations.length === 0 ? (
            <div className="p-6 text-center text-cerip-forest/70 text-sm">Aucune organisation.</div>
          ) : (
            <ul className="divide-y divide-cerip-forest/5">
              {filteredOrganisations.map((o) => (
                <li
                  key={o.id}
                  className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 transition-colors ${
                    o.is_suspended ? 'bg-cerip-magenta/5' : 'hover:bg-cerip-forest-light/30'
                  }`}
                >
                  <Link to={`/super-admin/organisations/${o.id}`} className="flex-1 min-w-0 flex flex-wrap items-center gap-2 no-underline group">
                    <p className="font-medium text-cerip-forest group-hover:text-cerip-lime transition-colors">{o.name}</p>
                    {o.is_suspended && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-cerip-magenta/20 text-cerip-magenta">Suspendue</span>
                    )}
                    <p className="text-xs text-cerip-forest/70 w-full">
                      {o.id} · {o.account_type}
                      {o.region && ` · ${o.region}`}
                      {o.sector_activity && ` · ${SECTORS.find((s) => s.id === o.sector_activity)?.label ?? o.sector_activity}`}
                    </p>
                  </Link>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => openQuotaModal(e, o)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-cerip-forest bg-cerip-forest/10 hover:bg-cerip-forest/20 focus:ring-2 focus:ring-cerip-forest/20 focus:ring-offset-1 transition"
                      title="Modifier les quotas incubés et coachs"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Quotas
                    </button>
                  <button
                    type="button"
                      onClick={(e) => handleToggleSuspended(e, o)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition focus:ring-2 focus:ring-offset-1 ${
                        o.is_suspended
                          ? 'text-white bg-cerip-lime hover:bg-cerip-lime-dark focus:ring-cerip-lime/40'
                          : 'text-cerip-magenta bg-cerip-magenta/10 hover:bg-cerip-magenta/20 focus:ring-cerip-magenta/30'
                      }`}
                      title={o.is_suspended ? 'Réactiver l’organisation' : 'Suspendre l’organisation'}
                    >
                      {o.is_suspended ? (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    {o.is_suspended ? 'Réactiver' : 'Suspendre'}
                  </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {quotaModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeQuotaModal}>
          <div className="bg-white rounded-2xl shadow-xl border border-cerip-forest/10 max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-cerip-forest mb-3">Modifier les quotas – {quotaModalOrg.name}</h3>
            <form onSubmit={handleSaveQuotas} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Quota incubés</span>
                <input
                  type="number"
                  min={0}
                  value={quotaForm.quota_incubes}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, quota_incubes: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Quota coachs</span>
                <input
                  type="number"
                  min={0}
                  value={quotaForm.quota_coachs}
                  onChange={(e) => setQuotaForm((f) => ({ ...f, quota_coachs: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeQuotaModal} className="px-3 py-1.5 rounded-lg text-sm border border-cerip-forest/20 text-cerip-forest">
                  Annuler
                </button>
                <button type="submit" disabled={savingQuotas} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                  {savingQuotas ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => !createSuccessAdminPassword && closeCreateModal()}>
          <div className="bg-white rounded-2xl shadow-xl border border-cerip-forest/10 max-w-lg w-full my-6 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {createSuccessAdminPassword ? (
              <>
                <h3 className="text-sm font-semibold text-cerip-forest mb-2">Organisation et compte admin créés</h3>
                <p className="text-xs text-cerip-forest/70 mb-3">
                  Communiquez ce mot de passe à l&apos;administrateur. Il pourra le modifier depuis son profil après connexion.
                </p>
                <div className="rounded-lg bg-cerip-forest-light/50 border border-cerip-forest/20 px-3 py-2 mb-3 space-y-1">
                  <p className="text-xs font-medium text-cerip-forest/80">Mot de passe temporaire</p>
                  <p className="text-sm font-mono text-cerip-forest break-all select-all">{createSuccessAdminPassword}</p>
                  {createSuccessAdminEmail && (
                    <p className="text-xs text-cerip-forest/80">Un email a été envoyé à {createSuccessAdminEmail} avec les instructions de connexion.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { closeCreateModal(); load(); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark"
                >
                  Fermer
                </button>
              </>
            ) : (
              <>
            <h3 className="text-sm font-semibold text-cerip-forest mb-3">Nouvelle organisation</h3>
            {createError && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">{createError}</div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Identifiant (slug) *</span>
                <input
                  type="text"
                  value={createForm.id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="ex: mon-org"
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Nom de l’organisation *</span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Forme juridique *</span>
                <select
                  value={createForm.legal_form}
                  onChange={(e) => setCreateForm((f) => ({ ...f, legal_form: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  required
                >
                  <option value="">— Choisir —</option>
                  {LEGAL_FORMS.map((lf) => (
                    <option key={lf} value={lf}>{lf}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Quota incubés *</span>
                  <input
                    type="number"
                    min={0}
                    value={createForm.quota_incubes}
                    onChange={(e) => setCreateForm((f) => ({ ...f, quota_incubes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Quota coachs *</span>
                  <input
                    type="number"
                    min={0}
                    value={createForm.quota_coachs}
                    onChange={(e) => setCreateForm((f) => ({ ...f, quota_coachs: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Secteur d’activité</span>
                <select
                  value={createForm.sector_activity}
                  onChange={(e) => setCreateForm((f) => ({ ...f, sector_activity: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                >
                  <option value="">— Choisir —</option>
                  {SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Région</span>
                <select
                  value={createForm.region}
                  onChange={(e) => setCreateForm((f) => ({ ...f, region: e.target.value, department: '', commune: '' }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                >
                  <option value="">— Choisir —</option>
                  {SENEGAL_GEO.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Département</span>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm((f) => ({ ...f, department: e.target.value, commune: '' }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  disabled={!createForm.region}
                >
                  <option value="">— Choisir —</option>
                  {departmentsForRegion.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Commune</span>
                <select
                  value={createForm.commune}
                  onChange={(e) => setCreateForm((f) => ({ ...f, commune: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  disabled={!createForm.department}
                >
                  <option value="">— Choisir —</option>
                  {communesForDept.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Adresse</span>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Téléphone</span>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Email organisation</span>
                  <input
                    type="email"
                    value={createForm.email_org}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email_org: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">NINEA (optionnel)</span>
                <input
                  type="text"
                  value={createForm.ninea}
                  onChange={(e) => setCreateForm((f) => ({ ...f, ninea: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Type de compte</span>
                <select
                  value={createForm.account_type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, account_type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <div className="border-t border-cerip-forest/10 pt-3 mt-3">
                <p className="text-xs font-semibold text-cerip-forest/80 mb-2">Accès administrateur de l&apos;organisation (optionnel)</p>
                <p className="text-xs text-cerip-forest/60 mb-2">Créez un compte pour l&apos;admin de cette organisation. Il pourra modifier son mot de passe depuis son profil.</p>
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-xs font-medium text-cerip-forest/80">E-mail de l&apos;admin</span>
                    <input
                      type="email"
                      value={createForm.admin_email}
                      onChange={(e) => setCreateForm((f) => ({ ...f, admin_email: e.target.value }))}
                      placeholder="admin@organisation.sn"
                      className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-cerip-forest/80">Nom complet (optionnel)</span>
                    <input
                      type="text"
                      value={createForm.admin_full_name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, admin_full_name: e.target.value }))}
                      placeholder="Nom de l&apos;administrateur"
                      className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-cerip-forest/80">Mot de passe (optionnel, 6+ caractères)</span>
                    <input
                      type="password"
                      value={createForm.admin_password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, admin_password: e.target.value }))}
                      placeholder="Laisser vide pour générer un mot de passe"
                      className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeCreateModal} className="px-3 py-1.5 rounded-lg text-sm border border-cerip-forest/20 text-cerip-forest">
                  Annuler
                </button>
                <button type="submit" disabled={createSaving} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50">
                  {createSaving ? 'Création…' : 'Créer l’organisation'}
                </button>
              </div>
            </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;

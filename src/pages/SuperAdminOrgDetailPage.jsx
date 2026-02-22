import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LEGAL_FORMS } from '../data/legalForms';
import { SECTORS } from '../data/sectors';
import { SENEGAL_GEO, getDepartmentsByRegion, getCommunesByDepartment } from '../data/senegalGeo';

function SuperAdminOrgDetailPage() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [organisation, setOrganisation] = useState(null);
  const [stats, setStats] = useState({ incubes: 0, coachs: 0, promotions: 0, modules: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quotaForm, setQuotaForm] = useState({ quota_incubes: 0, quota_coachs: 0 });
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    legal_form: '',
    sector_activity: '',
    region: '',
    department: '',
    commune: '',
    address: '',
    phone: '',
    email_org: '',
    ninea: '',
    account_type: 'STANDARD',
  });
  const [savingOrg, setSavingOrg] = useState(false);
  const [adminInvite, setAdminInvite] = useState({ email: '', full_name: '', resultUrl: '' });
  const [invitingAdmin, setInvitingAdmin] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({ email: '', full_name: '', password: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminPasswordResult, setCreateAdminPasswordResult] = useState(null);
  const [createAdminEmailSent, setCreateAdminEmailSent] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: org, error: eOrg } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', orgId)
          .single();
        if (eOrg || !org) {
          setError(eOrg?.message || 'Organisation introuvable.');
          setOrganisation(null);
          setLoading(false);
          return;
        }
        setOrganisation(org);
        setQuotaForm({
          quota_incubes: org.quota_incubes ?? 0,
          quota_coachs: org.quota_coachs ?? 0,
        });
        setEditForm({
          name: org.name || '',
          legal_form: org.legal_form || '',
          sector_activity: org.sector_activity || '',
          region: org.region || '',
          department: org.department || '',
          commune: org.commune || '',
          address: org.address || '',
          phone: org.phone || '',
          email_org: org.email_org || '',
          ninea: org.ninea || '',
          account_type: org.account_type || 'STANDARD',
        });

        const [r1, r2, r3, r4] = await Promise.all([
          supabase.from('incubes').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
          supabase.from('staff_users').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('role', 'COACH'),
          supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
          supabase.from('learning_modules').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
        ]);
        setStats({
          incubes: r1.count ?? 0,
          coachs: r2.count ?? 0,
          promotions: r3.count ?? 0,
          modules: r4.count ?? 0,
        });
      } catch (err) {
        setError(err?.message || 'Erreur lors du chargement.');
        setOrganisation(null);
      }
      setLoading(false);
    };
    load();
  }, [orgId]);

  const handleToggleSuspended = async () => {
    if (!organisation) return;
    setError(null);
    const { error: e } = await supabase
      .from('organisations')
      .update({ is_suspended: !organisation.is_suspended })
      .eq('id', organisation.id);
    if (e) setError(e.message);
    else setOrganisation((prev) => (prev ? { ...prev, is_suspended: !prev.is_suspended } : null));
  };

  const handleSaveQuotas = async (ev) => {
    ev.preventDefault();
    if (!orgId) return;
    setSavingQuotas(true);
    setError(null);
    const { error: err } = await supabase
      .from('organisations')
      .update({
        quota_incubes: Math.max(0, Number(quotaForm.quota_incubes) || 0),
        quota_coachs: Math.max(0, Number(quotaForm.quota_coachs) || 0),
      })
      .eq('id', orgId);
    setSavingQuotas(false);
    if (err) setError(err.message);
    else {
      const qi = Math.max(0, Number(quotaForm.quota_incubes) || 0);
      const qc = Math.max(0, Number(quotaForm.quota_coachs) || 0);
      setQuotaForm({ quota_incubes: qi, quota_coachs: qc });
      setOrganisation((prev) => (prev ? { ...prev, quota_incubes: qi, quota_coachs: qc } : null));
    }
  };

  const handleSaveOrganisation = async (ev) => {
    ev.preventDefault();
    if (!organisation) return;
    setSavingOrg(true);
    setError(null);

    const payload = {
      name: editForm.name.trim() || organisation.name,
      legal_form: editForm.legal_form || null,
      sector_activity: editForm.sector_activity || null,
      region: editForm.region ? SENEGAL_GEO.find((r) => r.id === editForm.region)?.label ?? editForm.region : null,
      department: (() => {
        const region = SENEGAL_GEO.find((r) => r.id === editForm.region);
        const deptLabel = region?.departments?.find((d) => d.id === editForm.department)?.label ?? editForm.department;
        return deptLabel || null;
      })(),
      commune: (() => {
        const region = SENEGAL_GEO.find((r) => r.id === editForm.region);
        const dept = region?.departments?.find((d) => d.id === editForm.department);
        const comLabel = dept?.communes?.find((c) => c.id === editForm.commune)?.label ?? editForm.commune;
        return comLabel || null;
      })(),
      address: editForm.address.trim() || null,
      phone: editForm.phone.trim() || null,
      email_org: editForm.email_org.trim() || null,
      ninea: editForm.ninea.trim() || null,
      account_type: editForm.account_type || organisation.account_type,
    };

    const { error: err } = await supabase
      .from('organisations')
      .update(payload)
      .eq('id', organisation.id);
    setSavingOrg(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOrganisation((prev) => (prev ? { ...prev, ...payload } : prev));
  };

  const departmentsForRegion = getDepartmentsByRegion(editForm.region);
  const communesForDept = getCommunesByDepartment(editForm.region, editForm.department);

  const handleDeleteOrganisation = async () => {
    if (!organisation) return;
    if (!window.confirm(`Supprimer définitivement « ${organisation.name} » ? Incubés, promotions, assignations et sessions seront supprimés. Les comptes staff seront détachés.`)) return;
    setDeletingOrg(true);
    setError(null);
    try {
      const { error: updErr } = await supabase.from('staff_users').update({ organisation_id: null }).eq('organisation_id', orgId);
      if (updErr) {
        setError(updErr.message);
        setDeletingOrg(false);
        return;
      }
      const { error: delErr } = await supabase.from('organisations').delete().eq('id', orgId);
      if (delErr) {
        setError(delErr.message);
        setDeletingOrg(false);
        return;
      }
      navigate('/super-admin', { replace: true });
    } finally {
      setDeletingOrg(false);
    }
  };

  const handleCreateAdminAccount = async (ev) => {
    ev.preventDefault();
    if (!organisation || !createAdminForm.email.trim()) {
      setError('Saisissez un email pour créer le compte admin.');
      return;
    }
    const pwd = (createAdminForm.password || '').trim();
    if (pwd && pwd.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères (ou laisser vide pour en générer un).');
      return;
    }
    setCreatingAdmin(true);
    setError(null);
    setCreateAdminPasswordResult(null);
    setCreateAdminEmailSent(null);
    const adminEmail = createAdminForm.email.trim().toLowerCase();
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-platform-user', {
        body: {
          email: adminEmail,
          full_name: (createAdminForm.full_name || '').trim() || createAdminForm.email.trim(),
          password: pwd || undefined,
          role: 'ADMIN_ORG',
          organisation_id: organisation.id,
        },
      });
      if (fnErr) {
        setError(fnErr.message || 'Erreur lors de la création du compte.');
        setCreatingAdmin(false);
        return;
      }
      if (!data?.success) {
        setError(data?.error || 'Erreur lors de la création du compte.');
        setCreatingAdmin(false);
        return;
      }
      if (data.temporary_password) {
        setCreateAdminPasswordResult(data.temporary_password);
      }
      if (data.email_sent) setCreateAdminEmailSent(adminEmail);
      setCreateAdminForm({ email: '', full_name: '', password: '' });
    } catch (err) {
      setError(err?.message || 'Erreur lors de la création du compte.');
    }
    setCreatingAdmin(false);
  };

  const handleInviteAdmin = async (ev) => {
    ev.preventDefault();
    if (!organisation || !adminInvite.email.trim()) {
      setError('Saisissez un email pour inviter un administrateur.');
      return;
    }
    setInvitingAdmin(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('create_admin_invitation', {
        p_organisation_id: organisation.id,
        p_email: adminInvite.email.trim(),
        p_full_name: adminInvite.full_name.trim() || null,
      });
      if (rpcError || !data?.success) {
        setError(data?.error || rpcError?.message || 'Erreur lors de la création de l’invitation administrateur.');
        setInvitingAdmin(false);
        return;
      }
      const url = `${window.location.origin}/accept-admin-invitation?token=${encodeURIComponent(data.token)}`;
      setAdminInvite((prev) => ({ ...prev, resultUrl: url }));
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de l’invitation administrateur.');
    }
    setInvitingAdmin(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-sm text-cerip-forest/70">Chargement…</p>
      </div>
    );
  }

  if (error && !organisation) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        <Link to="/super-admin" className="mt-4 text-sm font-medium text-cerip-lime hover:underline">Retour au tableau de bord</Link>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-sm text-cerip-forest/70">Organisation introuvable.</p>
        <Link to="/super-admin" className="mt-4 text-sm font-medium text-cerip-lime hover:underline">Retour au tableau de bord</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <Link to="/super-admin" className="text-xs font-medium text-cerip-forest/70 hover:text-cerip-forest mb-2 inline-block">
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-lg font-semibold text-cerip-forest">{organisation.name}</h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          {organisation.id} · {organisation.account_type}
          {organisation.is_suspended && <span className="ml-1 text-cerip-magenta font-medium">(suspendue)</span>}
        </p>
      </header>
      <main className="flex-1 p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Profil de l’organisation</h2>
          <form onSubmit={handleSaveOrganisation} className="p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Identifiant (slug)</span>
                  <input
                    type="text"
                    value={organisation.id}
                    disabled
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 bg-cerip-forest-light/40 px-3 py-2 text-sm text-cerip-forest/80 cursor-not-allowed"
                  />
                </label>
              </div>
              <div>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Type de compte</span>
                  <select
                    value={editForm.account_type}
                    onChange={(e) => setEditForm((f) => ({ ...f, account_type: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                </label>
              </div>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-cerip-forest/80">Nom de l’organisation</span>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Forme juridique</span>
                <select
                  value={editForm.legal_form}
                  onChange={(e) => setEditForm((f) => ({ ...f, legal_form: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                >
                  <option value="">— Choisir —</option>
                  {LEGAL_FORMS.map((lf) => (
                    <option key={lf} value={lf}>{lf}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Secteur d’activité</span>
                <select
                  value={editForm.sector_activity}
                  onChange={(e) => setEditForm((f) => ({ ...f, sector_activity: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                >
                  <option value="">— Choisir —</option>
                  {SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Région</span>
                <select
                  value={editForm.region}
                  onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value, department: '', commune: '' }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
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
                  value={editForm.department}
                  onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value, commune: '' }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  disabled={!editForm.region}
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
                  value={editForm.commune}
                  onChange={(e) => setEditForm((f) => ({ ...f, commune: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  disabled={!editForm.department}
                >
                  <option value="">— Choisir —</option>
                  {communesForDept.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-cerip-forest/80">Adresse</span>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Téléphone</span>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Email organisation</span>
                <input
                  type="email"
                  value={editForm.email_org}
                  onChange={(e) => setEditForm((f) => ({ ...f, email_org: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-cerip-forest/80">NINEA</span>
              <input
                type="text"
                value={editForm.ninea}
                onChange={(e) => setEditForm((f) => ({ ...f, ninea: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingOrg}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-forest text-white hover:bg-cerip-forest/90 disabled:opacity-50 transition"
              >
                {savingOrg ? 'Enregistrement…' : 'Enregistrer le profil'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Administrateur principal</h2>
          <div className="p-4 space-y-4">
            <p className="text-xs text-cerip-forest/70">
              Invitez un administrateur pour cette organisation. Il recevra un lien à partager manuellement pour l’instant.
            </p>
            <div>
              <p className="text-xs font-medium text-cerip-forest/80 mb-2">Créer un compte admin (recommandé)</p>
              <p className="text-xs text-cerip-forest/70 mb-2">
                Créez un compte avec email et mot de passe. L&apos;admin pourra modifier son mot de passe depuis son profil.
              </p>
              <form onSubmit={handleCreateAdminAccount} className="grid gap-3 md:grid-cols-[2fr,2fr,1fr,auto] items-end">
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Email</span>
                  <input
                    type="email"
                    value={createAdminForm.email}
                    onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Nom (optionnel)</span>
                  <input
                    type="text"
                    value={createAdminForm.full_name}
                    onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-cerip-forest/80">Mot de passe (optionnel)</span>
                  <input
                    type="password"
                    value={createAdminForm.password}
                    onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Vide = généré"
                    className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  />
                </label>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
                >
                  {creatingAdmin ? 'Création…' : 'Créer le compte'}
                </button>
              </form>
              {createAdminPasswordResult && (
                <div className="mt-2 rounded-lg border border-cerip-forest/15 bg-cerip-forest-light/40 px-3 py-2 space-y-1">
                  <p className="text-xs font-medium text-cerip-forest/80">Mot de passe temporaire à communiquer</p>
                  <p className="text-sm font-mono text-cerip-forest break-all select-all">{createAdminPasswordResult}</p>
                  {createAdminEmailSent && (
                    <p className="text-xs text-cerip-forest/80">Un email a été envoyé à {createAdminEmailSent} avec les instructions de connexion.</p>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-cerip-forest/10 pt-3">
              <p className="text-xs font-medium text-cerip-forest/80 mb-2">Ou inviter par lien</p>
              <form onSubmit={handleInviteAdmin} className="grid gap-3 md:grid-cols-[2fr,2fr,auto] items-end">
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Email administrateur</span>
                <input
                  type="email"
                  value={adminInvite.email}
                  onChange={(e) => setAdminInvite((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-cerip-forest/80">Nom complet (optionnel)</span>
                <input
                  type="text"
                  value={adminInvite.full_name}
                  onChange={(e) => setAdminInvite((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest"
                />
              </label>
              <button
                type="submit"
                disabled={invitingAdmin}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
              >
                {invitingAdmin ? 'Invitation…' : 'Inviter'}
              </button>
            </form>
            {adminInvite.resultUrl && (
              <div className="mt-2 rounded-lg border border-cerip-forest/15 bg-cerip-forest-light/40 px-3 py-2">
                <p className="text-xs font-medium text-cerip-forest/80 mb-1">Lien d’invitation généré</p>
                <p className="text-xs text-cerip-forest break-all select-all">{adminInvite.resultUrl}</p>
              </div>
            )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Indicateurs</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 p-4">
            <div className="rounded-lg border border-cerip-forest/10 p-3">
              <p className="text-xs text-cerip-forest/70">Incubés</p>
              <p className="text-xl font-semibold text-cerip-forest">{stats.incubes}</p>
            </div>
            <div className="rounded-lg border border-cerip-forest/10 p-3">
              <p className="text-xs text-cerip-forest/70">Coachs</p>
              <p className="text-xl font-semibold text-cerip-forest">{stats.coachs}</p>
            </div>
            <div className="rounded-lg border border-cerip-forest/10 p-3">
              <p className="text-xs text-cerip-forest/70">Promotions</p>
              <p className="text-xl font-semibold text-cerip-forest">{stats.promotions}</p>
            </div>
            <div className="rounded-lg border border-cerip-forest/10 p-3">
              <p className="text-xs text-cerip-forest/70">Modules</p>
              <p className="text-xl font-semibold text-cerip-forest">{stats.modules}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Actions</h2>
          <div className="p-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleToggleSuspended}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                organisation.is_suspended ? 'bg-cerip-lime text-white hover:bg-cerip-lime-dark' : 'bg-cerip-magenta/10 text-cerip-magenta hover:bg-cerip-magenta/20'
              }`}
            >
              {organisation.is_suspended ? 'Réactiver l\'organisation' : 'Suspendre l\'organisation'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">Quotas</h2>
          <form onSubmit={handleSaveQuotas} className="p-4 space-y-4 max-w-sm">
            <label className="block">
              <span className="text-xs font-medium text-cerip-forest/80">Quota incubés</span>
              <input
                type="number"
                min={0}
                value={quotaForm.quota_incubes}
                onChange={(e) => setQuotaForm((f) => ({ ...f, quota_incubes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-cerip-forest/80">Quota coachs</span>
              <input
                type="number"
                min={0}
                value={quotaForm.quota_coachs}
                onChange={(e) => setQuotaForm((f) => ({ ...f, quota_coachs: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-cerip-forest/20 px-3 py-2 text-sm text-cerip-forest focus:ring-2 focus:ring-cerip-lime"
              />
            </label>
            <button
              type="submit"
              disabled={savingQuotas}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {savingQuotas ? 'Enregistrement…' : 'Enregistrer les quotas'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <h2 className="text-sm font-semibold text-red-800 px-4 py-3 border-b border-red-200 bg-red-50">Zone dangereuse</h2>
          <div className="p-4">
            <p className="text-sm text-cerip-forest/80 mb-3">
              La suppression de l&apos;organisation est irréversible. Incubés, promotions, assignations et sessions seront supprimés ; les comptes staff seront détachés.
            </p>
            <button
              type="button"
              disabled={deletingOrg}
              onClick={handleDeleteOrganisation}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deletingOrg ? 'Suppression…' : 'Supprimer l\'organisation'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SuperAdminOrgDetailPage;

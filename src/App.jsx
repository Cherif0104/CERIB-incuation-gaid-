import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { supabase, checkSupabaseConnection } from './lib/supabaseClient';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import AcceptAdminInvitationPage from './pages/AcceptAdminInvitationPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminOrgDetailPage from './pages/SuperAdminOrgDetailPage';
import SuperAdminStaffPage from './pages/SuperAdminStaffPage';
import SuperAdminStaffDetailPage from './pages/SuperAdminStaffDetailPage';
import SuperAdminInvitationsPage from './pages/SuperAdminInvitationsPage';
import AdminOrgDashboard from './pages/AdminOrgDashboard';
import CoachDashboard from './pages/CoachDashboard';
import CoachIncubeDetailPage from './pages/CoachIncubeDetailPage';
import CertificateurDashboard from './pages/CertificateurDashboard';
import IncubePortal from './pages/IncubePortal';
import AdminOrgCodesPage from './pages/AdminOrgCodesPage';
import AdminOrgPromotionsPage from './pages/AdminOrgPromotionsPage';
import AdminOrgCoachsPage from './pages/AdminOrgCoachsPage';
import AdminOrgCertificateursPage from './pages/AdminOrgCertificateursPage';
import AdminOrgMatrixagePage from './pages/AdminOrgMatrixagePage';
import AdminOrgIncubesPage from './pages/AdminOrgIncubesPage';
import AdminOrgModulesPage from './pages/AdminOrgModulesPage';
import CertificateurQuestionsPage from './pages/CertificateurQuestionsPage';
import IncubeExamPage from './pages/IncubeExamPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import LoadingOverlay from './components/LoadingOverlay';
import IncubeProfileLayout from './components/IncubeProfileLayout';
import OrganisationSuspendedPage from './pages/OrganisationSuspendedPage';

const OVERLAY_EXIT_MS = 220;

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overlayExiting, setOverlayExiting] = useState(false);
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const exitTimeoutRef = useRef(null);
  const [orgCheck, setOrgCheck] = useState({ loading: false, checked: false, suspended: false });

  /** Déconnexion : nettoie l’état tout de suite pour que la redirection vers /login affiche bien la page de connexion. */
  const onLogout = useCallback(() => {
    setSession(null);
    setProfile(null);
    setOrgCheck({ loading: false, checked: false, suspended: false });
    setJustLoggedOut(true);
  }, []);

  const updateOrgSuspension = useCallback(
    async (p) => {
      if (!p) {
        setOrgCheck({ loading: false, checked: false, suspended: false });
        return;
      }
      const isOrgScoped =
        p.kind === 'incube' ||
        (p.kind === 'staff' && p.organisation_id && p.role !== 'SUPER_ADMIN');
      if (!isOrgScoped) {
        setOrgCheck({ loading: false, checked: true, suspended: false });
        return;
      }
      setOrgCheck({ loading: true, checked: false, suspended: false });
      try {
        const { data: org, error } = await supabase
          .from('organisations')
          .select('id, is_suspended')
          .eq('id', p.organisation_id)
          .maybeSingle();
        if (error) {
          console.error('Chargement organisation pour suspension:', error);
          setOrgCheck({ loading: false, checked: true, suspended: false });
          return;
        }
        setOrgCheck({
          loading: false,
          checked: true,
          suspended: !!org?.is_suspended,
        });
      } catch (err) {
        console.error('Erreur vérification suspension organisation:', err);
        setOrgCheck({ loading: false, checked: true, suspended: false });
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const conn = await checkSupabaseConnection();
        if (!conn.ok) {
          const msg = conn.error || '';
          if (/refresh.?token|invalid.?token|token.?not.?found/i.test(msg)) {
            await supabase.auth.signOut();
          } else {
            console.warn('Supabase non disponible:', conn.error);
          }
          setSession(null);
          setProfile(null);
        } else {
          const {
            data: { session: currentSession },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            const msg = sessionError.message || '';
            if (/refresh.?token|invalid.?token|token.?not.?found/i.test(msg)) {
              await supabase.auth.signOut();
            }
            setSession(null);
            setProfile(null);
          } else {
            setSession(currentSession ?? null);
            if (currentSession) {
              const { data: staffProfile } = await supabase
                .from('staff_users')
                .select('*')
                .eq('auth_user_id', currentSession.user.id)
                .maybeSingle();

              if (staffProfile) {
                const p = { ...staffProfile, kind: 'staff' };
                setProfile(p);
                await updateOrgSuspension(p);
              } else {
                const { data: incubeProfile } = await supabase
                  .from('incubes')
                  .select('*')
                  .eq('auth_user_id', currentSession.user.id)
                  .maybeSingle();
                if (incubeProfile) {
                  const p = { ...incubeProfile, kind: 'incube' };
                  setProfile(p);
                  await updateOrgSuspension(p);
                }
              }
            }
          }
        }
      } catch (err) {
        const msg = err?.message || String(err);
        if (/refresh.?token|invalid.?token|token.?not.?found/i.test(msg)) {
          try {
            await supabase.auth.signOut();
          } catch (_) {}
          setSession(null);
          setProfile(null);
        } else {
          console.error('Init auth:', err);
        }
      } finally {
        setOverlayExiting(true);
        exitTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setOverlayExiting(false);
        }, OVERLAY_EXIT_MS);
      }
    };

    init();
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      if (!newSession) {
        setProfile(null);
        setOrgCheck({ loading: false, checked: false, suspended: false });
        return;
      }
      try {
        const { data: staffProfile } = await supabase
          .from('staff_users')
          .select('*')
          .eq('auth_user_id', newSession.user.id)
          .maybeSingle();
        if (staffProfile) {
          const p = { ...staffProfile, kind: 'staff' };
          setProfile(p);
          await updateOrgSuspension(p);
        } else {
          const { data: incubeProfile } = await supabase
            .from('incubes')
            .select('*')
            .eq('auth_user_id', newSession.user.id)
            .maybeSingle();
          if (incubeProfile) {
            const p = { ...incubeProfile, kind: 'incube' };
            setProfile(p);
            await updateOrgSuspension(p);
          } else {
            setProfile(null);
            setOrgCheck({ loading: false, checked: false, suspended: false });
          }
        }
      } catch (err) {
        console.error('Chargement profil après connexion:', err);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Redirection vers le dashboard selon le rôle. Périmètres : incubé (parcours) ; SUPER_ADMIN (vue globale) ; ADMIN_ORG/ADMIN (org) ; COACH (mes incubés) ; CERTIFICATEUR (sessions, questions). */
  const getDashboardPath = useCallback((p) => {
    if (!p) return '/login';
    if (p.kind === 'incube') return '/incube';
    if (p.role === 'SUPER_ADMIN') return '/super-admin';
    if (p.role === 'ADMIN_ORG' || p.role === 'ADMIN') return '/admin-org';
    if (p.role === 'COACH') return '/coach';
    if (p.role === 'CERTIFICATEUR') return '/certificateur';
    return '/login';
  }, []);

  /** Charge le profil (staff ou incubé) à partir de la session courante. */
  const loadProfileFromSession = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return null;
    const { data: staffProfile } = await supabase
      .from('staff_users')
      .select('*')
      .eq('auth_user_id', currentSession.user.id)
      .maybeSingle();
    if (staffProfile) return { ...staffProfile, kind: 'staff' };
    const { data: incubeProfile } = await supabase
      .from('incubes')
      .select('*')
      .eq('auth_user_id', currentSession.user.id)
      .maybeSingle();
    if (incubeProfile) return { ...incubeProfile, kind: 'incube' };
    return null;
  }, []);

  /** Appelée après un login réussi : charge le profil, met à jour l’état, retourne le chemin de redirection. */
  const onLoginSuccess = useCallback(async () => {
    const { data: { session: newSession } } = await supabase.auth.getSession();
    setSession(newSession ?? null);
    const p = await loadProfileFromSession();
    setProfile(p);
    await updateOrgSuspension(p);
    setJustLoggedOut(false);
    return getDashboardPath(p);
  }, [loadProfileFromSession, getDashboardPath, updateOrgSuspension]);

  const refetchProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return;
    const { data: staffProfile } = await supabase.from('staff_users').select('*').eq('auth_user_id', currentSession.user.id).maybeSingle();
    if (staffProfile) {
      const p = { ...staffProfile, kind: 'staff' };
      setProfile(p);
      await updateOrgSuspension(p);
    } else {
      const { data: incubeProfile } = await supabase.from('incubes').select('*').eq('auth_user_id', currentSession.user.id).maybeSingle();
      if (incubeProfile) {
        const p = { ...incubeProfile, kind: 'incube' };
        setProfile(p);
        await updateOrgSuspension(p);
      }
    }
  }, [updateOrgSuspension]);

  const requireAuth = (render, predicate) => {
    if (loading || overlayExiting) {
      return (
        <LoadingOverlay
          message="Chargement…"
          subMessage="Vérification de votre session"
          exiting={overlayExiting}
        />
      );
    }
    if (!session || !profile) {
      return <Navigate to="/login" replace />;
    }
    if (predicate && !predicate(profile)) {
      return <Navigate to="/login" replace />;
    }
    const needsOrgCheck =
      profile.kind === 'incube' ||
      (profile.kind === 'staff' && profile.organisation_id && profile.role !== 'SUPER_ADMIN');
    if (needsOrgCheck) {
      if (orgCheck.loading || !orgCheck.checked) {
        return (
          <LoadingOverlay
            message="Chargement…"
            subMessage="Vérification de votre organisation"
            exiting={false}
          />
        );
      }
      if (orgCheck.suspended) {
        return <Navigate to="/organisation-suspendue" replace />;
      }
    }
    const element = typeof render === 'function' ? render(profile) : render;
    return element;
  };

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen flex flex-col bg-cerip-forest-light">
        <Routes>
          <Route
            path="/"
            element={
              session && profile ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Si déjà connecté avec un profil, redirection vers le dashboard du rôle */}
          <Route
            path="/login"
            element={
              session && profile && !justLoggedOut ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <LoginPage onLoginSuccess={onLoginSuccess} onClearLogoutFlag={() => setJustLoggedOut(false)} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              session && profile ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <SignUpPage />
              )
            }
          />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/accept-admin-invitation" element={<AcceptAdminInvitationPage />} />
          <Route
            path="/super-admin"
            element={requireAuth((p) => <DashboardLayout profile={p} onLogout={onLogout}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'SUPER_ADMIN')}
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="organisations/:orgId" element={<SuperAdminOrgDetailPage />} />
            <Route path="staff" element={<SuperAdminStaffPage />} />
            <Route path="staff/:staffId" element={<SuperAdminStaffDetailPage />} />
            <Route path="invitations" element={<SuperAdminInvitationsPage />} />
          </Route>
          <Route
            path="/admin-org"
            element={requireAuth((p) => <DashboardLayout profile={p} onLogout={onLogout}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'ADMIN_ORG' || p.role === 'ADMIN')}
          >
            <Route index element={<AdminOrgDashboard />} />
            <Route path="incubes" element={<AdminOrgIncubesPage />} />
            <Route path="codes" element={<AdminOrgCodesPage />} />
            <Route path="promotions" element={<AdminOrgPromotionsPage />} />
            <Route path="coachs" element={<AdminOrgCoachsPage />} />
            <Route path="certificateurs" element={<AdminOrgCertificateursPage />} />
            <Route path="matrixage" element={<AdminOrgMatrixagePage />} />
            <Route path="modules" element={<AdminOrgModulesPage />} />
          </Route>
          <Route
            path="/coach"
            element={requireAuth((p) => <DashboardLayout profile={p} onLogout={onLogout}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'COACH')}
          >
            <Route index element={<CoachDashboard />} />
            <Route path="incubes/:incubeId" element={<CoachIncubeDetailPage />} />
          </Route>
          <Route
            path="/certificateur"
            element={requireAuth((p) => <DashboardLayout profile={p} onLogout={onLogout}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'CERTIFICATEUR')}
          >
            <Route index element={<CertificateurDashboard />} />
            <Route path="questions" element={<CertificateurQuestionsPage />} />
          </Route>
          <Route
            path="/incube"
            element={requireAuth((p) => <IncubePortal profile={p} onRefreshProfile={refetchProfile} onLogout={onLogout} />, (p) => p.kind === 'incube')}
          />
          <Route
            path="/incube/exam"
            element={requireAuth((p) => <IncubeExamPage profile={p} onDone={refetchProfile} onLogout={onLogout} />, (p) => p.kind === 'incube')}
          />
          <Route
            path="/organisation-suspendue"
            element={<OrganisationSuspendedPage onLogout={onLogout} />}
          />
          <Route
            path="/profile"
            element={requireAuth((p) =>
              p.kind === 'incube' ? (
                <IncubeProfileLayout profile={p} onLogout={onLogout}>
                  <ProfilePage profile={p} onUpdate={refetchProfile} />
                </IncubeProfileLayout>
              ) : (
                <DashboardLayout profile={p} onLogout={onLogout}>
                  <ProfilePage profile={p} onUpdate={refetchProfile} />
                </DashboardLayout>
              )
            )}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;


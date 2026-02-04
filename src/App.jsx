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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminProgrammesPage from './pages/SuperAdminProgrammesPage';
import AdminOrgDashboard from './pages/AdminOrgDashboard';
import CoachDashboard from './pages/CoachDashboard';
import CertificateurDashboard from './pages/CertificateurDashboard';
import IncubePortal from './pages/IncubePortal';
import AdminOrgCodesPage from './pages/AdminOrgCodesPage';
import AdminOrgPromotionsPage from './pages/AdminOrgPromotionsPage';
import AdminOrgCoachsPage from './pages/AdminOrgCoachsPage';
import AdminOrgMatrixagePage from './pages/AdminOrgMatrixagePage';
import AdminOrgIncubesPage from './pages/AdminOrgIncubesPage';
import AdminOrgModulesPage from './pages/AdminOrgModulesPage';
import AdminOrgProgrammesPage from './pages/AdminOrgProgrammesPage';
import AdminOrgProjetsPage from './pages/AdminOrgProjetsPage';
import AdminOrgTachesPage from './pages/AdminOrgTachesPage';
import CertificateurQuestionsPage from './pages/CertificateurQuestionsPage';
import IncubeExamPage from './pages/IncubeExamPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import LoadingOverlay from './components/LoadingOverlay';
import IncubeProfileLayout from './components/IncubeProfileLayout';

const OVERLAY_EXIT_MS = 220;

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overlayExiting, setOverlayExiting] = useState(false);
  const exitTimeoutRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const conn = await checkSupabaseConnection();
        if (!conn.ok) {
          console.warn('Supabase non disponible:', conn.error);
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession ?? null);

        if (currentSession) {
          const { data: staffProfile } = await supabase
            .from('staff_users')
            .select('*')
            .eq('auth_user_id', currentSession.user.id)
            .maybeSingle();

          if (staffProfile) {
            setProfile({ ...staffProfile, kind: 'staff' });
          } else {
            const { data: incubeProfile } = await supabase
              .from('incubes')
              .select('*')
              .eq('auth_user_id', currentSession.user.id)
              .maybeSingle();
            if (incubeProfile) {
              setProfile({ ...incubeProfile, kind: 'incube' });
            }
          }
        }
      } catch (err) {
        console.error('Init auth:', err);
      } finally {
        setOverlayExiting(true);
        exitTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setOverlayExiting(false);
        }, OVERLAY_EXIT_MS);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      if (!newSession) {
        setProfile(null);
        return;
      }
      try {
        const { data: staffProfile } = await supabase
          .from('staff_users')
          .select('*')
          .eq('auth_user_id', newSession.user.id)
          .maybeSingle();
        if (staffProfile) {
          setProfile({ ...staffProfile, kind: 'staff' });
        } else {
          const { data: incubeProfile } = await supabase
            .from('incubes')
            .select('*')
            .eq('auth_user_id', newSession.user.id)
            .maybeSingle();
          if (incubeProfile) {
            setProfile({ ...incubeProfile, kind: 'incube' });
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Chargement profil après connexion:', err);
        setProfile(null);
      }
    });

    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  /** Redirection vers le dashboard selon le rôle (incubé, super-admin, admin-org, coach, certificateur). */
  const getDashboardPath = useCallback((p) => {
    if (!p) return '/login';
    if (p.kind === 'incube') return '/incube';
    if (p.role === 'SUPER_ADMIN') return '/super-admin';
    if (p.role === 'ADMIN_ORG') return '/admin-org';
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

  /** Appelée après un login réussi : charge le profil, met à jour l'état, retourne le chemin de redirection. */
  const onLoginSuccess = useCallback(async () => {
    const p = await loadProfileFromSession();
    setProfile(p);
    return getDashboardPath(p);
  }, [loadProfileFromSession, getDashboardPath]);

  const refetchProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return;
    const { data: staffProfile } = await supabase.from('staff_users').select('*').eq('auth_user_id', currentSession.user.id).maybeSingle();
    if (staffProfile) {
      setProfile({ ...staffProfile, kind: 'staff' });
    } else {
      const { data: incubeProfile } = await supabase.from('incubes').select('*').eq('auth_user_id', currentSession.user.id).maybeSingle();
      if (incubeProfile) setProfile({ ...incubeProfile, kind: 'incube' });
    }
  }, []);

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
              session && profile ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <LoginPage onLoginSuccess={onLoginSuccess} />
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
          <Route
            path="/super-admin/programmes"
            element={requireAuth((p) => <DashboardLayout profile={p}><SuperAdminProgrammesPage /></DashboardLayout>, (p) => p.role === 'SUPER_ADMIN')}
          />
          <Route
            path="/super-admin"
            element={requireAuth((p) => <DashboardLayout profile={p}><SuperAdminDashboard profile={p} /></DashboardLayout>, (p) => p.role === 'SUPER_ADMIN')}
          />
          <Route
            path="/admin-org"
            element={requireAuth((p) => <DashboardLayout profile={p}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'ADMIN_ORG')}
          >
            <Route index element={<AdminOrgDashboard />} />
            <Route path="incubes" element={<AdminOrgIncubesPage />} />
            <Route path="codes" element={<AdminOrgCodesPage />} />
            <Route path="promotions" element={<AdminOrgPromotionsPage />} />
            <Route path="coachs" element={<AdminOrgCoachsPage />} />
            <Route path="matrixage" element={<AdminOrgMatrixagePage />} />
            <Route path="modules" element={<AdminOrgModulesPage />} />
            <Route path="programmes" element={<AdminOrgProgrammesPage />} />
            <Route path="programmes/:programmeId/projets" element={<AdminOrgProjetsPage />} />
            <Route path="programmes/:programmeId/projets/:projetId/taches" element={<AdminOrgTachesPage />} />
          </Route>
          <Route
            path="/coach"
            element={requireAuth((p) => <DashboardLayout profile={p}><CoachDashboard profile={p} /></DashboardLayout>, (p) => p.role === 'COACH')}
          />
          <Route
            path="/certificateur"
            element={requireAuth((p) => <DashboardLayout profile={p}><Outlet context={{ profile: p }} /></DashboardLayout>, (p) => p.role === 'CERTIFICATEUR')}
          >
            <Route index element={<CertificateurDashboard />} />
            <Route path="questions" element={<CertificateurQuestionsPage />} />
          </Route>
          <Route
            path="/incube"
            element={requireAuth((p) => <IncubePortal profile={p} onRefreshProfile={refetchProfile} />, (p) => p.kind === 'incube')}
          />
          <Route
            path="/incube/exam"
            element={requireAuth((p) => <IncubeExamPage profile={p} onDone={refetchProfile} />, (p) => p.kind === 'incube')}
          />
          <Route
            path="/profile"
            element={requireAuth((p) =>
              p.kind === 'incube' ? (
                <IncubeProfileLayout profile={p}>
                  <ProfilePage profile={p} onUpdate={refetchProfile} />
                </IncubeProfileLayout>
              ) : (
                <DashboardLayout profile={p}>
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


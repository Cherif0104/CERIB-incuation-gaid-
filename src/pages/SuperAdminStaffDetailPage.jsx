import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { STAFF_ROLE_LABELS } from '../data/roleLabels';

function SuperAdminStaffDetailPage() {
  const { staffId } = useParams();
  const [staff, setStaff] = useState(null);
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!staffId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: s, error: eStaff } = await supabase
          .from('staff_users')
          .select('*')
          .eq('id', staffId)
          .single();
        if (eStaff || !s) {
          setError(eStaff?.message || 'Membre du staff introuvable.');
          setStaff(null);
          setLoading(false);
          return;
        }
        setStaff(s);
        if (s.organisation_id) {
          const { data: org, error: eOrg } = await supabase
            .from('organisations')
            .select('*')
            .eq('id', s.organisation_id)
            .maybeSingle();
          if (!eOrg) {
            setOrganisation(org || null);
          }
        }
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement du membre du staff.');
        setStaff(null);
      }
      setLoading(false);
    };
    load();
  }, [staffId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-6">
        <p className="text-sm text-cerip-forest/70">Chargement…</p>
      </div>
    );
  }

  if (error && !staff) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-3">
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        <Link to="/super-admin/staff" className="text-sm font-medium text-cerip-lime hover:underline">
          ← Retour à la liste du staff
        </Link>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-3">
        <p className="text-sm text-cerip-forest/70">Membre du staff introuvable.</p>
        <Link to="/super-admin/staff" className="text-sm font-medium text-cerip-lime hover:underline">
          ← Retour à la liste du staff
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-4 border-b border-cerip-forest/10 bg-white">
        <Link
          to="/super-admin/staff"
          className="text-xs font-medium text-cerip-forest/70 hover:text-cerip-forest mb-2 inline-block"
        >
          ← Retour à la liste du staff
        </Link>
        <h1 className="text-lg font-semibold text-cerip-forest">
          {staff.full_name || staff.email}
        </h1>
        <p className="text-xs text-cerip-forest/70 mt-0.5">
          {staff.email} · {STAFF_ROLE_LABELS?.[staff.role] ?? staff.role}
        </p>
      </header>
      <main className="flex-1 p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
          <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
            Informations principales
          </h2>
          <dl className="p-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-cerip-forest/70">Nom complet</dt>
              <dd className="text-sm text-cerip-forest">{staff.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">Email</dt>
              <dd className="text-sm text-cerip-forest">{staff.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">Rôle</dt>
              <dd className="text-sm text-cerip-forest">
                {STAFF_ROLE_LABELS?.[staff.role] ?? staff.role}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">Organisation</dt>
              <dd className="text-sm text-cerip-forest">
                {staff.organisation_id ? (
                  organisation ? (
                    <Link
                      to={`/super-admin/organisations/${staff.organisation_id}`}
                      className="text-cerip-lime hover:underline"
                    >
                      {organisation.name} ({staff.organisation_id})
                    </Link>
                  ) : (
                    staff.organisation_id
                  )
                ) : (
                  <span className="text-cerip-forest/50">Aucune</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">Créé le</dt>
              <dd className="text-sm text-cerip-forest">
                {staff.created_at ? new Date(staff.created_at).toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">ID staff</dt>
              <dd className="text-xs text-cerip-forest/80 break-all">{staff.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-cerip-forest/70">ID utilisateur Auth</dt>
              <dd className="text-xs text-cerip-forest/80 break-all">{staff.auth_user_id}</dd>
            </div>
          </dl>
        </section>

        {staff.visibility_scope && (
          <section className="bg-white rounded-xl shadow-sm border border-cerip-forest/10 overflow-hidden">
            <h2 className="text-sm font-semibold text-cerip-forest px-4 py-3 border-b border-cerip-forest/10">
              Portée de visibilité (JSON)
            </h2>
            <pre className="p-4 text-xs text-cerip-forest bg-cerip-forest-light/30 overflow-auto rounded-b-xl">
              {JSON.stringify(staff.visibility_scope, null, 2)}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
}

export default SuperAdminStaffDetailPage;


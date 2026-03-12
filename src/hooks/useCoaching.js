import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export function useCoaching(profileId, coachId, organisationId) {
  const [coachingRequests, setCoachingRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profileId) return;
    setLoadError(null);
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('coaching_requests')
          .select('id, message, status, created_at, responded_at, request_type, objectif, travail_preparatoire, scheduled_at, platform, meeting_link')
          .eq('incube_id', profileId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCoachingRequests(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'coaching', message: e?.message || 'Erreur de chargement des demandes.' });
      }
    };
    fetch();
  }, [profileId, retryKey]);

  useEffect(() => {
    if (!profileId || !coachId) return;
    setLoadError((prev) => (prev?.scope === 'messages' ? null : prev));
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('coach_incube_messages')
          .select('id, body, is_urgence, from_incube, created_at')
          .eq('incube_id', profileId)
          .eq('coach_id', coachId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data ?? []);
      } catch (e) {
        setLoadError({ scope: 'messages', message: e?.message || 'Erreur de chargement des messages.' });
      }
    };
    fetch();
  }, [profileId, coachId, retryKey]);

  const pendingCount = coachingRequests.filter((r) => r.status === 'PENDING').length;
  const rdvCount = coachingRequests.filter((r) => r.request_type === 'RDV').length;

  const demanderCoaching = async (message) => {
    if (!profileId || !coachId || !organisationId) return false;
    const { error } = await supabase.from('coaching_requests').insert({
      incube_id: profileId,
      coach_id: coachId,
      organisation_id: organisationId,
      status: 'PENDING',
      message: message?.trim() || null,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Demande envoyée');
    setRetryKey((k) => k + 1);
    return true;
  };

  const demanderRdv = async (message) => {
    if (!profileId || !coachId || !organisationId) return false;
    const { error } = await supabase.from('coaching_requests').insert({
      incube_id: profileId,
      coach_id: coachId,
      organisation_id: organisationId,
      status: 'PENDING',
      message: message?.trim() || null,
      request_type: 'RDV',
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Demande de RDV envoyée');
    setRetryKey((k) => k + 1);
    return true;
  };

  const sendMessage = async (body) => {
    if (!profileId || !coachId || !body?.trim()) return false;
    const { error } = await supabase.from('coach_incube_messages').insert({
      incube_id: profileId,
      coach_id: coachId,
      body: body.trim(),
      is_urgence: false,
      from_incube: true,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Message envoyé');
    setRetryKey((k) => k + 1);
    return true;
  };

  const sendSosUrgence = async (body) => {
    if (!profileId || !coachId || !body?.trim()) return false;
    const { error } = await supabase.from('coach_incube_messages').insert({
      incube_id: profileId,
      coach_id: coachId,
      body: body.trim(),
      is_urgence: true,
      from_incube: true,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('SOS urgence envoyé');
    setRetryKey((k) => k + 1);
    return true;
  };

  const retry = () => setRetryKey((k) => k + 1);

  return {
    coachingRequests,
    messages,
    loadError,
    pendingCount,
    rdvCount,
    demanderCoaching,
    demanderRdv,
    sendMessage,
    sendSosUrgence,
    retry,
    refresh: () => setRetryKey((k) => k + 1),
  };
}

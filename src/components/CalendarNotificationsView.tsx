import React, { useEffect, useState } from 'react';
import { Bell, Calendar, CheckCheck, Plus, Trash2 } from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEBATE_TOPICS_300 } from '../data/debateTopics';
import type { ScheduledDebateItem, UserAccount, UserNotificationItem } from '../types';

interface CalendarNotificationsViewProps {
  userAccount: UserAccount;
  notifications: UserNotificationItem[];
}

export function CalendarNotificationsView({
  userAccount,
  notifications,
}: CalendarNotificationsViewProps) {
  const [events, setEvents] = useState<ScheduledDebateItem[]>([]);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(DEBATE_TOPICS_300[0].title);
  const [scheduledFor, setScheduledFor] = useState('');
  const [format, setFormat] = useState<'1v1' | 'grupo' | 'privada'>('1v1');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [inviteCode, setInviteCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'scheduled_debates'),
      where('ownerUid', '==', userAccount.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as ScheduledDebateItem)
          .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
        setEvents(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'scheduled_debates')
    );
    return () => unsub();
  }, [userAccount.uid]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledFor) return;
    setSaving(true);
    try {
      const eventId = `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'scheduled_debates', eventId), {
        eventId,
        ownerUid: userAccount.uid,
        title: title.trim().slice(0, 140),
        topic: topic.slice(0, 160),
        scheduledFor,
        format,
        durationMinutes,
        ...(inviteCode.trim() ? { inviteCode: inviteCode.trim().toUpperCase() } : {}),
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setInviteCode('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'scheduled_debates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'scheduled_debates', eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `scheduled_debates/${eventId}`);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => updateDoc(doc(db, 'notifications', n.notifId), { read: true }))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  return (
    <div className="space-y-7">
      <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 sm:p-8 shadow-editorial-sm space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#A18450] font-semibold">
          Planificación personal y avisos
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#292820]">
          Calendario y notificaciones
        </h1>
        <p className="text-sm text-[#777367] max-w-2xl">
          Reserva franjas horarias para tus próximos debates privados o por equipos y revisa tus solicitudes o invitaciones recientes.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#A18450] font-semibold">
              <Plus className="w-4 h-4" />
              Programar nuevo debate
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-[#777367]">Título recordatorio *</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Debate vivienda con Laura"
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-[#777367]">Fecha y hora *</span>
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-[#777367]">Tema previsto</span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-sm"
              >
                {DEBATE_TOPICS_300.slice(0, 35).map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-[#777367]">Formato</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as '1v1' | 'grupo' | 'privada')}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs"
                >
                  <option value="1v1">1v1</option>
                  <option value="grupo">Grupal</option>
                  <option value="privada">Sala privada</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-[#777367]">Minutos</span>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-[#777367]">Código (opc.)</span>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ANT-..."
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#E8E3D8] rounded-sm text-xs font-mono-tabular"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#A18450] hover:bg-[#79613B] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-sm cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar en calendario'}
            </button>
          </form>

          <div className="bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#292820] font-semibold">
              <Calendar className="w-4 h-4 text-[#A18450]" />
              Debates programados ({events.length})
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-[#777367]">No tienes citas programadas en tu calendario.</p>
            ) : (
              <div className="divide-y divide-[#E8E3D8]">
                {events.map((ev) => (
                  <div key={ev.eventId} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#292820]">{ev.title}</p>
                      <p className="text-xs text-[#777367]">{ev.topic}</p>
                      <p className="text-[11px] font-mono-tabular text-[#A18450]">
                        {new Date(ev.scheduledFor).toLocaleString('es-ES')} · {ev.format.toUpperCase()} · {ev.durationMinutes} min
                        {ev.inviteCode ? ` · Código ${ev.inviteCode}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.eventId)}
                      className="p-1.5 text-[#777367] hover:text-[#793B2B] cursor-pointer"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones */}
        <div className="lg:col-span-5 bg-white border border-[#E8E3D8] rounded-sm p-6 shadow-editorial-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E3D8] pb-3">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#292820] font-semibold">
              <Bell className="w-4 h-4 text-[#A18450]" />
              Notificaciones ({notifications.filter((n) => !n.read).length} sin leer)
            </span>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-[#A18450] hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todo leído
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-[#777367]">No tienes notificaciones pendientes.</p>
          ) : (
            <div className="divide-y divide-[#E8E3D8]">
              {notifications.map((n) => (
                <div
                  key={n.notifId}
                  className={`py-3.5 space-y-1 ${n.read ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#292820]">{n.title}</p>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.notifId)}
                        className="text-[11px] text-[#A18450] hover:underline cursor-pointer shrink-0"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#777367] leading-relaxed">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

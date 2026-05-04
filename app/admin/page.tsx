'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface Booking {
  id: number;
  status: string;
  notes: string | null;
  createdAt: string;
  user: { id: number; name: string; email: string };
}

interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  booking: Booking | null;
  admin: { name: string };
}

interface User {
  name: string;
  role: string;
}

type Tab = 'slots' | 'bookings';
type CreateMode = 'single' | 'bulk';

function groupByDate(slots: Slot[]) {
  return slots.reduce((acc: Record<string, Slot[]>, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('slots');
  const [showForm, setShowForm] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('single');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single slot form
  const [singleForm, setSingleForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '09:30',
    title: 'Appointment',
  });

  // Bulk slot form
  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '09:30',
    title: 'Appointment',
    days: [1, 2, 3, 4, 5] as number[], // Mon–Fri by default
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/slots').then((r) => r.json()),
    ]).then(([meData, slotsData]) => {
      setUser(meData.user);
      setSlots(slotsData.slots || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/slots').then((r) => r.json()).then((d) => setSlots(d.slots || []));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleCreateSingle(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleForm),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to create slot'); return; }
      setSlots((prev) => [...prev, data.slot].sort((a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      ));
      setShowForm(false);
      setSingleForm({ date: '', startTime: '09:00', endTime: '09:30', title: 'Appointment' });
      showSuccess('Time slot created!');
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateBulk(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (bulkForm.days.length === 0) { setFormError('Select at least one day'); return; }
    setCreating(true);
    try {
      const dates: string[] = [];
      const cur = new Date(bulkForm.startDate + 'T00:00:00');
      const end = new Date(bulkForm.endDate + 'T00:00:00');
      while (cur <= end) {
        if (bulkForm.days.includes(cur.getDay())) {
          dates.push(cur.toISOString().split('T')[0]);
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (dates.length === 0) {
        setFormError('No dates match the selected days in that range');
        return;
      }

      const results = await Promise.all(
        dates.map((date) =>
          fetch('/api/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, startTime: bulkForm.startTime, endTime: bulkForm.endTime, title: bulkForm.title }),
          }).then((r) => r.json())
        )
      );

      const newSlots = results.filter((r) => r.slot).map((r) => r.slot);
      setSlots((prev) => [...prev, ...newSlots].sort((a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      ));
      setShowForm(false);
      setBulkForm({ startDate: '', endDate: '', startTime: '09:00', endTime: '09:30', title: 'Appointment', days: [1, 2, 3, 4, 5] });
      showSuccess(`${newSlots.length} time slot${newSlots.length !== 1 ? 's' : ''} created!`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteSlot(slotId: number) {
    if (!confirm('Delete this slot? Any existing booking will also be removed.')) return;
    const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE' });
    if (res.ok) {
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      showSuccess('Slot deleted');
    }
  }

  async function handleCancelBooking(bookingId: number) {
    if (!confirm('Cancel this booking? The slot will become available again.')) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    if (res.ok) {
      setSlots((prev) =>
        prev.map((s) =>
          s.booking?.id === bookingId
            ? { ...s, booking: s.booking ? { ...s.booking, status: 'CANCELLED' } : null }
            : s
        )
      );
      showSuccess('Booking cancelled');
    }
  }

  function toggleBulkDay(day: number) {
    setBulkForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl" />
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const grouped = groupByDate(slots);
  const confirmedBookings = slots.filter((s) => s.booking?.status === 'CONFIRMED');
  const totalAvailable = slots.filter((s) => !s.booking || s.booking.status === 'CANCELLED').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = confirmedBookings.filter((s) => s.date === todayStr).length;
  const allBookings = slots
    .filter((s) => s.booking)
    .map((s) => s.booking!)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={user?.name || 'Admin'} userRole="ADMIN" />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2.5">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage appointment slots and view all bookings</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm shadow-indigo-100 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Slot
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Slots', value: slots.length, color: 'text-gray-900', bg: 'bg-white', icon: '📅' },
            { label: 'Confirmed', value: confirmedBookings.length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '✅' },
            { label: 'Available', value: totalAvailable, color: 'text-green-600', bg: 'bg-green-50', icon: '🟢' },
            { label: "Today's Bookings", value: todayBookings, color: 'text-orange-600', bg: 'bg-orange-50', icon: '📋' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100 shadow-sm`}>
              <p className="text-xs text-gray-500 mb-1">{stat.icon} {stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Create Slot Panel */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Create Time Slots</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['single', 'bulk'] as CreateMode[]).map((mode) => (
                  <button key={mode} onClick={() => { setCreateMode(mode); setFormError(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      createMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {mode === 'single' ? 'Single slot' : 'Bulk (week)'}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                {formError}
              </div>
            )}

            {/* Single slot form */}
            {createMode === 'single' && (
              <form onSubmit={handleCreateSingle} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={singleForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={singleForm.title}
                    onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                    required placeholder="e.g. Consultation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={singleForm.startTime}
                    onChange={(e) => setSingleForm({ ...singleForm, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={singleForm.endTime}
                    onChange={(e) => setSingleForm({ ...singleForm, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2 flex gap-3 justify-end pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                    {creating ? 'Creating...' : 'Create Slot'}
                  </button>
                </div>
              </form>
            )}

            {/* Bulk form */}
            {createMode === 'bulk' && (
              <form onSubmit={handleCreateBulk} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={bulkForm.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBulkForm({ ...bulkForm, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={bulkForm.endDate}
                      min={bulkForm.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBulkForm({ ...bulkForm, endDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={bulkForm.startTime}
                      onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" value={bulkForm.endTime}
                      onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" value={bulkForm.title}
                      onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                      required placeholder="e.g. Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, i) => (
                      <button key={day} type="button" onClick={() => toggleBulkDay(i)}
                        className={`w-12 h-9 rounded-lg text-xs font-semibold border transition-all ${
                          bulkForm.days.includes(i)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                    {creating ? 'Creating...' : 'Create All Slots'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
          {([
            { id: 'slots', label: `Slots (${slots.length})` },
            { id: 'bookings', label: `Bookings (${confirmedBookings.length})` },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── SLOTS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'slots' && (
          Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">No time slots yet</p>
              <p className="text-gray-400 text-sm mt-1">Click &quot;New Slot&quot; to create your first one</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, daySlots]) => (
                <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">{formatDate(date)}</span>
                    <span className="text-xs text-gray-400">
                      · {daySlots.filter(s => s.booking?.status === 'CONFIRMED').length}/{daySlots.length} booked
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{date}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {daySlots.map((slot) => {
                      const isBooked = slot.booking?.status === 'CONFIRMED';
                      return (
                        <div key={slot.id} className="px-5 py-3.5 flex items-center gap-4">
                          <div className="text-sm font-mono text-gray-500 w-28 flex-shrink-0">
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{slot.title}</p>
                            {isBooked && slot.booking && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                <span className="font-medium text-indigo-600">{slot.booking.user.name}</span>
                                {' '}· {slot.booking.user.email}
                                {slot.booking.notes && (
                                  <span className="italic"> · &quot;{slot.booking.notes}&quot;</span>
                                )}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                            isBooked ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {isBooked ? 'Booked' : 'Available'}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            {isBooked && slot.booking && (
                              <button onClick={() => handleCancelBooking(slot.booking!.id)}
                                className="text-xs text-orange-600 hover:text-orange-700 px-2.5 py-1.5 rounded-lg hover:bg-orange-50 font-medium transition-colors">
                                Cancel booking
                              </button>
                            )}
                            <button onClick={() => handleDeleteSlot(slot.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-medium transition-colors">
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── BOOKINGS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          allBookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold">No bookings yet</p>
              <p className="text-gray-400 text-sm mt-1">Bookings will appear here once users start booking slots</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">All Bookings</p>
                <p className="text-xs text-gray-400">{allBookings.length} total</p>
              </div>
              <div className="divide-y divide-gray-50">
                {allBookings.map((booking) => {
                  const slot = slots.find((s) => s.booking?.id === booking.id);
                  return (
                    <div key={booking.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-semibold text-sm">
                          {booking.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{booking.user.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {booking.user.email}
                          {booking.notes && <span className="italic"> · &quot;{booking.notes}&quot;</span>}
                        </p>
                      </div>
                      {slot && (
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-xs font-medium text-gray-700">{slot.title}</p>
                          <p className="text-xs text-gray-400">{formatDate(slot.date)} · {slot.startTime}–{slot.endTime}</p>
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                      </span>
                      <p className="text-xs text-gray-400 flex-shrink-0 hidden lg:block">
                        {formatDateTime(booking.createdAt)}
                      </p>
                      {booking.status === 'CONFIRMED' && (
                        <button onClick={() => handleCancelBooking(booking.id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 font-medium flex-shrink-0 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

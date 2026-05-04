'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';

interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  booking: { id: number; status: string; userId: number } | null;
}

interface Booking {
  id: number;
  status: string;
  notes: string | null;
  createdAt: string;
  slot: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
  };
}

interface User {
  userId: number;
  name: string;
  role: string;
}

function groupByDate(slots: Slot[]) {
  return slots.reduce((acc: Record<string, Slot[]>, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Skeleton loader for slot cards
function SlotSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-50">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-7 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'mybookings'>('browse');
  const [dateFilter, setDateFilter] = useState<string>(''); // '' = all dates

  // Booking modal state
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/slots').then((r) => r.json()),
      fetch('/api/bookings').then((r) => r.json()),
    ]).then(([meData, slotsData, bookingsData]) => {
      setUser(meData.user);
      setSlots(slotsData.slots || []);
      setMyBookings(bookingsData.bookings || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/slots').then((r) => r.json()).then((d) => setSlots(d.slots || []));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleBook() {
    if (!selectedSlot) return;
    setBookingError('');
    setBooking(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot.id, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setBookingError(data.error || 'Booking failed'); return; }
      setSlots((prev) =>
        prev.map((s) =>
          s.id === selectedSlot.id
            ? { ...s, booking: { id: data.booking.id, status: 'CONFIRMED', userId: data.booking.userId ?? user?.userId ?? 0 } }
            : s
        )
      );
      setMyBookings((prev) => [data.booking, ...prev]);
      setSelectedSlot(null);
      setNotes('');
      showSuccess('Appointment booked!');
    } finally {
      setBooking(false);
    }
  }

  async function handleCancel(bookingId: number) {
    if (!confirm('Cancel this booking?')) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    if (res.ok) {
      setMyBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)));
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

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];

  const availableSlots = useMemo(() => {
    return slots.filter(
      (s) =>
        s.date >= today &&
        (!s.booking || s.booking.status === 'CANCELLED' || s.booking.userId === user?.userId)
    );
  }, [slots, today, user?.userId]);

  const filteredSlots = useMemo(() => {
    if (!dateFilter) return availableSlots;
    return availableSlots.filter((s) => s.date === dateFilter);
  }, [availableSlots, dateFilter]);

  // Unique dates with available slots (for the date filter dropdown)
  const availableDates = useMemo(() => {
    return [...new Set(availableSlots.map((s) => s.date))].sort();
  }, [availableSlots]);

  const grouped = groupByDate(filteredSlots);
  const confirmedBookings = myBookings.filter((b) => b.status === 'CONFIRMED');
  const cancelledBookings = myBookings.filter((b) => b.status === 'CANCELLED');

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl" />
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse mb-4" />
          <SlotSkeleton />
          <SlotSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={user?.name || 'User'} userRole="USER" />

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm Booking</h2>
              <p className="text-gray-500 text-sm mb-5">Review your appointment details below</p>

              <div className="bg-indigo-50 rounded-xl p-4 mb-5 border border-indigo-100">
                <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Appointment</p>
                <p className="text-lg font-bold text-gray-900">{selectedSlot.title}</p>
                <p className="text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(selectedSlot.date)}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or information..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
                  {bookingError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setSelectedSlot(null); setBookingError(''); setNotes(''); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleBook} disabled={booking}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {booking ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Booking...
                    </>
                  ) : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Hey, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Browse available slots or manage your bookings</p>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl z-50 text-sm font-medium flex items-center gap-2.5 max-w-sm">
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'browse', label: `Browse Slots` },
            { id: 'mybookings', label: `My Bookings${confirmedBookings.length > 0 ? ` (${confirmedBookings.length})` : ''}` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as 'browse' | 'mybookings')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── BROWSE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'browse' && (
          <>
            {/* Date filter */}
            {availableDates.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <label className="text-sm font-medium text-gray-600 flex-shrink-0">Filter by date:</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setDateFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      !dateFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    All dates
                  </button>
                  {availableDates.slice(0, 6).map((date) => (
                    <button key={date} onClick={() => setDateFilter(date)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        dateFilter === date ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}>
                      {formatDate(date)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold">
                  {dateFilter ? 'No slots on this date' : 'No available slots'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {dateFilter ? (
                    <button onClick={() => setDateFilter('')} className="text-indigo-600 font-medium">
                      Clear filter to see all dates
                    </button>
                  ) : 'Check back later or contact the admin'}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(grouped).map(([date, daySlots]) => (
                  <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">{formatDate(date)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {daySlots.map((slot) => {
                        const isMyBooking = slot.booking?.status === 'CONFIRMED' && slot.booking?.userId === user?.userId;
                        const isTaken = slot.booking?.status === 'CONFIRMED' && slot.booking?.userId !== user?.userId;
                        return (
                          <div key={slot.id} className="px-5 py-4 flex items-center gap-4">
                            <div className="text-sm font-mono text-gray-500 w-28 flex-shrink-0">
                              {slot.startTime} – {slot.endTime}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{slot.title}</p>
                              {isMyBooking && (
                                <p className="text-xs text-indigo-600 mt-0.5 font-medium">✓ You have this booked</p>
                              )}
                            </div>
                            {isMyBooking ? (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium flex-shrink-0">
                                Your Booking
                              </span>
                            ) : isTaken ? (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 font-medium flex-shrink-0">
                                Taken
                              </span>
                            ) : (
                              <button
                                onClick={() => { setSelectedSlot(slot); setBookingError(''); }}
                                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold flex-shrink-0 shadow-sm shadow-indigo-100"
                              >
                                Book
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MY BOOKINGS TAB ────────────────────────────────────────────── */}
        {activeTab === 'mybookings' && (
          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-semibold">No bookings yet</p>
                <p className="text-gray-400 text-sm mt-1">Browse available slots to book your first appointment</p>
                <button onClick={() => setActiveTab('browse')}
                  className="mt-4 text-sm text-indigo-600 font-semibold hover:text-indigo-700">
                  Browse slots →
                </button>
              </div>
            ) : (
              <>
                {confirmedBookings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Upcoming</h3>
                    <div className="space-y-3">
                      {confirmedBookings.map((b) => (
                        <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{b.slot.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(b.slot.date)} · {b.slot.startTime} – {b.slot.endTime}
                            </p>
                            {b.notes && <p className="text-xs text-gray-400 mt-0.5 italic">&quot;{b.notes}&quot;</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">Confirmed</span>
                            <button onClick={() => handleCancel(b.id)}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 font-medium transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cancelledBookings.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Cancelled</h3>
                    <div className="space-y-2">
                      {cancelledBookings.map((b) => (
                        <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{b.slot.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(b.slot.date)} · {b.slot.startTime} – {b.slot.endTime}</p>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium flex-shrink-0">Cancelled</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

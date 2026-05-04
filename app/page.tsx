import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function LandingPage() {
  // If already logged in, skip the landing page
  const session = await getSession();
  if (session) {
    if (session.role === 'ADMIN') redirect('/admin');
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">BookEasy</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="pt-32 pb-24 px-6 text-center bg-gradient-to-b from-indigo-50/60 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Real-time availability — no double bookings
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              The smarter way to<br />
              <span className="text-indigo-600">manage appointments</span>
            </h1>

            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Give your clients an effortless booking experience. Create time slots, prevent double-bookings, and send automatic email confirmations — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-base"
              >
                Start for free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-700 border border-gray-200 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 text-base"
              >
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View demo
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Demo: <span className="font-mono">admin@demo.com / admin123</span> · <span className="font-mono">user@demo.com / user123</span>
            </p>
          </div>

          {/* Dashboard preview mockup */}
          <div className="max-w-5xl mx-auto mt-16 rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                bookeasy.app/dashboard
              </div>
            </div>
            <div className="bg-white p-6 grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Slots</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Booked</p>
                <p className="text-2xl font-bold text-indigo-600">18</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Available</p>
                <p className="text-2xl font-bold text-green-600">6</p>
              </div>
              <div className="col-span-3 border border-gray-100 rounded-xl overflow-hidden">
                {[
                  { time: '09:00 – 09:30', title: 'Consultation', name: 'Sarah M.', status: 'Booked' },
                  { time: '10:00 – 10:30', title: 'Follow-up', name: '—', status: 'Available' },
                  { time: '11:00 – 11:30', title: 'Consultation', name: 'James K.', status: 'Booked' },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center gap-4 px-4 py-3 text-sm ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                    <span className="font-mono text-gray-500 w-32 flex-shrink-0 text-xs">{row.time}</span>
                    <span className="flex-1 font-medium text-gray-800">{row.title}</span>
                    <span className="text-gray-400 text-xs">{row.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      row.status === 'Booked' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                    }`}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run bookings</h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">Built for service professionals who want to stop managing schedules manually.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  color: 'bg-indigo-50 text-indigo-600',
                  title: 'Role-based access',
                  desc: 'Admins manage slots and see all bookings. Users can only book and cancel their own appointments.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: 'bg-green-50 text-green-600',
                  title: 'Real-time availability',
                  desc: 'Slot availability updates live. Once a slot is booked, it disappears for other users instantly.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: 'bg-blue-50 text-blue-600',
                  title: 'Email confirmations',
                  desc: 'Automatic booking confirmation and cancellation emails sent to clients via Nodemailer.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  color: 'bg-purple-50 text-purple-600',
                  title: 'Double-booking prevention',
                  desc: 'Two-layer protection: app-level checks and a database unique constraint catch concurrent requests.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  ),
                  color: 'bg-orange-50 text-orange-600',
                  title: 'Bulk slot creation',
                  desc: 'Admins can create an entire week of slots in one go — pick date range, time, and days of the week.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  color: 'bg-rose-50 text-rose-600',
                  title: 'Admin analytics',
                  desc: 'At-a-glance stats: total slots, bookings today, weekly occupancy rate, and full bookings history.',
                },
              ].map((f) => (
                <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 text-lg mb-16">Three steps from zero to a fully operational booking system.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Create your account',
                  desc: 'Sign up as an Admin to manage your calendar, or as a User to start booking appointments.',
                },
                {
                  step: '02',
                  title: 'Set up your slots',
                  desc: 'Admins create time slots individually or in bulk. Set the date, time, and service title.',
                },
                {
                  step: '03',
                  title: 'Accept bookings',
                  desc: 'Users browse available slots, book in one click, and receive an automatic email confirmation.',
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-8 left-full w-full h-px border-t-2 border-dashed border-gray-200 z-0" style={{ width: 'calc(100% - 2rem)', left: '50%' }} />
                  )}
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100">
                      <span className="text-white font-bold text-lg">{item.step}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tech stack ───────────────────────────────────────────────── */}
        <section className="py-16 px-6 border-t border-gray-100">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Built with</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {['Next.js 15', 'TypeScript', 'Tailwind CSS v4', 'Prisma ORM', 'PostgreSQL', 'jose JWT', 'bcryptjs', 'Nodemailer'].map((tech) => (
                <span key={tech} className="text-sm text-gray-600 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-indigo-600 rounded-3xl p-12 shadow-2xl shadow-indigo-100">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-indigo-200 mb-8 text-lg">
                Create a free account and have your first booking in under 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 text-base shadow-lg"
                >
                  Create free account
                </Link>
                <Link
                  href="/auth/login"
                  className="text-indigo-200 border border-indigo-400 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-500 text-base"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm">BookEasy</span>
          </div>
          <p className="text-xs text-gray-400">Full-stack appointment booking system · Next.js + Prisma + PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}

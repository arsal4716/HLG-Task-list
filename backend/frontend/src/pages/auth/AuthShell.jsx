import { motion } from 'framer-motion';

/** Shared split-screen shell for auth pages. */
export const AuthShell = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen">
    <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 p-12 text-white lg:flex">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur">H</div>
        <span className="text-lg font-bold">HLG Tasks</span>
      </div>
      <div>
        <h1 className="text-4xl font-extrabold leading-tight">
          Where work gets
          <br /> done together.
        </h1>
        <p className="mt-4 max-w-md text-white/80">
          The HLG team's command center for planning, assigning and delivering work —
          with realtime collaboration, time tracking and performance insights in one place.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            ['Realtime', 'Live updates'],
            ['Kanban', 'Drag & drop'],
            ['Reports', 'CSV export'],
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-white/10 p-3">
              <p className="font-semibold">{a}</p>
              <p className="text-xs text-white/60">{b}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-white/50">© {new Date().getFullYear()} HLG Team. Internal use only.</p>
    </div>

    <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthShell;

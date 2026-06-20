import { Loader2, Store } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-8 sm:px-8 sm:py-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Store size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-100">
                  Aplikasi Catatan Kerja
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight">
                  Memuat halaman...
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200"
            >
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-violet-500" />

              <div className="mt-5 animate-pulse">
                <div className="flex items-start justify-between gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                  <div className="h-7 w-20 rounded-full bg-slate-100" />
                </div>

                <div className="mt-5 h-7 w-3/4 rounded-2xl bg-slate-100" />
                <div className="mt-3 h-4 w-full rounded-2xl bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-2xl bg-slate-100" />

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="h-20 rounded-2xl bg-slate-100" />
                  <div className="h-20 rounded-2xl bg-slate-100" />
                </div>

                <div className="mt-5 h-12 rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-slate-400/60">
            <Loader2 className="animate-spin" size={18} />
            Sedang memuat...
          </div>
        </div>
      </section>
    </main>
  );
}

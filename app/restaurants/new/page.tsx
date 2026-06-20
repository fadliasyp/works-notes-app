import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Save, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

export default async function NewPlacePage() {
  async function createPlace(formData: FormData) {
    "use server";

    const name = toNullableText(formData.get("name"));
    const address = toNullableText(formData.get("address"));
    const cityHighlight = toNullableText(formData.get("city_highlight"));

    if (!name) {
      throw new Error("Nama tempat wajib diisi.");
    }

    const { data, error } = await supabase
      .from("places")
      .insert({
        name,
        address,
        city_highlight: cityHighlight,
        last_changed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Gagal menambah tempat.");
    }

    redirect(`/restaurants/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar tempat
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-white/15">
                <Plus size={14} />
                Tambah Tempat
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tempat Baru
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Tambahkan restoran/tempat kerja baru untuk mulai mengelola
                produk dan maintenance.
              </p>
            </div>
          </div>
        </div>

        <form
          action={createPlace}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
        >
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-bold text-slate-800"
              >
                Nama Restoran / Tempat
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Contoh: Dyni Restaurant"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="text-sm font-bold text-slate-800"
              >
                Alamat
              </label>

              <div className="relative mt-2">
                <MapPin
                  className="pointer-events-none absolute left-4 top-4 text-slate-400"
                  size={18}
                />

                <textarea
                  id="address"
                  name="address"
                  rows={4}
                  placeholder="Contoh: Jl. Merdeka No. 10"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="city_highlight"
                className="text-sm font-bold text-slate-800"
              >
                Highlight Kota
              </label>
              <input
                id="city_highlight"
                name="city_highlight"
                type="text"
                placeholder="Contoh: Jakarta Selatan"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-3xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
              <div className="flex gap-3">
                <Store className="mt-0.5 shrink-0" size={20} />
                <p>
                  Setelah tempat dibuat, kamu bisa langsung menambahkan produk,
                  barang maintenance tetap, dan checklist maintenance bulanan.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Save size={18} />
                Simpan Tempat
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

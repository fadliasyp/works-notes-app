import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Save, Store, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
};

type MaintenanceAsset = {
  id: string;
  name: string;
};

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

export default async function NewMaintenancePage({ params }: PageProps) {
  const { id } = await params;

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("id, name, address, city_highlight")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const { data: assetsData } = await supabase
    .from("maintenance_assets")
    .select("id, name")
    .eq("place_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const place = placeData as Place;
  const assets = (assetsData || []) as MaintenanceAsset[];

  async function createMaintenance(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();

    if (!placeId) {
      throw new Error("ID tempat tidak ditemukan.");
    }

    const title =
      toNullableText(formData.get("title")) || "Maintenance Bulanan";
    const maintenanceDate = toNullableText(formData.get("maintenance_date"));
    const note = toNullableText(formData.get("note"));

    if (!maintenanceDate) {
      throw new Error("Tanggal maintenance wajib diisi.");
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("maintenance_sessions")
      .insert({
        place_id: placeId,
        title,
        maintenance_date: maintenanceDate,
        note,
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      throw new Error(sessionError?.message || "Gagal membuat maintenance.");
    }

    const { data: assetList, error: assetError } = await supabase
      .from("maintenance_assets")
      .select("id")
      .eq("place_id", placeId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (assetError) {
      throw new Error(assetError.message);
    }

    const checksToInsert =
      assetList?.map((asset) => ({
        maintenance_session_id: sessionData.id,
        maintenance_asset_id: asset.id,
        is_checked: false,
      })) || [];

    if (checksToInsert.length > 0) {
      const { error: checksError } = await supabase
        .from("maintenance_checks")
        .insert(checksToInsert);

      if (checksError) {
        throw new Error(checksError.message);
      }
    }

    await supabase
      .from("places")
      .update({
        last_changed_at: new Date().toISOString(),
      })
      .eq("id", placeId);

    redirect(`/restaurants/${placeId}?tab=maintenance`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link
          href={`/restaurants/${place.id}?tab=maintenance`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke maintenance
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-white/15">
                <Wrench size={14} />
                Tambah Maintenance
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Maintenance Baru
              </h1>

              <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Store size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">Tempat</p>
                    <p className="font-bold text-white">{place.name}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {place.city_highlight || "Kota belum diisi"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          action={createMaintenance}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />

          <div className="grid gap-5">
            <div>
              <label
                htmlFor="title"
                className="text-sm font-bold text-slate-800"
              >
                Judul Maintenance
              </label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue="Maintenance Bulanan"
                placeholder="Contoh: Maintenance Bulanan"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="maintenance_date"
                className="text-sm font-bold text-slate-800"
              >
                Tanggal Maintenance
              </label>

              <div className="relative mt-2">
                <CalendarDays
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="maintenance_date"
                  name="maintenance_date"
                  type="date"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <h2 className="text-sm font-bold text-emerald-900">
                Barang checklist otomatis
              </h2>

              {assets.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-emerald-100"
                    >
                      {asset.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Belum ada barang maintenance tetap untuk tempat ini. Setelah
                  ini kita buat halaman kelola barang maintenance agar kamu bisa
                  tambah barang dan fotonya.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="note"
                className="text-sm font-bold text-slate-800"
              >
                Catatan Bulanan
              </label>
              <textarea
                id="note"
                name="note"
                rows={5}
                placeholder="Contoh: Bulan ini mesin kopi normal, kulkas perlu dicek ulang bulan depan..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}?tab=maintenance`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Save size={18} />
                Buat Maintenance
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Save,
  Store,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubmitButton } from "@/components/SubmitButton";

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
  description: string | null;
  sort_order: number | null;
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

  const { data: assetsData, error: assetsError } = await supabase
    .from("maintenance_assets")
    .select("id, name, description, sort_order")
    .eq("place_id", id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (assetsError) {
    throw new Error(assetsError.message);
  }

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <Link
          href={`/restaurants/${place.id}?tab=maintenance`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke maintenance
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-emerald-100 shadow-inner ring-1 ring-white/15">
                <Wrench size={15} />
                Tambah Maintenance
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Maintenance Baru
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Buat jadwal maintenance bulanan. Barang checklist akan otomatis
                diambil dari daftar barang maintenance tetap.
              </p>

              <div className="mt-6 rounded-[1.8rem] bg-white/10 p-5 ring-1 ring-white/15">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Store size={26} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">Tempat</p>
                    <p className="text-2xl font-black text-white">
                      {place.name}
                    </p>
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
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />

          <div className="grid gap-6">
            <div className="rounded-[1.8rem] bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <ClipboardList size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Data Maintenance
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Isi tanggal dan catatan bulanan. Checklist barang dibuat
                    otomatis.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="title"
                className="text-sm font-black text-slate-800"
              >
                Judul Maintenance
              </label>

              <input
                id="title"
                name="title"
                type="text"
                defaultValue="Maintenance Bulanan"
                placeholder="Contoh: Maintenance Bulanan"
                className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="maintenance_date"
                className="text-sm font-black text-slate-800"
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
                  className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 pl-11 text-base font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-emerald-50 p-4 ring-1 ring-emerald-100 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <CheckCircle2 size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-emerald-950">
                    Barang Checklist Otomatis
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Saat maintenance disimpan, semua barang di bawah ini akan
                    masuk ke daftar checklist.
                  </p>
                </div>
              </div>

              {assets.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-emerald-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                          <Wrench size={18} />
                        </div>

                        <div>
                          <p className="font-black text-slate-950">
                            {asset.name}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {asset.description || "Tidak ada deskripsi barang."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.35rem] bg-white p-4 text-sm leading-6 text-emerald-800 ring-1 ring-emerald-100">
                  Belum ada barang maintenance tetap untuk tempat ini. Tambahkan
                  dulu melalui halaman <b>Kelola Barang</b>.
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="note"
                className="text-sm font-black text-slate-800"
              >
                Catatan Bulanan
              </label>

              <textarea
                id="note"
                name="note"
                rows={5}
                placeholder="Contoh: Bulan ini mesin kopi normal, kulkas perlu dicek ulang bulan depan..."
                className="mt-2 w-full resize-none rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="rounded-[1.6rem] bg-blue-50 p-4 text-sm leading-7 text-blue-800 ring-1 ring-blue-100">
              <b>Catatan:</b> checklist barang bisa diceklis setelah maintenance
              berhasil dibuat.
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}?tab=maintenance`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <SubmitButton
                pendingText="Menyimpan maintenance..."
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <Save size={18} />
                Buat Maintenance
              </SubmitButton>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

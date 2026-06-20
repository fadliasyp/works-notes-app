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
    maintenanceId: string;
  }>;
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
};

type MaintenanceSession = {
  id: string;
  place_id: string;
  title: string | null;
  maintenance_date: string | null;
  note: string | null;
};

type MaintenanceAssetMini = {
  name: string | null;
  description: string | null;
};

type MaintenanceCheck = {
  id: string;
  is_checked: boolean | null;
  checked_at: string | null;
  maintenance_assets: MaintenanceAssetMini[] | MaintenanceAssetMini | null;
};

function getMaintenanceAsset(check: MaintenanceCheck) {
  if (!check.maintenance_assets) return null;

  if (Array.isArray(check.maintenance_assets)) {
    return check.maintenance_assets[0] || null;
  }

  return check.maintenance_assets;
}

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Belum diisi";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

export default async function EditMaintenancePage({ params }: PageProps) {
  const { id, maintenanceId } = await params;

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("id, name, address, city_highlight")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const { data: maintenanceData, error: maintenanceError } = await supabase
    .from("maintenance_sessions")
    .select("id, place_id, title, maintenance_date, note")
    .eq("id", maintenanceId)
    .eq("place_id", id)
    .maybeSingle();

  if (maintenanceError || !maintenanceData) {
    notFound();
  }

  const { data: checksData, error: checksError } = await supabase
    .from("maintenance_checks")
    .select(
      `
      id,
      is_checked,
      checked_at,
      maintenance_assets (
        name,
        description
      )
    `,
    )
    .eq("maintenance_session_id", maintenanceId);

  if (checksError) {
    throw new Error(checksError.message);
  }

  const place = placeData as Place;
  const maintenance = maintenanceData as MaintenanceSession;
  const checks = (checksData || []) as unknown as MaintenanceCheck[];

  const checkedCount = checks.filter((check) => check.is_checked).length;
  const totalChecks = checks.length;

  async function updateMaintenance(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const currentMaintenanceId = formData.get("maintenance_id")?.toString();

    if (!placeId || !currentMaintenanceId) {
      throw new Error("ID tempat atau ID maintenance tidak ditemukan.");
    }

    const title =
      toNullableText(formData.get("title")) || "Maintenance Bulanan";
    const maintenanceDate = toNullableText(formData.get("maintenance_date"));
    const note = toNullableText(formData.get("note"));

    if (!maintenanceDate) {
      throw new Error("Tanggal maintenance wajib diisi.");
    }

    const { error } = await supabase
      .from("maintenance_sessions")
      .update({
        title,
        maintenance_date: maintenanceDate,
        note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentMaintenanceId)
      .eq("place_id", placeId);

    if (error) {
      throw new Error(error.message);
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
                Edit Maintenance
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {maintenance.title || "Maintenance Bulanan"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Perbarui judul, tanggal, dan catatan bulanan untuk maintenance
                ini.
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
          action={updateMaintenance}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />
          <input type="hidden" name="maintenance_id" value={maintenance.id} />

          <div className="grid gap-6">
            <div className="rounded-[1.8rem] bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <ClipboardList size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Ringkasan Checklist
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Barang diceklis:{" "}
                    <span className="font-black text-emerald-700">
                      {checkedCount}
                    </span>{" "}
                    dari{" "}
                    <span className="font-black text-slate-950">
                      {totalChecks}
                    </span>{" "}
                    barang.
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
                defaultValue={maintenance.title || "Maintenance Bulanan"}
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
                  defaultValue={maintenance.maintenance_date || ""}
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
                    Status Barang
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Checklist barang tetap diubah dari halaman detail
                    maintenance, bukan dari halaman edit catatan.
                  </p>
                </div>
              </div>

              {checks.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {checks.map((check) => {
                    const asset = getMaintenanceAsset(check);

                    return (
                      <div
                        key={check.id}
                        className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-emerald-100"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                              check.is_checked
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                : "bg-slate-50 text-slate-400 ring-slate-200"
                            }`}
                          >
                            {check.is_checked ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Wrench size={18} />
                            )}
                          </div>

                          <div>
                            <p className="font-black text-slate-950">
                              {asset?.name || "Barang maintenance"}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {check.is_checked
                                ? `Sudah diceklis${
                                    check.checked_at
                                      ? ` pada ${formatDate(check.checked_at)}`
                                      : ""
                                  }`
                                : "Belum diceklis"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.35rem] bg-white p-4 text-sm leading-6 text-emerald-800 ring-1 ring-emerald-100">
                  Belum ada checklist barang pada maintenance ini.
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
                defaultValue={maintenance.note || ""}
                placeholder="Contoh: Bulan ini mesin kopi normal, kulkas perlu dicek ulang bulan depan..."
                className="mt-2 w-full resize-none rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="rounded-[1.6rem] bg-blue-50 p-4 text-sm leading-7 text-blue-800 ring-1 ring-blue-100">
              <b>Catatan:</b> perubahan ini hanya mengubah data maintenance
              bulanan, bukan daftar barang tetap.
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}?tab=maintenance`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <SubmitButton
                pendingText="Menyimpan perubahan..."
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <Save size={18} />
                Simpan Perubahan
              </SubmitButton>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

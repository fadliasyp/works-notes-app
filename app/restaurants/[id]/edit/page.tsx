import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Pencil,
  Save,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubmitButton } from "@/components/SubmitButton";
import { withToast } from "@/lib/toast";

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

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

export default async function EditPlacePage({ params }: PageProps) {
  const { id } = await params;

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("id, name, address, city_highlight")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const place = placeData as Place;

  async function updatePlace(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();

    if (!placeId) {
      throw new Error("ID tempat tidak ditemukan.");
    }

    const name = toNullableText(formData.get("name"));
    const address = toNullableText(formData.get("address"));
    const cityHighlight = toNullableText(formData.get("city_highlight"));

    if (!name) {
      throw new Error("Nama tempat wajib diisi.");
    }

    const { error } = await supabase
      .from("places")
      .update({
        name,
        address,
        city_highlight: cityHighlight,
        last_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeId);

    if (error) {
      throw new Error(error.message);
    }

    redirect(
      withToast(
        `/restaurants/${place.id}`,
        "success",
        "Tempat berhasil diperbarui.",
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <Link
          href={`/restaurants/${place.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke detail tempat
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 shadow-inner ring-1 ring-white/15">
                <Pencil size={15} />
                Edit Tempat
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {place.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Perbarui nama restoran, alamat, dan highlight kota agar data
                tempat tetap rapi dan mudah ditemukan.
              </p>

              <div className="mt-6 rounded-[1.8rem] bg-white/10 p-5 ring-1 ring-white/15">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Store size={26} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">Data saat ini</p>
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
          action={updatePlace}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />

          <div className="grid gap-6">
            <div className="rounded-[1.8rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Building2 size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Informasi Tempat
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Edit data utama tempat yang tampil di halaman daftar tempat.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="text-sm font-black text-slate-800"
              >
                Nama Restoran / Tempat
              </label>

              <div className="relative mt-2">
                <Building2
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={place.name}
                  placeholder="Contoh: Dyni Restaurant"
                  className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 pl-11 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="text-sm font-black text-slate-800"
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
                  defaultValue={place.address || ""}
                  placeholder="Contoh: Jl. Merdeka No. 10"
                  className="w-full resize-none rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 pl-11 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="city_highlight"
                className="text-sm font-black text-slate-800"
              >
                Highlight Kota
              </label>

              <input
                id="city_highlight"
                name="city_highlight"
                type="text"
                defaultValue={place.city_highlight || ""}
                placeholder="Contoh: Jakarta Selatan"
                className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-[1.6rem] bg-emerald-50 p-4 text-sm leading-7 text-emerald-800 ring-1 ring-emerald-100">
              <b>Catatan:</b> setelah disimpan, tanggal terakhir diubah akan
              otomatis diperbarui.
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <SubmitButton
                pendingText="Menyimpan perubahan..."
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
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

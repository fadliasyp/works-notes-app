import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, MapPin, Plus, Search, Store, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
  last_changed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Belum ada perubahan";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().trim();
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQuery = resolvedSearchParams.q?.trim() || "";

  async function deletePlace(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();

    if (!placeId) {
      throw new Error("ID tempat tidak ditemukan.");
    }

    const { data: productImages } = await supabase
      .from("products")
      .select("image_path")
      .eq("place_id", placeId);

    const productImagePaths =
      productImages
        ?.map((item) => item.image_path)
        .filter((path): path is string => Boolean(path)) || [];

    if (productImagePaths.length > 0) {
      await supabase.storage.from("product-images").remove(productImagePaths);
    }

    const { data: maintenanceImages } = await supabase
      .from("maintenance_assets")
      .select("image_path")
      .eq("place_id", placeId);

    const maintenanceImagePaths =
      maintenanceImages
        ?.map((item) => item.image_path)
        .filter((path): path is string => Boolean(path)) || [];

    if (maintenanceImagePaths.length > 0) {
      await supabase.storage
        .from("maintenance-images")
        .remove(maintenanceImagePaths);
    }

    const { error } = await supabase.from("places").delete().eq("id", placeId);

    if (error) {
      throw new Error(error.message);
    }

    redirect("/");
  }

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("name", { ascending: true });

  const allPlaces = (data || []) as Place[];

  const places = searchQuery
    ? allPlaces.filter((place) => {
        const keyword = normalizeText(searchQuery);

        return (
          normalizeText(place.name).includes(keyword) ||
          normalizeText(place.address).includes(keyword) ||
          normalizeText(place.city_highlight).includes(keyword)
        );
      })
    : allPlaces;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Gagal mengambil data tempat
          </h1>

          <p className="mt-2 text-sm text-slate-600">{error.message}</p>

          <p className="mt-4 text-sm text-slate-500">
            Cek kembali tabel <b>places</b>, file <b>.env.local</b>, dan status
            RLS di Supabase.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-white/15">
                  <Store size={14} />
                  Aplikasi Catatan Kerja
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Daftar Tempat
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Kelola produk, quantity, volume, masa berlaku, dan jadwal
                  maintenance dari setiap restoran/tempat kerja.
                </p>
              </div>

              <Link
                href="/restaurants/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-blue-50"
              >
                <Plus size={18} />
                Tambah Tempat
              </Link>
            </div>
          </div>
        </div>

        <form
          action="/"
          method="get"
          className="mt-5 rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-200 backdrop-blur sm:p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
              <Search className="text-slate-400" size={20} />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari nama restoran, alamat, atau kota..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Cari
              </button>

              {searchQuery ? (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  <X size={16} />
                  Reset
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-400"
                >
                  <X size={16} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <p className="mt-3 text-sm text-slate-600">
              Hasil pencarian untuk:{" "}
              <span className="font-bold text-slate-900">"{searchQuery}"</span>
            </p>
          )}
        </form>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-600">
            Menampilkan{" "}
            <span className="font-bold text-slate-950">{places.length}</span>{" "}
            dari{" "}
            <span className="font-bold text-slate-950">{allPlaces.length}</span>{" "}
            tempat
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <div
              key={place.id}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/restaurants/${place.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Store size={22} />
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-950 hover:text-blue-700">
                  {place.name}
                </h2>

                <div className="mt-3 space-y-2">
                  <p className="flex gap-2 text-sm leading-5 text-slate-600">
                    <MapPin
                      className="mt-0.5 shrink-0 text-slate-400"
                      size={16}
                    />
                    <span>{place.address || "Alamat belum diisi"}</span>
                  </p>

                  <p className="text-sm font-medium text-blue-700">
                    {place.city_highlight || "Kota belum diisi"}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <Clock3 size={15} />
                  <span>
                    Terakhir diubah: {formatDate(place.last_changed_at)}
                  </span>
                </div>
              </Link>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href={`/restaurants/${place.id}/edit`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Edit
                </Link>

                <form action={deletePlace}>
                  <input type="hidden" name="place_id" value={place.id} />

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {allPlaces.length === 0 && (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Store size={26} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Belum ada tempat
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Tambahkan restoran/tempat pertama untuk mulai mencatat produk dan
              maintenance.
            </p>
          </div>
        )}

        {allPlaces.length > 0 && places.length === 0 && (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Search size={26} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Tidak ada hasil
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Tidak ada tempat yang cocok dengan pencarian "{searchQuery}".
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Reset Pencarian
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

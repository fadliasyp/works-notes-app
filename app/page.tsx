import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock3,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Store,
  Trash2,
  X,
} from "lucide-react";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
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

  const latestChangedPlace = [...allPlaces].sort((a, b) => {
    const dateA = new Date(a.last_changed_at || a.updated_at || 0).getTime();
    const dateB = new Date(b.last_changed_at || b.updated_at || 0).getTime();

    return dateB - dateA;
  })[0];

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 shadow-inner ring-1 ring-white/15">
                  <Store size={15} />
                  Aplikasi Catatan Kerja
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Daftar Tempat
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total Tempat
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {allPlaces.length}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Update Terakhir
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-white">
                      {latestChangedPlace
                        ? formatDate(latestChangedPlace.last_changed_at)
                        : "Belum ada"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-4 text-slate-950 shadow-xl shadow-black/10">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 ring-1 ring-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Sparkles size={24} />
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    Tambah tempat baru
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Buat restoran/tempat baru, lalu tambahkan produk dan
                    maintenance di dalamnya.
                  </p>

                  <Link
                    href="/restaurants/new"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    <Plus size={19} />
                    Tambah Tempat
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          action="/"
          method="get"
          className="mt-5 rounded-[2rem] bg-white/90 p-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 backdrop-blur sm:p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-[1.35rem] bg-slate-100 px-4 py-4 ring-1 ring-slate-200">
              <Search className="shrink-0 text-slate-400" size={21} />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Cari nama restoran, alamat, atau kota..."
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <button
                type="submit"
                className="rounded-[1.35rem] bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Cari
              </button>

              {searchQuery ? (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-slate-100 px-7 py-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                >
                  <X size={17} />
                  Reset
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-[1.35rem] bg-slate-100 px-7 py-4 text-sm font-black text-slate-400 ring-1 ring-slate-200"
                >
                  <X size={17} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800 ring-1 ring-blue-100">
              Hasil pencarian untuk{" "}
              <span className="font-black">"{searchQuery}"</span>
            </div>
          )}
        </form>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Menampilkan{" "}
            <span className="font-black text-slate-950">{places.length}</span>{" "}
            dari{" "}
            <span className="font-black text-slate-950">
              {allPlaces.length}
            </span>{" "}
            tempat
          </p>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            <Building2 size={15} />
            Data tersinkron dengan Supabase
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place, index) => {
            const initials = getInitials(place.name);
            const accentStyles = [
              "from-blue-500 to-cyan-400 bg-blue-50 text-blue-700",
              "from-emerald-500 to-teal-400 bg-emerald-50 text-emerald-700",
              "from-violet-500 to-fuchsia-400 bg-violet-50 text-violet-700",
              "from-orange-500 to-amber-400 bg-orange-50 text-orange-700",
            ];

            const accent = accentStyles[index % accentStyles.length];

            return (
              <article
                key={place.id}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/70"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-400 to-violet-500" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black text-white shadow-lg ${accent
                        .split(" ")
                        .slice(0, 2)
                        .join(" ")}`}
                    >
                      {initials || <Store size={24} />}
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                      Aktif
                    </span>
                  </div>

                  <div className="mt-5">
                    <h2 className="line-clamp-2 text-2xl font-black tracking-tight text-slate-950">
                      {place.name}
                    </h2>

                    <div className="mt-4 space-y-3">
                      <p className="flex gap-3 text-sm leading-6 text-slate-600">
                        <MapPin
                          className="mt-0.5 shrink-0 text-slate-400"
                          size={18}
                        />
                        <span>{place.address || "Alamat belum diisi"}</span>
                      </p>

                      <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                        {place.city_highlight || "Kota belum diisi"}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        <Clock3 size={15} />
                        Terakhir diubah
                      </div>

                      <p className="mt-1 text-sm font-black text-slate-700">
                        {formatDate(place.last_changed_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href={`/restaurants/${place.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Buka Detail
                      <ArrowRight size={17} />
                    </Link>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/restaurants/${place.id}/edit`}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                      >
                        Edit
                      </Link>

                      <form action={deletePlace}>
                        <input type="hidden" name="place_id" value={place.id} />

                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                          Hapus
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {allPlaces.length === 0 && (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Store size={30} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Belum ada tempat
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Tambahkan restoran/tempat pertama untuk mulai mencatat produk dan
              maintenance.
            </p>

            <Link
              href="/restaurants/new"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Plus size={18} />
              Tambah Tempat
            </Link>
          </div>
        )}

        {allPlaces.length > 0 && places.length === 0 && (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Search size={30} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Tidak ada hasil
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Tidak ada tempat yang cocok dengan pencarian{" "}
              <span className="font-black text-slate-900">"{searchQuery}"</span>
              .
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Reset Pencarian
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

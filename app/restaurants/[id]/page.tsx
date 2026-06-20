import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  MapPin,
  Package,
  Settings,
  Store,
  Trash2,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
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

type Product = {
  id: string;
  place_id: string;
  name: string;
  image_path: string | null;
  quantity: number | null;
  volume_value: number | null;
  volume_unit: string | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MaintenanceAsset = {
  id: string;
  place_id: string;
  name: string;
  description: string | null;
  image_path: string | null;
  sort_order: number | null;
};

type MaintenanceCheck = {
  id: string;
  maintenance_session_id: string;
  maintenance_asset_id: string;
  is_checked: boolean | null;
  checked_at: string | null;
  maintenance_assets: MaintenanceAsset | null;
};

type MaintenanceSession = {
  id: string;
  place_id: string;
  maintenance_date: string | null;
  title: string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
  maintenance_checks: MaintenanceCheck[];
};

function formatDate(dateValue: string | null) {
  if (!dateValue) return "Belum diisi";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getDaysLeft(dateValue: string | null) {
  if (!dateValue) return null;

  const today = new Date();
  const targetDate = new Date(dateValue);

  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diff = targetDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getExpiryBadge(expiresAt: string | null) {
  const daysLeft = getDaysLeft(expiresAt);

  if (daysLeft === null) {
    return {
      label: "Belum diisi",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }

  if (daysLeft < 0) {
    return {
      label: "Expired",
      className: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} hari lagi`,
      className: "bg-red-50 text-red-700 ring-red-100",
    };
  }

  if (daysLeft <= 10) {
    return {
      label: `${daysLeft} hari lagi`,
      className: "bg-orange-50 text-orange-700 ring-orange-100",
    };
  }

  return {
    label: `${daysLeft} hari lagi`,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
}

function getProductImageUrl(imagePath: string | null) {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

function getMaintenanceImageUrl(imagePath: string | null) {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from("maintenance-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const activeTab =
    resolvedSearchParams.tab === "maintenance" ? "maintenance" : "products";

  async function deleteProduct(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const productId = formData.get("product_id")?.toString();
    const imagePath = formData.get("image_path")?.toString();

    if (!placeId || !productId) {
      throw new Error("ID tempat atau ID produk tidak ditemukan.");
    }

    if (imagePath) {
      await supabase.storage.from("product-images").remove([imagePath]);
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
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

    redirect(`/restaurants/${placeId}`);
  }

  async function deleteMaintenance(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const maintenanceId = formData.get("maintenance_id")?.toString();

    if (!placeId || !maintenanceId) {
      throw new Error("ID tempat atau ID maintenance tidak ditemukan.");
    }

    const { error } = await supabase
      .from("maintenance_sessions")
      .delete()
      .eq("id", maintenanceId)
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

  async function toggleMaintenanceCheck(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const checkId = formData.get("check_id")?.toString();
    const nextChecked = formData.get("next_checked")?.toString() === "true";

    if (!placeId || !checkId) {
      throw new Error("ID tempat atau ID checklist tidak ditemukan.");
    }

    const { error } = await supabase
      .from("maintenance_checks")
      .update({
        is_checked: nextChecked,
        checked_at: nextChecked ? new Date().toISOString() : null,
      })
      .eq("id", checkId);

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

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("place_id", id)
    .order("name", { ascending: true });

  const { data: maintenanceData, error: maintenanceError } = await supabase
    .from("maintenance_sessions")
    .select(
      `
      *,
      maintenance_checks (
        id,
        maintenance_session_id,
        maintenance_asset_id,
        is_checked,
        checked_at,
        maintenance_assets (
          id,
          place_id,
          name,
          description,
          image_path,
          sort_order
        )
      )
    `,
    )
    .eq("place_id", id)
    .order("maintenance_date", { ascending: false });

  if (productsError || maintenanceError) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-red-600">
            Gagal mengambil data detail tempat
          </h1>

          {productsError && (
            <p className="mt-2 text-sm text-slate-600">
              Produk: {productsError.message}
            </p>
          )}

          {maintenanceError && (
            <p className="mt-2 text-sm text-slate-600">
              Maintenance: {maintenanceError.message}
            </p>
          )}

          <Link
            href="/"
            className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  const place = placeData as Place;
  const products = (productsData || []) as Product[];
  const maintenanceSessions = (maintenanceData || []) as MaintenanceSession[];

  const totalMaintenance = maintenanceSessions.length;
  const totalProducts = products.length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar tempat
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 shadow-inner ring-1 ring-white/15">
                  <Store size={15} />
                  Detail Tempat
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {place.name}
                </h1>

                <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300 sm:grid-cols-2">
                  <p className="flex gap-3">
                    <MapPin className="mt-1 shrink-0 text-blue-200" size={18} />
                    <span>{place.address || "Alamat belum diisi"}</span>
                  </p>

                  <p className="flex gap-3">
                    <CalendarDays
                      className="mt-1 shrink-0 text-emerald-200"
                      size={18}
                    />
                    <span>
                      Terakhir diubah: {formatDate(place.last_changed_at)}
                    </span>
                  </p>
                </div>

                <div className="mt-5 inline-flex rounded-full bg-blue-500/15 px-5 py-2.5 text-sm font-black text-blue-100 ring-1 ring-blue-300/20">
                  {place.city_highlight || "Kota belum diisi"}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-4 text-slate-950 shadow-xl shadow-black/10">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Ringkasan Tempat
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                      <p className="text-3xl font-black text-slate-950">
                        {totalProducts}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Produk
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                      <p className="text-3xl font-black text-slate-950">
                        {totalMaintenance}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Maintenance
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/restaurants/${place.id}/edit`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Edit Tempat
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-[2rem] bg-white/90 p-2 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 backdrop-blur">
          <Link
            href={`/restaurants/${place.id}`}
            className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-4 text-sm font-black transition ${
              activeTab === "products"
                ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Package size={18} />
            Produk
          </Link>

          <Link
            href={`/restaurants/${place.id}?tab=maintenance`}
            className={`flex items-center justify-center gap-2 rounded-[1.5rem] px-4 py-4 text-sm font-black transition ${
              activeTab === "maintenance"
                ? "bg-slate-950 text-white shadow-lg shadow-slate-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Wrench size={18} />
            Maintenance
          </Link>
        </div>

        {activeTab === "products" && (
          <>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Produk
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Daftar produk yang terdaftar di tempat ini.
                </p>
              </div>

              <Link
                href={`/restaurants/${place.id}/products/new`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Tambah
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const expiryBadge = getExpiryBadge(product.expires_at);
                const imageUrl = getProductImageUrl(product.image_path);

                const gradients = [
                  "from-blue-500 via-cyan-400 to-emerald-400",
                  "from-emerald-500 via-teal-400 to-cyan-400",
                  "from-violet-500 via-fuchsia-400 to-pink-400",
                  "from-orange-500 via-amber-400 to-yellow-400",
                ];

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/70"
                  >
                    <div
                      className={`h-2 bg-gradient-to-r ${
                        gradients[index % gradients.length]
                      }`}
                    />

                    <div className="p-5 sm:p-6">
                      <div className="rounded-[1.6rem] bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex h-48 items-center justify-center overflow-hidden rounded-[1.25rem] bg-white sm:h-52">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 text-slate-400">
                              <Package size={44} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="line-clamp-2 text-2xl font-black tracking-tight text-slate-950">
                            {product.name}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {place.name}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${expiryBadge.className}`}
                        >
                          {expiryBadge.label}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                          <p className="text-xs font-bold text-slate-500">
                            Quantity
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {product.quantity ?? 0}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                          <p className="text-xs font-bold text-slate-500">
                            Volume
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {product.volume_value ?? "-"}{" "}
                            {product.volume_unit || ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-xs font-bold text-slate-500">
                          Masa berlaku produk
                        </p>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          {formatDate(product.expires_at)}
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link
                          href={`/restaurants/${place.id}/products/${product.id}/edit`}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                        >
                          Edit
                        </Link>

                        <form action={deleteProduct}>
                          <input
                            type="hidden"
                            name="place_id"
                            value={place.id}
                          />
                          <input
                            type="hidden"
                            name="product_id"
                            value={product.id}
                          />
                          <input
                            type="hidden"
                            name="image_path"
                            value={product.image_path || ""}
                          />

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
                  </article>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package size={30} />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-900">
                  Belum ada produk
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Produk untuk tempat ini belum ditambahkan.
                </p>

                <Link
                  href={`/restaurants/${place.id}/products/new`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Tambah Produk
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </>
        )}

        {activeTab === "maintenance" && (
          <>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Maintenance
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Checklist barang maintenance tetap dan catatan bulanan.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link
                  href={`/restaurants/${place.id}/maintenance-assets`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  <Settings size={17} />
                  Kelola
                </Link>

                <Link
                  href={`/restaurants/${place.id}/maintenance/new`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Tambah
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-5">
              {maintenanceSessions.map((session) => {
                const sortedChecks = [
                  ...(session.maintenance_checks || []),
                ].sort(
                  (a, b) =>
                    (a.maintenance_assets?.sort_order || 0) -
                    (b.maintenance_assets?.sort_order || 0),
                );

                const totalChecks = sortedChecks.length;
                const checkedCount = sortedChecks.filter(
                  (check) => check.is_checked,
                ).length;

                const isComplete =
                  totalChecks > 0 && checkedCount === totalChecks;

                return (
                  <article
                    key={session.id}
                    className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200"
                  >
                    <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                            <ClipboardList size={26} />
                          </div>

                          <div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-950">
                              {session.title || "Maintenance Bulanan"}
                            </h3>

                            <p className="mt-1 text-sm font-black text-emerald-700">
                              {formatDate(session.maintenance_date)}
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              Selesai: {checkedCount} / {totalChecks} barang
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ring-1 ${
                              isComplete
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                : "bg-orange-50 text-orange-700 ring-orange-100"
                            }`}
                          >
                            {isComplete ? "Semua selesai" : "Belum selesai"}
                          </span>

                          <Link
                            href={`/restaurants/${place.id}/maintenance/${session.id}/edit`}
                            className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                          >
                            Edit
                          </Link>

                          <form action={deleteMaintenance}>
                            <input
                              type="hidden"
                              name="place_id"
                              value={place.id}
                            />
                            <input
                              type="hidden"
                              name="maintenance_id"
                              value={session.id}
                            />

                            <button
                              type="submit"
                              className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                            >
                              Hapus
                            </button>
                          </form>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {sortedChecks.map((check) => {
                          const asset = check.maintenance_assets;
                          const isChecked = Boolean(check.is_checked);
                          const imageUrl = getMaintenanceImageUrl(
                            asset?.image_path || null,
                          );

                          return (
                            <div
                              key={check.id}
                              className={`rounded-[1.7rem] p-4 ring-1 transition ${
                                isChecked
                                  ? "bg-emerald-50 ring-emerald-200"
                                  : "bg-slate-50 ring-slate-200"
                              }`}
                            >
                              <div className="rounded-[1.35rem] bg-white p-3 ring-1 ring-slate-100">
                                <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={asset?.name || "Barang maintenance"}
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                                      <Wrench size={36} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-black text-slate-950">
                                    {asset?.name || "Barang maintenance"}
                                  </h4>

                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {asset?.description ||
                                      "Tidak ada deskripsi barang."}
                                  </p>

                                  {check.checked_at && (
                                    <p className="mt-2 text-xs font-black text-emerald-700">
                                      Diceklis: {formatDate(check.checked_at)}
                                    </p>
                                  )}
                                </div>

                                <form action={toggleMaintenanceCheck}>
                                  <input
                                    type="hidden"
                                    name="place_id"
                                    value={place.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="check_id"
                                    value={check.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="next_checked"
                                    value={isChecked ? "false" : "true"}
                                  />

                                  <button
                                    type="submit"
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                                      isChecked
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                                        : "bg-white text-slate-400 ring-1 ring-slate-200 hover:text-emerald-600"
                                    }`}
                                    aria-label={
                                      isChecked
                                        ? "Batalkan checklist"
                                        : "Checklist barang"
                                    }
                                  >
                                    {isChecked ? (
                                      <CheckCircle2 size={25} />
                                    ) : (
                                      <Circle size={25} />
                                    )}
                                  </button>
                                </form>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalChecks === 0 && (
                        <div className="mt-5 rounded-[1.7rem] bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                          Belum ada barang tetap untuk maintenance ini.
                        </div>
                      )}

                      <div className="mt-5 rounded-[1.7rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Catatan Bulanan
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          {session.note || "Belum ada catatan bulanan."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {maintenanceSessions.length === 0 && (
              <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Wrench size={30} />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-900">
                  Belum ada maintenance
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Tambahkan maintenance bulanan pertama untuk tempat ini.
                </p>

                <Link
                  href={`/restaurants/${place.id}/maintenance/new`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Tambah Maintenance
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

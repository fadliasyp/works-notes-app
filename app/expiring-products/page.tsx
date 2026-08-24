import Link from "next/link";
import { connection } from "next/server";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Package,
  Store,
} from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/lib/supabase";

type ExpiringProduct = {
  id: string;
  name: string;
  quantity: number | null;
  volume_value: number | null;
  volume_unit: string | null;
  expires_at: string;
  note: string | null;
};

type PlaceWithExpiringProducts = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
  products: ExpiringProduct[];
};

function getDateString(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getDaysLeft(dateValue: string, today: string) {
  return Math.round(
    (Date.parse(`${dateValue}T00:00:00Z`) -
      Date.parse(`${today}T00:00:00Z`)) /
      86_400_000,
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function ExpiringProductsPage() {
  await connection();

  const today = getDateString();
  const fiveDaysLater = getDateString(5);

  const { data, error } = await supabase
    .from("places")
    .select(
      `
      id,
      name,
      address,
      city_highlight,
      products!inner (
        id,
        name,
        quantity,
        volume_value,
        volume_unit,
        expires_at,
        note
      )
    `,
    )
    .gte("products.expires_at", today)
    .lte("products.expires_at", fiveDaysLater)
    .order("name", { ascending: true })
    .order("expires_at", {
      referencedTable: "products",
      ascending: true,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 pt-5 pb-36 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Gagal mengambil produk
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {error.message}
          </p>
        </section>
        <BottomNavigation />
      </main>
    );
  }

  const places = (data || []) as unknown as PlaceWithExpiringProducts[];
  const totalProducts = places.reduce(
    (total, place) => total + place.products.length,
    0,
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 pt-5 pb-36 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-red-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-orange-100 shadow-inner ring-1 ring-white/15">
                  <Clock3 size={15} />
                  Pantauan Masa Berlaku
                </div>

                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Produk Segera Expired
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Produk yang masa berlakunya habis mulai hari ini sampai lima
                  hari ke depan, sama dengan rentang notifikasi email.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Produk Perlu Dicek
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {totalProducts}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Tempat Terdampak
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">
                      {places.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-4 text-slate-950 shadow-xl shadow-black/10">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-orange-50 via-white to-red-50 p-5 ring-1 ring-orange-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
                    <CalendarDays size={24} />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Rentang Pantauan
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {formatDate(today)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-orange-600">
                    sampai {formatDate(fiveDaysLater)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">
            Menampilkan{" "}
            <span className="font-black text-slate-950">{totalProducts}</span>{" "}
            produk dari{" "}
            <span className="font-black text-slate-950">{places.length}</span>{" "}
            tempat
          </p>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            <Building2 size={15} />
            Data tersinkron dengan Supabase
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {places.map((place) => (
            <article
              key={place.id}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200"
            >
              <div className="h-2 bg-gradient-to-r from-orange-500 via-red-400 to-violet-500" />

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-400 text-lg font-black text-white shadow-lg shadow-orange-200">
                    {getInitials(place.name) || <Store size={24} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">
                      {place.name}
                    </h2>
                    <p className="mt-2 flex gap-2 text-sm leading-6 text-slate-600">
                      <MapPin
                        className="mt-0.5 shrink-0 text-slate-400"
                        size={17}
                      />
                      <span>{place.address || "Alamat belum diisi"}</span>
                    </p>
                    <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                      {place.city_highlight || "Kota belum diisi"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {place.products.map((product) => {
                    const daysLeft = getDaysLeft(product.expires_at, today);
                    const expiryLabel =
                      daysLeft === 0
                        ? "Hari ini"
                        : daysLeft === 1
                          ? "Besok"
                          : `${daysLeft} hari lagi`;

                    return (
                      <div
                        key={product.id}
                        className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-slate-200">
                                <Package size={20} />
                              </div>
                              <div>
                                <h3 className="font-black text-slate-950">
                                  {product.name}
                                </h3>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Expired {formatDate(product.expires_at)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${
                              daysLeft <= 1
                                ? "bg-red-50 text-red-700 ring-red-100"
                                : "bg-orange-50 text-orange-700 ring-orange-100"
                            }`}
                          >
                            {expiryLabel}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                          {product.quantity !== null && (
                            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                              Quantity: {product.quantity}
                            </span>
                          )}
                          {product.volume_value !== null && (
                            <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">
                              Volume: {product.volume_value}{" "}
                              {product.volume_unit || ""}
                            </span>
                          )}
                        </div>

                        {product.note && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {product.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={`/restaurants/${place.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                >
                  Buka Detail Tempat
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {places.length === 0 && (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Package size={30} />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">
              Tidak ada produk yang segera expired
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Belum ada produk dengan masa berlaku dari hari ini sampai lima
              hari ke depan.
            </p>
          </div>
        )}
      </section>

      <BottomNavigation />
    </main>
  );
}

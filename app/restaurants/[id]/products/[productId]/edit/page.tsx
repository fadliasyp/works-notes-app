import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Package, Save, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SubmitButton } from "@/components/SubmitButton";
import { withToast } from "@/lib/toast";
import { UnsavedChangesGuard } from "@/components/UnsavedChangesGuard";

type PageProps = {
  params: Promise<{
    id: string;
    productId: string;
  }>;
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
};

type Product = {
  id: string;
  place_id: string;
  name: string;
  quantity: number | null;
  volume_value: number | null;
  volume_unit: string | null;
  expires_at: string | null;
  note: string | null;
};

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

function toNullableNumber(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return Number(stringValue);
}

export default async function EditProductPage({ params }: PageProps) {
  const { id, productId } = await params;

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("id, name, address, city_highlight")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select(
      "id, place_id, name, quantity, volume_value, volume_unit, expires_at, note",
    )
    .eq("id", productId)
    .eq("place_id", id)
    .maybeSingle();

  if (productError || !productData) {
    notFound();
  }

  const place = placeData as Place;
  const product = productData as Product;

  async function updateProduct(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const currentProductId = formData.get("product_id")?.toString();

    if (!placeId || !currentProductId) {
      throw new Error("ID tempat atau ID produk tidak ditemukan.");
    }

    const name = toNullableText(formData.get("name"));
    const quantity = toNullableNumber(formData.get("quantity"));
    const volumeValue = toNullableNumber(formData.get("volume_value"));
    const volumeUnit = toNullableText(formData.get("volume_unit"));
    const expiresAt = toNullableText(formData.get("expires_at"));
    const note = toNullableText(formData.get("note"));

    if (!name) {
      throw new Error("Nama produk wajib diisi.");
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        quantity,
        volume_value: volumeValue,
        volume_unit: volumeUnit,
        expires_at: expiresAt,
        note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentProductId)
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

    redirect(
      withToast(
        `/restaurants/${placeId}`,
        "success",
        "Produk berhasil diperbarui.",
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <UnsavedChangesGuard />
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
                <Package size={15} />
                Edit Produk
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {product.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Perbarui nama produk, foto, quantity, volume, dan masa berlaku
                dengan tampilan yang rapi dan nyaman di handphone.
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
          action={updateProduct}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />
          <input type="hidden" name="product_id" value={product.id} />

          <div className="grid gap-6">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-black text-slate-800"
              >
                Nama Produk
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product.name}
                placeholder="Contoh: Bumbu Ayam"
                className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="text-sm font-black text-slate-800"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  defaultValue={product.quantity ?? ""}
                  placeholder="Contoh: 8"
                  className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expires_at"
                  className="text-sm font-black text-slate-800"
                >
                  Masa Berlaku Produk
                </label>

                <div className="relative mt-2">
                  <CalendarDays
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="expires_at"
                    name="expires_at"
                    type="date"
                    defaultValue={product.expires_at || ""}
                    className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 pl-11 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="volume_value"
                  className="text-sm font-black text-slate-800"
                >
                  Volume Angka
                </label>
                <input
                  id="volume_value"
                  name="volume_value"
                  type="number"
                  defaultValue={product.volume_value ?? ""}
                  placeholder="Contoh: 1"
                  className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="volume_unit"
                  className="text-sm font-black text-slate-800"
                >
                  Satuan Volume
                </label>
                <input
                  id="volume_unit"
                  name="volume_unit"
                  type="text"
                  defaultValue={product.volume_unit || ""}
                  placeholder="Contoh: kg / ml / liter"
                  className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="text-sm font-black text-slate-800"
                >
                  Catatan Produk
                </label>

                <textarea
                  id="note"
                  name="note"
                  rows={4}
                  defaultValue={product.note || ""}
                  placeholder="Contoh: Prioritaskan dipakai minggu ini, stok tinggal sedikit, atau kemasan sudah terbuka..."
                  className="mt-2 w-full resize-none rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
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

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  PackageCheck,
  Save,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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
  image_path: string | null;
  quantity: number | null;
  volume_value: number | null;
  volume_unit: string | null;
  expires_at: string | null;
};

function toNullableNumber(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return Number(stringValue);
}

function toNullableText(value: FormDataEntryValue | null) {
  if (!value) return null;

  const stringValue = value.toString().trim();

  if (stringValue === "") return null;

  return stringValue;
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) return "jpg";

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

async function uploadProductImage(file: File, placeId: string) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Ukuran foto maksimal 5MB.");
  }

  const extension = getFileExtension(file.name);
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;
  const filePath = `${placeId}/${fileName}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  return filePath;
}

function getProductImageUrl(imagePath: string | null) {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
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
    .select("*")
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
      throw new Error("ID produk atau ID tempat tidak ditemukan.");
    }

    const name = formData.get("name")?.toString().trim();

    if (!name) {
      throw new Error("Nama produk wajib diisi.");
    }

    const quantity = toNullableNumber(formData.get("quantity"));
    const volumeValue = toNullableNumber(formData.get("volume_value"));
    const volumeUnit = toNullableText(formData.get("volume_unit"));
    const expiresAt = toNullableText(formData.get("expires_at"));
    const currentImagePath = toNullableText(formData.get("current_image_path"));
    const imageFile = formData.get("image");

    let nextImagePath = currentImagePath;

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploadedImagePath = await uploadProductImage(imageFile, placeId);
      nextImagePath = uploadedImagePath;

      if (currentImagePath) {
        await supabase.storage
          .from("product-images")
          .remove([currentImagePath]);
      }
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        image_path: nextImagePath,
        quantity,
        volume_value: volumeValue,
        volume_unit: volumeUnit,
        expires_at: expiresAt,
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

    redirect(`/restaurants/${placeId}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link
          href={`/restaurants/${place.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke detail tempat
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-white/15">
                <PackageCheck size={14} />
                Edit Produk
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {product.name}
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
          action={updateProduct}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="current_image_path"
            value={product.image_path || ""}
          />

          <div className="grid gap-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-bold text-slate-800"
              >
                Nama Produk
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product.name}
                placeholder="Contoh: Saus Premium"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800">
                Foto Produk
              </label>

              <div className="mt-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {getProductImageUrl(product.image_path) ? (
                  <img
                    src={getProductImageUrl(product.image_path) || ""}
                    alt={product.name}
                    className="h-44 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-white text-slate-400">
                    <ImagePlus size={36} />
                  </div>
                )}

                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Kosongkan jika tidak ingin mengganti foto.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="text-sm font-bold text-slate-800"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product.quantity ?? ""}
                  placeholder="Contoh: 12"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expires_at"
                  className="text-sm font-bold text-slate-800"
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
                    defaultValue={product.expires_at ?? ""}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="volume_value"
                  className="text-sm font-bold text-slate-800"
                >
                  Volume
                </label>
                <input
                  id="volume_value"
                  name="volume_value"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product.volume_value ?? ""}
                  placeholder="Contoh: 500"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="volume_unit"
                  className="text-sm font-bold text-slate-800"
                >
                  Satuan Volume
                </label>
                <select
                  id="volume_unit"
                  name="volume_unit"
                  defaultValue={product.volume_unit ?? ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Pilih satuan</option>
                  <option value="ml">ml</option>
                  <option value="liter">liter</option>
                  <option value="gram">gram</option>
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="botol">botol</option>
                  <option value="kaleng">kaleng</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Save size={18} />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

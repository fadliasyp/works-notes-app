import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  PackagePlus,
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

export default async function NewProductPage({ params }: PageProps) {
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

  async function createProduct(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();

    if (!placeId) {
      throw new Error("ID tempat tidak ditemukan.");
    }

    const name = formData.get("name")?.toString().trim();

    if (!name) {
      redirect(
        withToast(
          `/restaurants/${placeId}/products/new`,
          "error",
          "Nama produk wajib diisi.",
        ),
      );
    }

    const quantity = toNullableNumber(formData.get("quantity"));
    const volumeValue = toNullableNumber(formData.get("volume_value"));
    const volumeUnit = toNullableText(formData.get("volume_unit"));
    const expiresAt = toNullableText(formData.get("expires_at"));
    const imageFile = formData.get("image");

    let imagePath: string | null = null;

    if (imageFile instanceof File && imageFile.size > 0) {
      imagePath = await uploadProductImage(imageFile, placeId);
    }

    const { error } = await supabase.from("products").insert({
      place_id: placeId,
      name,
      image_path: imagePath,
      quantity,
      volume_value: volumeValue,
      volume_unit: volumeUnit,
      expires_at: expiresAt,
    });

    if (error) {
      redirect(
        withToast(
          `/restaurants/${placeId}/products/new`,
          "error",
          error.message,
        ),
      );
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
        "Produk berhasil ditambahkan.",
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
                <PackagePlus size={15} />
                Tambah Produk
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Produk Baru
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Tambahkan produk baru lengkap dengan quantity, volume, foto, dan
                masa berlaku produk.
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
          action={createProduct}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />

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
                placeholder="Contoh: Saus Premium"
                className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <ImagePlus size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Foto Produk
                  </h2>
                  <p className="text-sm text-slate-500">
                    Upload foto produk. Format gambar maksimal 5MB.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.6rem] bg-white p-4 ring-1 ring-slate-200">
                <div className="flex min-h-44 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <ImagePlus size={30} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-800">
                    Pilih foto produk
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Foto akan tampil di kartu produk setelah disimpan.
                  </p>

                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="mt-5 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                  />
                </div>
              </div>
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
                  step="0.01"
                  min="0"
                  placeholder="Contoh: 12"
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
                  step="0.01"
                  min="0"
                  placeholder="Contoh: 500"
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
                <select
                  id="volume_unit"
                  name="volume_unit"
                  defaultValue=""
                  className="mt-2 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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

            <div className="rounded-[1.6rem] bg-blue-50 p-4 text-sm leading-7 text-blue-800 ring-1 ring-blue-100">
              <b>Catatan:</b> produk yang masa berlakunya kurang dari atau sama
              dengan 10 hari akan masuk ke sistem notifikasi expired.
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Link
                href={`/restaurants/${place.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </Link>

              <SubmitButton
                pendingText="Menyimpan produk..."
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Save size={18} />
                Simpan Produk
              </SubmitButton>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

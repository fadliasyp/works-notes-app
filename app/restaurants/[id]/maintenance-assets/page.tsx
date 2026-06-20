import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Save,
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
};

type Place = {
  id: string;
  name: string;
  address: string | null;
  city_highlight: string | null;
};

type MaintenanceAsset = {
  id: string;
  place_id: string;
  name: string;
  description: string | null;
  image_path: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
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

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) return "jpg";

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

async function uploadMaintenanceImage(file: File, placeId: string) {
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
    .from("maintenance-images")
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

function getMaintenanceImageUrl(imagePath: string | null) {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from("maintenance-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

export default async function MaintenanceAssetsPage({ params }: PageProps) {
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
    .select("*")
    .eq("place_id", id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (assetsError) {
    throw new Error(assetsError.message);
  }

  const place = placeData as Place;
  const assets = (assetsData || []) as MaintenanceAsset[];

  async function createAsset(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();

    if (!placeId) {
      throw new Error("ID tempat tidak ditemukan.");
    }

    const name = toNullableText(formData.get("name"));

    if (!name) {
      throw new Error("Nama barang wajib diisi.");
    }

    const description = toNullableText(formData.get("description"));
    const sortOrder = toNullableNumber(formData.get("sort_order")) || 0;
    const imageFile = formData.get("image");

    let imagePath: string | null = null;

    if (imageFile instanceof File && imageFile.size > 0) {
      imagePath = await uploadMaintenanceImage(imageFile, placeId);
    }

    const { data: insertedAsset, error: insertError } = await supabase
      .from("maintenance_assets")
      .insert({
        place_id: placeId,
        name,
        description,
        image_path: imagePath,
        sort_order: sortOrder,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError || !insertedAsset) {
      throw new Error(insertError?.message || "Gagal menambah barang.");
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("maintenance_sessions")
      .select("id")
      .eq("place_id", placeId);

    if (sessionsError) {
      throw new Error(sessionsError.message);
    }

    const checksToInsert =
      sessions?.map((session) => ({
        maintenance_session_id: session.id,
        maintenance_asset_id: insertedAsset.id,
        is_checked: false,
      })) || [];

    if (checksToInsert.length > 0) {
      const { error: checksError } = await supabase
        .from("maintenance_checks")
        .upsert(checksToInsert, {
          onConflict: "maintenance_session_id,maintenance_asset_id",
          ignoreDuplicates: true,
        });

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

    redirect(`/restaurants/${placeId}/maintenance-assets`);
  }

  async function updateAsset(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const assetId = formData.get("asset_id")?.toString();
    const currentImagePath = toNullableText(formData.get("current_image_path"));

    if (!placeId || !assetId) {
      throw new Error("ID tempat atau ID barang tidak ditemukan.");
    }

    const name = toNullableText(formData.get("name"));

    if (!name) {
      throw new Error("Nama barang wajib diisi.");
    }

    const description = toNullableText(formData.get("description"));
    const sortOrder = toNullableNumber(formData.get("sort_order")) || 0;
    const imageFile = formData.get("image");

    let nextImagePath = currentImagePath;

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploadedPath = await uploadMaintenanceImage(imageFile, placeId);
      nextImagePath = uploadedPath;

      if (currentImagePath) {
        await supabase.storage
          .from("maintenance-images")
          .remove([currentImagePath]);
      }
    }

    const { error } = await supabase
      .from("maintenance_assets")
      .update({
        name,
        description,
        sort_order: sortOrder,
        image_path: nextImagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId)
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

    redirect(`/restaurants/${placeId}/maintenance-assets`);
  }

  async function deleteAsset(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const assetId = formData.get("asset_id")?.toString();
    const imagePath = formData.get("image_path")?.toString();

    if (!placeId || !assetId) {
      throw new Error("ID tempat atau ID barang tidak ditemukan.");
    }

    if (imagePath) {
      await supabase.storage.from("maintenance-images").remove([imagePath]);
    }

    const { error } = await supabase
      .from("maintenance_assets")
      .delete()
      .eq("id", assetId)
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

    redirect(`/restaurants/${placeId}/maintenance-assets`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/restaurants/${place.id}?tab=maintenance`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Kembali ke maintenance
          </Link>
        </div>

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-white/15">
                  <Settings size={14} />
                  Kelola Barang Maintenance
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Barang Maintenance
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Barang di halaman ini akan muncul otomatis di setiap checklist
                  maintenance bulanan.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
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
          action={createAsset}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7"
        >
          <input type="hidden" name="place_id" value={place.id} />

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Wrench size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Tambah Barang Tetap
              </h2>
              <p className="text-sm text-slate-500">
                Barang baru akan otomatis masuk ke checklist maintenance yang
                sudah ada dan yang akan dibuat nanti.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_160px]">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-bold text-slate-800"
              >
                Nama Barang
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Contoh: Mesin Kopi"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-bold text-slate-800"
              >
                Deskripsi / Catatan Barang
              </label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Contoh: Cek suhu, kebersihan, dan fungsi"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="sort_order"
                className="text-sm font-bold text-slate-800"
              >
                Urutan
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                defaultValue={assets.length + 1}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ImagePlus size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Foto Barang</p>
                <p className="mt-1 text-xs text-slate-500">
                  Format gambar, maksimal 5MB.
                </p>
              </div>

              <input
                name="image"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white sm:max-w-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
          >
            <Save size={18} />
            Simpan Barang
          </button>
        </form>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-slate-950">
            Daftar Barang Maintenance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Edit atau hapus barang tetap maintenance di sini.
          </p>

          <div className="mt-5 grid gap-5">
            {assets.map((asset) => {
              const imageUrl = getMaintenanceImageUrl(asset.image_path);

              return (
                <div
                  key={asset.id}
                  className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                    <div className="h-48 overflow-hidden rounded-3xl bg-slate-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <Wrench size={42} />
                        </div>
                      )}
                    </div>

                    <div>
                      <form action={updateAsset} className="grid gap-4">
                        <input type="hidden" name="place_id" value={place.id} />
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <input
                          type="hidden"
                          name="current_image_path"
                          value={asset.image_path || ""}
                        />

                        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_130px]">
                          <div>
                            <label className="text-sm font-bold text-slate-800">
                              Nama Barang
                            </label>
                            <input
                              name="name"
                              type="text"
                              required
                              defaultValue={asset.name}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-bold text-slate-800">
                              Deskripsi
                            </label>
                            <input
                              name="description"
                              type="text"
                              defaultValue={asset.description || ""}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-bold text-slate-800">
                              Urutan
                            </label>
                            <input
                              name="sort_order"
                              type="number"
                              defaultValue={asset.sort_order || 0}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-800">
                            Ganti Foto
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Kosongkan jika tidak ingin mengganti foto.
                          </p>

                          <input
                            name="image"
                            type="file"
                            accept="image/*"
                            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            <Save size={18} />
                            Simpan Perubahan
                          </button>

                          <button
                            type="submit"
                            form={`delete-asset-${asset.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                            Hapus Barang
                          </button>
                        </div>
                      </form>

                      <form
                        id={`delete-asset-${asset.id}`}
                        action={deleteAsset}
                      >
                        <input type="hidden" name="place_id" value={place.id} />
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <input
                          type="hidden"
                          name="image_path"
                          value={asset.image_path || ""}
                        />
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {assets.length === 0 && (
            <div className="mt-5 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Wrench size={28} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Belum ada barang maintenance
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Tambahkan barang tetap seperti mesin kopi, kulkas, kompor, AC,
                atau freezer.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

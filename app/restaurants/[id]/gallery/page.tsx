import Link from "next/link";
import { notFound, redirect, RedirectType } from "next/navigation";
import { ArrowLeft, Images, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  GalleryImageItem,
  PlaceGalleryClient,
} from "@/components/PlaceGalleryClient";

import { revalidatePath } from "next/cache";
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

type GalleryImageRow = {
  id: string;
  place_id: string;
  image_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) return "jpg";

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

function getGalleryImageUrl(imagePath: string) {
  const { data } = supabase.storage
    .from("place-gallery-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

async function uploadGalleryFile(file: File, placeId: string) {
  if (!file || file.size === 0) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  const maxSize = 8 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Ukuran foto maksimal 8MB per file.");
  }

  const extension = getFileExtension(file.name);
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;

  const filePath = `${placeId}/${fileName}`;

  const { error } = await supabase.storage
    .from("place-gallery-images")
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

export default async function PlaceGalleryPage({ params }: PageProps) {
  const { id } = await params;

  async function uploadImages(formData: FormData) {
    "use server";

    const placeId = formData.get("place_id")?.toString();
    const files = formData.getAll("images");

    if (!placeId) {
      return {
        ok: false,
        message: "ID tempat tidak ditemukan.",
      };
    }

    const imageFiles = files.filter(
      (file): file is File => file instanceof File && file.size > 0,
    );

    if (imageFiles.length === 0) {
      return {
        ok: false,
        message: "Pilih foto terlebih dahulu.",
      };
    }

    const uploadedRows = [];

    for (const file of imageFiles) {
      const imagePath = await uploadGalleryFile(file, placeId);

      if (imagePath) {
        uploadedRows.push({
          place_id: placeId,
          image_path: imagePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        });
      }
    }

    if (uploadedRows.length > 0) {
      const { error } = await supabase
        .from("place_gallery_images")
        .insert(uploadedRows);

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }
    }

    await supabase
      .from("places")
      .update({
        last_changed_at: new Date().toISOString(),
      })
      .eq("id", placeId);

    revalidatePath(`/restaurants/${placeId}`);
    revalidatePath(`/restaurants/${placeId}/gallery`);

    return {
      ok: true,
      message: `${uploadedRows.length} foto berhasil diupload.`,
    };
  }

  async function deleteImages(formData: FormData) {
    "use server";

    const imageIds = formData
      .getAll("image_ids")
      .map((item) => item.toString());

    if (imageIds.length === 0) {
      redirect(`/restaurants/${id}/gallery`);
    }

    const { data: imagesToDelete, error: findError } = await supabase
      .from("place_gallery_images")
      .select("id, image_path")
      .eq("place_id", id)
      .in("id", imageIds);

    if (findError) {
      throw new Error(findError.message);
    }

    const imagePaths =
      imagesToDelete
        ?.map((image) => image.image_path)
        .filter((path): path is string => Boolean(path)) || [];

    if (imagePaths.length > 0) {
      await supabase.storage.from("place-gallery-images").remove(imagePaths);
    }

    const { error } = await supabase
      .from("place_gallery_images")
      .delete()
      .eq("place_id", id)
      .in("id", imageIds);

    if (error) {
      throw new Error(error.message);
    }

    await supabase
      .from("places")
      .update({
        last_changed_at: new Date().toISOString(),
      })
      .eq("id", id);

    redirect(
      withToast(
        `/restaurants/${id}/gallery`,
        "success",
        "Foto berhasil dihapus.",
      ),
      RedirectType.replace,
    );
  }

  const { data: placeData, error: placeError } = await supabase
    .from("places")
    .select("id, name, address, city_highlight")
    .eq("id", id)
    .maybeSingle();

  if (placeError || !placeData) {
    notFound();
  }

  const { data: galleryData, error: galleryError } = await supabase
    .from("place_gallery_images")
    .select("*")
    .eq("place_id", id)
    .order("created_at", { ascending: false });

  if (galleryError) {
    throw new Error(galleryError.message);
  }

  const place = placeData as Place;

  const images = ((galleryData || []) as GalleryImageRow[]).map(
    (image): GalleryImageItem => ({
      id: image.id,
      image_path: image.image_path,
      file_name: image.file_name,
      file_size: image.file_size,
      mime_type: image.mime_type,
      created_at: image.created_at,
      publicUrl: getGalleryImageUrl(image.image_path),
    }),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eef6ff_28%,#f8fafc_55%,#ecfeff_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link
          href={`/restaurants/${place.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Kembali ke detail tempat
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300/60 ring-1 ring-white/10">
          <div className="relative px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 shadow-inner ring-1 ring-white/15">
                <Images size={15} />
                Gallery Tempat
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Kumpulan Foto
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Simpan dokumentasi foto untuk tempat ini. Foto bisa dibuka full
                screen dan digeser kanan/kiri.
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

        <input form="upload-hidden" type="hidden" name="place_id" value={id} />

        <PlaceGalleryClient
          images={images}
          uploadAction={async (formData: FormData) => {
            "use server";

            formData.set("place_id", id);
            return uploadImages(formData);
          }}
          deleteAction={deleteImages}
        />
      </section>
    </main>
  );
}

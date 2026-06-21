"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Trash2,
  X,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";

export type GalleryImageItem = {
  id: string;
  image_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string | null;
  publicUrl: string;
};

type UploadResult = {
  ok: boolean;
  message: string;
};

type PlaceGalleryClientProps = {
  images: GalleryImageItem[];
  uploadAction: (formData: FormData) => Promise<UploadResult>;
  deleteAction: (formData: FormData) => void;
};
export function PlaceGalleryClient({
  images,
  uploadAction,
  deleteAction,
}: PlaceGalleryClientProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState("");

  const activeImage = activeIndex === null ? null : images[activeIndex];

  const selectedCount = selectedIds.length;

  const selectedMap = useMemo(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = fileInputRef.current;

    if (!input?.files || input.files.length === 0) {
      setUploadInfo("Pilih foto terlebih dahulu.");
      return;
    }

    const files = Array.from(input.files);

    if (files.length > 20) {
      setUploadInfo("Maksimal upload 20 foto sekaligus.");
      return;
    }

    setIsUploading(true);
    setUploadInfo("Menyiapkan foto...");

    try {
      const formData = new FormData();

      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        setUploadInfo(`Mengompres foto ${index + 1} dari ${files.length}...`);

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.85,
          maxWidthOrHeight: 1800,
          useWebWorker: true,
          initialQuality: 0.86,
          fileType: "image/jpeg",
        });

        const safeName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-");

        const finalFile = new File(
          [compressedFile],
          `${safeName || "foto"}.jpg`,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          },
        );

        formData.append("images", finalFile);
      }

      setUploadInfo("Mengupload foto...");

      const result = await uploadAction(formData);

      if (!result.ok) {
        setUploadInfo(result.message || "Gagal upload foto.");
        return;
      }

      formRef.current?.reset();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSelectedFileCount(0);
      setUploadInfo(result.message || "Foto berhasil diupload.");

      router.refresh();
    } catch (error) {
      console.error(error);
      setUploadInfo("Gagal upload foto. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function clearSelected() {
    setSelectedIds([]);
  }

  function showPrevious() {
    if (activeIndex === null || images.length === 0) return;

    setActiveIndex((activeIndex - 1 + images.length) % images.length);
  }

  function showNext() {
    if (activeIndex === null || images.length === 0) return;

    setActiveIndex((activeIndex + 1) % images.length);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX === null) return;

    const diff = touchStartX - clientX;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        showNext();
      } else {
        showPrevious();
      }
    }

    setTouchStartX(null);
  }

  return (
    <>
      <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7">
        <form ref={formRef} onSubmit={handleUpload} className="grid gap-4">
          <div className="rounded-[1.8rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <ImagePlus size={24} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Tambah Foto
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Bisa pilih satu foto atau banyak foto sekaligus.
                </p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setSelectedFileCount(event.target.files?.length || 0)
            }
            className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
          />

          <button
            type="submit"
            disabled={isUploading || selectedFileCount === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isUploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengupload...
              </>
            ) : selectedFileCount > 0 ? (
              <>
                <ImagePlus size={18} />
                Upload {selectedFileCount} Foto
              </>
            ) : (
              <>
                <ImagePlus size={18} />
                Pilih Foto Dulu
              </>
            )}
          </button>
          {isUploading && uploadInfo && (
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
              {uploadInfo}
            </div>
          )}
        </form>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950">
            Semua Foto
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {images.length} foto tersimpan di tempat ini.
          </p>
        </div>

        {selectedCount > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSelected}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              Batal
            </button>

            <form action={deleteAction}>
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="image_ids" value={id} />
              ))}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
              >
                <Trash2 size={17} />
                Hapus {selectedCount}
              </button>
            </form>
          </div>
        )}
      </div>

      {images.length > 0 ? (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {images.map((image, index) => {
            const isSelected = selectedMap.has(image.id);

            return (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200"
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="h-full w-full"
                >
                  <img
                    src={image.publicUrl}
                    alt={image.file_name || "Foto tempat"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => toggleSelected(image.id)}
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl shadow-lg ring-1 transition ${
                    isSelected
                      ? "bg-blue-600 text-white ring-blue-400"
                      : "bg-white/90 text-slate-500 ring-white/70"
                  }`}
                  aria-label="Pilih foto"
                >
                  {isSelected ? <Check size={17} /> : null}
                </button>

                <form
                  action={deleteAction}
                  className="absolute bottom-2 right-2"
                >
                  <input type="hidden" name="image_ids" value={image.id} />

                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/90 text-white shadow-lg opacity-0 transition group-hover:opacity-100"
                    aria-label="Hapus foto"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ImagePlus size={30} />
          </div>

          <h3 className="mt-5 text-xl font-black text-slate-900">
            Belum ada foto
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Upload foto pertama untuk membuat kumpulan foto tempat ini.
          </p>
        </div>
      )}

      {activeImage && activeIndex !== null && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 text-white">
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <X size={24} />
            </button>

            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black backdrop-blur">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 backdrop-blur transition hover:bg-white/20 sm:flex"
          >
            <ArrowLeft size={24} />
          </button>

          <div
            className="flex h-full w-full items-center justify-center px-3 py-20"
            onTouchStart={(event) =>
              setTouchStartX(event.touches[0]?.clientX ?? null)
            }
            onTouchEnd={(event) =>
              handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)
            }
          >
            <img
              src={activeImage.publicUrl}
              alt={activeImage.file_name || "Foto tempat"}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>

          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 backdrop-blur transition hover:bg-white/20 sm:flex"
          >
            <ArrowRight size={24} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur sm:hidden">
            Geser kanan / kiri untuk pindah foto
          </div>
        </div>
      )}
    </>
  );
}

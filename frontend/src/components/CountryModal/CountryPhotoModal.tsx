import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  addCountryPhoto,
  fetchCountryPhotos,
  patchCountryPhotos,
  type CountryPhotoDto,
} from "../../lib/api/countryPhotos";
import { getStoredUserId } from "../../lib/userApi";
import styles from "./CountryModal.module.css";

type Props = {
  countryCode: string;
  countryName: string;
  onClose: () => void;
};

const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.84;

const countryPhotosCache = new Map<string, CountryPhotoDto[]>();

function countryPhotoCacheKey(userId: string, code: string): string {
  return `${userId}|${code.trim().toUpperCase()}`;
}

function readCachedPhotos(userId: string | null, code: string): CountryPhotoDto[] | undefined {
  if (!userId) return undefined;
  return countryPhotosCache.get(countryPhotoCacheKey(userId, code));
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function toDisplayOrder(photos: CountryPhotoDto[]): CountryPhotoDto[] {
  return [...photos].reverse();
}

function toServerOrderFromDisplay(displayOrdered: CountryPhotoDto[]): CountryPhotoDto[] {
  return [...displayOrdered].reverse();
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unsupported image format"));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function compressImageDataUrl(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not process selected image"));
  });

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

type PhotoView = {
  photos: CountryPhotoDto[];
  loadStatus: "loading" | "ready";
};

function initialPhotoView(userId: string | null, countryCode: string): PhotoView {
  if (!userId) return { photos: [], loadStatus: "ready" };
  const hit = readCachedPhotos(userId, countryCode);
  if (hit && hit.length > 0) return { photos: hit, loadStatus: "ready" };
  return { photos: [], loadStatus: "loading" };
}

export function CountryPhotoModal({ countryCode, countryName, onClose }: Props) {
  const userId = getStoredUserId();
  const [view, setView] = useState<PhotoView>(() => initialPhotoView(userId, countryCode));
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = view.photos;

  const displayedPhotos = useMemo(() => toDisplayOrder(photos), [photos]);

  const activePhoto = useMemo(() => {
    if (activePhotoId) {
      const found = photos.find((p) => p.id === activePhotoId);
      if (found) return found;
    }
    return displayedPhotos[0] ?? null;
  }, [activePhotoId, photos, displayedPhotos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editMode) {
        setEditMode(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editMode]);

  useEffect(() => {
    if (!userId) {
      setError("Sign in or create a profile to save photos to your account.");
      setView({ photos: [], loadStatus: "ready" });
      return;
    }

    const key = countryPhotoCacheKey(userId, countryCode);
    let cancelled = false;

    setView((prev) => {
      const cached = countryPhotosCache.get(key);
      const fromCache = cached && cached.length > 0 ? cached : [];
      return {
        loadStatus: "loading",
        photos: prev.photos.length > 0 ? prev.photos : fromCache,
      };
    });

    setError(null);
    fetchCountryPhotos(userId, countryCode)
      .then((data) => {
        if (cancelled) return;
        countryPhotosCache.set(key, data.photos);
        setView({ photos: data.photos, loadStatus: "ready" });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load photos");
        setView((prev) => ({
          photos: prev.photos,
          loadStatus: "ready",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode, userId]);

  useEffect(() => {
    if (photos.length === 0) setEditMode(false);
  }, [photos.length]);

  const applyDisplayOrder = async (displayOrdered: CountryPhotoDto[]) => {
    if (!userId) return;
    const optimisticPhotos = toServerOrderFromDisplay(displayOrdered);
    const previousPhotos = photos;

    setView({ photos: optimisticPhotos, loadStatus: "ready" });
    countryPhotosCache.set(countryPhotoCacheKey(userId, countryCode), optimisticPhotos);
    setIsSavingEdits(true);
    setError(null);

    try {
      const data = await patchCountryPhotos(
        userId,
        countryCode,
        optimisticPhotos.map((p) => p.id)
      );
      countryPhotosCache.set(countryPhotoCacheKey(userId, countryCode), data.photos);
      setView({ photos: data.photos, loadStatus: "ready" });
      if (activePhotoId && !data.photos.some((p) => p.id === activePhotoId)) {
        const nextDisplay = toDisplayOrder(data.photos);
        setActivePhotoId(nextDisplay[0]?.id ?? null);
      }
    } catch (err) {
      countryPhotosCache.set(countryPhotoCacheKey(userId, countryCode), previousPhotos);
      setView({ photos: previousPhotos, loadStatus: "ready" });
      setError(err instanceof Error ? err.message : "Could not update photos");
    } finally {
      setIsSavingEdits(false);
    }
  };

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files can be uploaded.");
      return;
    }
    if (!userId) {
      setError("Sign in or create a profile to save photos.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const rawDataUrl = await fileToDataUrl(file);
      const compressedDataUrl = await compressImageDataUrl(rawDataUrl);
      const data = await addCountryPhoto(userId, countryCode, {
        countryName,
        dataUrl: compressedDataUrl,
      });
      countryPhotosCache.set(countryPhotoCacheKey(userId, countryCode), data.photos);
      setView({ photos: data.photos, loadStatus: "ready" });
      setActivePhotoId(data.photos[data.photos.length - 1]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAtDisplayIndex = (displayIndex: number) => {
    const disp = [...displayedPhotos];
    disp.splice(displayIndex, 1);
    void applyDisplayOrder(disp);
  };

  const swapPhotosById = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const disp = [...displayedPhotos];
    const i = disp.findIndex((p) => p.id === fromId);
    const j = disp.findIndex((p) => p.id === toId);
    if (i < 0 || j < 0) return;
    const a = disp[i];
    const b = disp[j];
    if (!a || !b) return;
    disp[i] = b;
    disp[j] = a;
    void applyDisplayOrder(disp);
  };

  const showEmpty = Boolean(userId) && view.loadStatus === "ready" && photos.length === 0;
  const showLoading = view.loadStatus === "loading" && photos.length === 0;
  const showGallery = photos.length > 0;

  return (
    <div
      className={styles.galleryOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-photo-title"
      onClick={(e) => e.currentTarget === e.target && onClose()}
    >
      <div className={styles.galleryModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.galleryHeader}>
          <div>
            <h3 id="country-photo-title" className={styles.galleryTitle}>
              {countryName} — photo journal
            </h3>
            <p className={styles.gallerySubtitle}>
              Your photos for this country are stored with your account.
              {editMode && photos.length > 1
                ? " Drag one thumbnail onto another to swap their order."
                : ""}
            </p>
          </div>
          <div className={styles.galleryHeaderActions}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPickPhoto}
            />
            <button
              type="button"
              className={styles.galleryActionBtn}
              disabled={isUploading || isSavingEdits}
              onClick={() => fileRef.current?.click()}
            >
              {isUploading ? "Uploading…" : "Add photo"}
            </button>
            <button
              type="button"
              className={styles.galleryActionBtn}
              disabled={isUploading || isSavingEdits || photos.length === 0}
              aria-pressed={editMode}
              onClick={() => {
                setEditMode((v) => !v);
                setError(null);
              }}
            >
              {editMode ? "Done" : "Edit photos"}
            </button>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className={styles.galleryMain}>
          {error && <p className={styles.galleryError}>{error}</p>}

          {showGallery ? (
            <div className={styles.galleryBody}>
              <div className={styles.galleryPreviewWrap}>
                {activePhoto ? (
                  <>
                    <img
                      src={activePhoto.dataUrl}
                      alt={`${countryName} travel`}
                      className={styles.galleryPreview}
                    />
                    <p className={styles.galleryPhotoMeta}>
                      Added: {formatDate(activePhoto.createdAt)}
                    </p>
                  </>
                ) : null}
              </div>
              <aside className={styles.gallerySidebar} aria-label="Photo thumbnails">
                <div className={styles.galleryGrid}>
                  {displayedPhotos.map((photo, displayIndex) => (
                    <div key={photo.id} className={styles.galleryThumbCell}>
                      {editMode ? (
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label="Select photo. Drag onto another thumbnail to swap order."
                          className={`${styles.galleryThumbBtn} ${
                            activePhoto?.id === photo.id ? styles.galleryThumbBtnActive : ""
                          }`}
                          draggable={!isSavingEdits}
                          onDragStart={(e) => {
                            if (isSavingEdits) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData("text/plain", photo.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromId = e.dataTransfer.getData("text/plain");
                            swapPhotosById(fromId, photo.id);
                          }}
                          onClick={() => setActivePhotoId(photo.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              setActivePhotoId(photo.id);
                            }
                          }}
                        >
                          <img
                            src={photo.dataUrl}
                            alt=""
                            className={styles.galleryThumb}
                            draggable={false}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.galleryThumbBtn} ${
                            activePhoto?.id === photo.id ? styles.galleryThumbBtnActive : ""
                          }`}
                          disabled={isSavingEdits}
                          onClick={() => setActivePhotoId(photo.id)}
                        >
                          <img
                            src={photo.dataUrl}
                            alt={`${countryName} thumbnail`}
                            className={styles.galleryThumb}
                          />
                        </button>
                      )}
                      {editMode && (
                        <button
                          type="button"
                          className={styles.galleryThumbRemove}
                          aria-label="Remove photo"
                          disabled={isSavingEdits}
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            removeAtDisplayIndex(displayIndex);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : showLoading ? (
            <p className={styles.galleryStatus}>Loading photos…</p>
          ) : showEmpty ? (
            <div className={styles.galleryEmpty}>
              <p>No photos yet. Add your first shot from this country.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import { create } from "zustand";

export type UploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "confirming"
  | "approved"
  | "rejected"
  | "error";

export interface PhotoItem {
  mediaId: string;
  file: File;
  r2Key: string;
  status: UploadStatus;
  progress: number;
  thumbnailUrl: string | null;
  error: string | null;
}

export interface VideoItem {
  mediaId: string;
  file: File;
  streamUid: string;
  status: UploadStatus;
  progress: number;
  thumbnailUrl: string | null;
  playbackUrl: string | null;
  error: string | null;
}

interface MediaUploadState {
  proposalId: string;
  walletAddr: string;
  photos: PhotoItem[];
  video: VideoItem | null;

  setProposalId: (id: string) => void;
  setWalletAddr: (addr: string) => void;

  // Photo actions
  uploadPhoto: (file: File) => Promise<void>;
  uploadPhotos: (files: File[]) => void;
  removePhoto: (mediaId: string) => void;

  // Video actions
  uploadVideo: (file: File) => Promise<void>;
  removeVideo: () => void;

  // Finalize
  finalizeMedia: (onChainProposalId: string) => Promise<void>;

  // Helpers
  hasUploadsInProgress: () => boolean;
  hasRejected: () => boolean;
  reset: () => void;
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data as T;
}

/**
 * Upload a photo via the Worker (`/api/media/photo/upload`), which streams
 * the bytes into R2 through the `MEDIA_BUCKET` binding. Returns the
 * server's response payload (mediaId, r2Key, status, thumbnailUrl).
 *
 * This replaces the older presign + direct PUT flow — that flow needed
 * R2 S3-compatible access keys, which the Cloudflare Global API Key
 * cannot mint. Routing through the Worker uses the binding instead.
 */
function uploadPhotoViaWorker(
  file: File,
  walletAddr: string,
  proposalId: string,
  onProgress: (pct: number) => void,
): Promise<{
  mediaId: string;
  r2Key: string;
  status: string;
  thumbnailUrl: string | null;
}> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("walletAddr", walletAddr);
    form.append("proposalId", proposalId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/photo/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          msg = JSON.parse(xhr.responseText)?.error ?? msg;
        } catch {}
        return reject(new Error(msg));
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Bad response"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(form);
  });
}

/**
 * Upload video to Cloudflare Stream.
 * Tries direct upload first (fast, browser → Stream).
 * Falls back to proxy if CORS blocks the direct upload.
 */
function uploadStreamFormData(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    console.log(`[TripHunt] Uploading video (${sizeMB}MB) directly to Stream...`);
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log("[TripHunt] Direct video upload succeeded");
        resolve();
      } else {
        console.warn(`[TripHunt] Direct upload HTTP ${xhr.status}, falling back to proxy`);
        uploadViaProxy(uploadUrl, file, onProgress).then(resolve, reject);
      }
    };
    xhr.onerror = () => {
      console.warn("[TripHunt] Direct upload blocked (CORS), falling back to proxy...");
      uploadViaProxy(uploadUrl, file, onProgress).then(resolve, reject);
    };
    xhr.ontimeout = () => reject(new Error("Video upload timed out"));
    xhr.send(form);
  });
}

function uploadViaProxy(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[TripHunt] Uploading video via server proxy...");
    const form = new FormData();
    form.append("file", file);
    form.append("uploadUrl", uploadUrl);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/video/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Proxy upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Video upload network error"));
    xhr.send(form);
  });
}

export const useMediaUpload = create<MediaUploadState>((set, get) => ({
  proposalId: "",
  walletAddr: "",
  photos: [],
  video: null,

  setProposalId: (id) => set({ proposalId: id }),
  setWalletAddr: (addr) => set({ walletAddr: addr }),

  uploadPhoto: async (file: File) => {
    // Wrapper for single file — delegates to uploadPhotos
    get().uploadPhotos([file]);
  },

  uploadPhotos: (files: File[]) => {
    const { proposalId, walletAddr, photos } = get();
    const remaining = 10 - photos.length;
    const batch = files.slice(0, remaining);
    if (batch.length === 0) return;

    // 1. Add ALL photos to state at once with unique temp IDs
    const entries = batch.map((file) => ({
      tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }));

    const newPhotos: PhotoItem[] = entries.map(({ tempId, file }) => ({
      mediaId: tempId,
      file,
      r2Key: "",
      status: "presigning" as const,
      progress: 0,
      thumbnailUrl: null,
      error: null,
    }));

    set({ photos: [...get().photos, ...newPhotos] });

    // 2. Upload each photo concurrently using presigned URLs (browser → R2 direct)
    for (const { tempId, file } of entries) {
      const updatePhoto = (updates: Partial<PhotoItem>) => {
        set({
          photos: get().photos.map((p) =>
            p.mediaId === tempId ? { ...p, ...updates } : p,
          ),
        });
      };

      const doUpload = async () => {
        try {
          updatePhoto({ status: "uploading" as const });

          // Single-step: stream the file to /api/media/photo/upload, which
          // writes it to R2 via the Worker's MEDIA_BUCKET binding and runs
          // moderation. No presign/direct-PUT (R2 access keys not needed).
          const result = await uploadPhotoViaWorker(
            file,
            walletAddr,
            proposalId,
            (pct) => updatePhoto({ progress: pct }),
          );

          set({
            photos: get().photos.map((p) =>
              p.mediaId === tempId
                ? {
                    ...p,
                    mediaId: result.mediaId,
                    r2Key: result.r2Key,
                    progress: 100,
                    status:
                      result.status === "approved"
                        ? ("approved" as const)
                        : ("rejected" as const),
                    thumbnailUrl: result.thumbnailUrl,
                    error:
                      result.status === "rejected"
                        ? "Content flagged by moderation"
                        : null,
                  }
                : p,
            ),
          });
        } catch (err) {
          updatePhoto({
            status: "error" as const,
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      };

      // Fire and forget — each upload runs independently
      doUpload();
    }
  },

  removePhoto: (mediaId) => {
    set({ photos: get().photos.filter((p) => p.mediaId !== mediaId) });
  },

  uploadVideo: async (file: File) => {
    const { proposalId, walletAddr } = get();

    const newVideo: VideoItem = {
      mediaId: "",
      file,
      streamUid: "",
      status: "presigning",
      progress: 0,
      thumbnailUrl: null,
      playbackUrl: null,
      error: null,
    };

    set({ video: newVideo });

    const updateVideo = (updates: Partial<VideoItem>) => {
      set({ video: get().video ? { ...get().video!, ...updates } : null });
    };

    try {
      // 1) Get Stream upload URL
      const upload = await apiPost<{ uploadUrl: string; streamUid: string; mediaId: string }>(
        "/api/media/video/create-upload",
        { walletAddr, proposalId },
      );

      updateVideo({ mediaId: upload.mediaId, streamUid: upload.streamUid, status: "uploading" });

      // 2) Upload to Stream via FormData
      await uploadStreamFormData(upload.uploadUrl, file, (pct) => updateVideo({ progress: pct }));

      updateVideo({ status: "confirming", progress: 100 });

      // 3) Poll for readiness — Stream needs time to process
      let attempts = 0;
      const maxAttempts = 60; // up to 2 minutes
      // Wait a bit before first poll — Stream needs time after upload
      await new Promise((r) => setTimeout(r, 3000));

      while (attempts < maxAttempts) {
        try {
          const confirm = await apiPost<{
            status: string;
            state?: string;
            thumbnailUrl?: string | null;
            playbackUrl?: string | null;
          }>("/api/media/video/confirm", { mediaId: upload.mediaId, walletAddr });

          if (confirm.status === "processing") {
            attempts++;
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          updateVideo({
            status: confirm.status === "approved" ? "approved" : "rejected",
            thumbnailUrl: confirm.thumbnailUrl ?? null,
            playbackUrl: confirm.playbackUrl ?? null,
            error: confirm.status === "rejected" ? "Content flagged by moderation" : null,
          });
          return;
        } catch {
          // Confirm endpoint might fail transiently — retry
          attempts++;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      // Timed out but upload succeeded — mark as approved anyway
      updateVideo({ status: "approved", error: null });
    } catch (err) {
      updateVideo({ status: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  },

  removeVideo: () => set({ video: null }),

  finalizeMedia: async (onChainProposalId: string) => {
    const { proposalId, walletAddr } = get();
    await apiPost("/api/media/finalize", {
      tempProposalId: proposalId,
      onChainProposalId,
      walletAddr,
    });
  },

  hasUploadsInProgress: () => {
    const { photos, video } = get();
    const inProgress: UploadStatus[] = ["presigning", "uploading", "confirming"];
    return (
      photos.some((p) => inProgress.includes(p.status)) ||
      (video !== null && inProgress.includes(video.status))
    );
  },

  hasRejected: () => {
    const { photos, video } = get();
    return photos.some((p) => p.status === "rejected") || video?.status === "rejected";
  },

  reset: () => set({ proposalId: "", walletAddr: "", photos: [], video: null }),
}));

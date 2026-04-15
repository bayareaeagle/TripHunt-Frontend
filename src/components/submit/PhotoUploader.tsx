"use client";

import { useCallback, useRef } from "react";
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import type { PhotoItem } from "@/hooks/useMediaUpload";

const ACCEPT = "image/jpeg,image/png,image/webp";

function StatusBadge({ item }: { item: PhotoItem }) {
  if (item.status === "uploading")
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
        <div className="text-white text-xs font-medium">{item.progress}%</div>
      </div>
    );
  if (item.status === "presigning" || item.status === "confirming")
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
        <Loader2 className="h-5 w-5 text-white animate-spin" />
      </div>
    );
  if (item.status === "rejected")
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/60 rounded-xl">
        <AlertCircle className="h-5 w-5 text-white" />
      </div>
    );
  if (item.status === "error")
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-red-900/60 rounded-xl">
        <AlertCircle className="h-5 w-5 text-white" />
      </div>
    );
  if (item.status === "approved")
    return (
      <div className="absolute top-1 right-1">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </div>
    );
  return null;
}

export function PhotoUploader() {
  const { photos, uploadPhotos, removePhoto, thumbnailMediaId, setThumbnail } =
    useMediaUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      uploadPhotos(Array.from(files));
    },
    [uploadPhotos],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Photos (up to 10)</h4>
        <span className="text-xs text-muted-foreground">{photos.length}/10</span>
      </div>

      {/* Thumbnail Grid */}
      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-5 gap-2">
            {photos.map((item) => {
              const isCover = item.mediaId === thumbnailMediaId;
              const canBeCover = item.status === "approved";
              return (
                <div
                  key={item.mediaId}
                  className={`relative aspect-square rounded-xl ${
                    isCover ? "ring-2 ring-amber-400 ring-offset-2" : ""
                  }`}
                >
                  <img
                    src={item.thumbnailUrl ?? URL.createObjectURL(item.file)}
                    alt=""
                    className="h-full w-full rounded-xl object-cover"
                  />
                  <StatusBadge item={item} />
                  <button
                    type="button"
                    onClick={() => removePhoto(item.mediaId)}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {canBeCover && (
                    <button
                      type="button"
                      onClick={() => setThumbnail(item.mediaId)}
                      title={isCover ? "Cover photo" : "Set as cover"}
                      className={`absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs shadow ${
                        isCover
                          ? "bg-amber-400 text-amber-950"
                          : "bg-white/90 text-muted-foreground hover:bg-amber-100"
                      }`}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${isCover ? "fill-current" : ""}`}
                      />
                    </button>
                  )}
                  {item.error && (
                    <p className="absolute bottom-0 left-0 right-0 truncate rounded-b-xl bg-red-600/90 px-1 py-0.5 text-[10px] text-white">
                      {item.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {photos.some((p) => p.status === "approved") && (
            <p className="text-xs text-muted-foreground">
              Tap the <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" /> on a photo to use it as the proposal cover.
            </p>
          )}
        </>
      )}

      {/* Drop Zone */}
      {photos.length < 10 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-8 transition-colors hover:border-primary/40"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Drag and drop photos here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, or WebP. Max 10 MB each.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Choose Files
          </Button>
        </div>
      )}
    </div>
  );
}

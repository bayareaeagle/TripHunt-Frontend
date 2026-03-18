"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/hooks/useMediaUpload";

const ACCEPT = "video/mp4,video/quicktime,video/webm";

const MIN_DURATION = 15;
const MAX_DURATION = 120;

function validateDuration(file: File): Promise<{ valid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration < MIN_DURATION) {
        resolve({ valid: false, reason: `Video must be at least ${MIN_DURATION} seconds.` });
      } else if (video.duration > MAX_DURATION) {
        resolve({ valid: false, reason: `Video must be 2 minutes or shorter.` });
      } else {
        resolve({ valid: true });
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({ valid: false, reason: "Could not read video file." });
    };
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUploader() {
  const { video, uploadVideo, removeVideo } = useMediaUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setValidationError(null);

      const { valid, reason } = await validateDuration(file);
      if (!valid) {
        setValidationError(reason || "Invalid video.");
        return;
      }

      uploadVideo(file);
    },
    [uploadVideo],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  // Video preview or status
  if (video) {
    const isWorking = ["presigning", "uploading", "confirming"].includes(video.status);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Video (15s–2min)</h4>
          <button
            type="button"
            onClick={removeVideo}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Remove
          </button>
        </div>

        <div className="relative rounded-2xl border border-border/60 bg-muted/30 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Video className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{video.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(video.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>

              {isWorking && (
                <div className="mt-2 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {video.status === "uploading"
                      ? `Uploading ${video.progress}%`
                      : video.status === "confirming"
                        ? "Processing & moderating..."
                        : "Preparing..."}
                  </span>
                </div>
              )}

              {video.status === "approved" && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </div>
              )}

              {video.status === "rejected" && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {video.error || "Content flagged by moderation"}
                </div>
              )}

              {video.status === "error" && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {video.error || "Upload failed"}
                </div>
              )}
            </div>
          </div>

          {/* Upload progress bar */}
          {video.status === "uploading" && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${video.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">Video (15s–2min)</h4>
      <p className="text-xs text-muted-foreground">
        Record a 15-second to 2-minute video with your face visible, explaining why the community
        should fund your trip.
      </p>

      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-xs text-red-700">{validationError}</p>
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-10 transition-colors hover:border-primary/40"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Drag and drop your video here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          MP4, MOV, or WebM. 15 seconds to 2 minutes.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Choose File
        </Button>
      </div>
    </div>
  );
}

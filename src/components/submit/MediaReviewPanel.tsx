"use client";

import { CheckCircle2, AlertCircle, ImageIcon, Video } from "lucide-react";
import { useMediaUpload } from "@/hooks/useMediaUpload";

export function MediaReviewPanel() {
  const { photos, video } = useMediaUpload();

  const approvedPhotos = photos.filter((p) => p.status === "approved");
  const rejectedPhotos = photos.filter((p) => p.status === "rejected");

  return (
    <div className="space-y-4">
      {/* Photos summary */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          Photos
        </span>
        <span className="font-medium text-foreground">
          {approvedPhotos.length > 0
            ? `${approvedPhotos.length} approved`
            : "None"}
          {rejectedPhotos.length > 0 && (
            <span className="ml-1 text-red-600">
              ({rejectedPhotos.length} rejected)
            </span>
          )}
        </span>
      </div>

      {/* Photo thumbnails */}
      {approvedPhotos.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {approvedPhotos.map((p) => (
            <div key={p.mediaId} className="relative aspect-square">
              <img
                src={p.thumbnailUrl ?? URL.createObjectURL(p.file)}
                alt=""
                className="h-full w-full rounded-lg object-cover"
              />
              <CheckCircle2 className="absolute top-0.5 right-0.5 h-3 w-3 text-green-500" />
            </div>
          ))}
        </div>
      )}

      {/* Video summary */}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5" />
          Video
        </span>
        <span className="font-medium text-foreground">
          {!video && "None"}
          {video?.status === "approved" && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Approved
            </span>
          )}
          {video?.status === "rejected" && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              Rejected
            </span>
          )}
          {video && !["approved", "rejected"].includes(video.status) && (
            <span className="text-amber-600">Processing...</span>
          )}
        </span>
      </div>

      {/* Video thumbnail */}
      {video?.status === "approved" && video.thumbnailUrl && (
        <div className="relative w-32 aspect-video rounded-lg overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt="Video thumbnail"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import type { PutBlobResult } from "@vercel/blob";
import { resizeImage } from "@/lib/image-resize";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadInlineProps {
  currentImage: string | null;
  name: string | null;
  onUpload: (url: string) => void | Promise<void>;
  avatarClassName?: string;
}

export interface AvatarUploadInlineHandle {
  uploadIfPending: () => Promise<string | null>;
}

function getInitials(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export const AvatarUploadInline = forwardRef<
  AvatarUploadInlineHandle,
  AvatarUploadInlineProps
>(function AvatarUploadInline(
  { currentImage, name, onUpload, avatarClassName = "h-24 w-24" },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const initials = getInitials(name);
  const displayPreview = localPreview ?? currentImage;

  const runUpload = useCallback(
    async (file: File, preview: string | null): Promise<string | null> => {
      setIsUploading(true);
      try {
        const response = await fetch(
          `/api/avatar/upload?filename=${encodeURIComponent(file.name)}`,
          { method: "POST", body: file },
        );
        if (!response.ok) throw new Error(response.statusText);
        const blob = (await response.json()) as PutBlobResult;
        if (preview) URL.revokeObjectURL(preview);
        setLocalPreview(null);
        setSelectedFile(null);
        toast.success("Profile picture updated");
        await onUpload(blob.url);
        return blob.url;
      } catch (err) {
        console.error("Upload threw:", err);
        toast.error("Upload failed");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload],
  );

  useImperativeHandle(
    ref,
    () => ({
      uploadIfPending: () => {
        if (!selectedFile) return Promise.resolve(null);
        return runUpload(selectedFile, localPreview);
      },
    }),
    [selectedFile, localPreview, runUpload],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsResizing(true);
    let resized: File;
    let preview: string;
    try {
      resized = await resizeImage(file, 512, 0.85);
      if (localPreview) URL.revokeObjectURL(localPreview);
      preview = URL.createObjectURL(resized);
      setSelectedFile(resized);
      setLocalPreview(preview);
    } catch (err) {
      console.error("Resize failed:", err);
      toast.error("Could not process image");
      setIsResizing(false);
      return;
    }
    setIsResizing(false);
    await runUpload(resized, preview);
  };

  const isBusy = isResizing || isUploading;

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className={avatarClassName}>
        <AvatarImage src={displayPreview ?? undefined} alt={name ?? "Profile"} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isBusy}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
      >
        {isResizing ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Processing…
          </>
        ) : isUploading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Camera className="mr-1.5 h-3.5 w-3.5" />
            {displayPreview ? "Change photo" : "Choose photo"}
          </>
        )}
      </Button>
    </div>
  );
});

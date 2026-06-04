"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { PutBlobResult } from "@vercel/blob";
import { resizeImage } from "@/lib/image-resize";
import { Button } from "@/components/ui/button";
import { BookOpen, Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface ChaburaImageUploadProps {
  chaburaId: string;
  initialImage: string | null;
  name: string;
  onUploaded: (url: string) => void;
}

export function ChaburaImageUpload({
  chaburaId,
  initialImage,
  name,
  onUploaded,
}: ChaburaImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const displaySrc = localPreview ?? previewUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsResizing(true);
    try {
      const resized = await resizeImage(file, 512, 0.85);
      setSelectedFile(resized);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(URL.createObjectURL(resized));
    } catch {
      toast.error("Could not process image");
    } finally {
      setIsResizing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const res = await fetch(
        `/api/avatar/chabura?chaburaId=${encodeURIComponent(chaburaId)}&filename=${encodeURIComponent(selectedFile.name)}`,
        { method: "POST", body: selectedFile },
      );
      if (!res.ok) throw new Error(res.statusText);
      const blob = (await res.json()) as PutBlobResult;
      setPreviewUrl(blob.url);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      setSelectedFile(null);
      onUploaded(blob.url);
      toast.success("Chabura picture updated");
    } catch {
      toast.error("Upload failed — try again?");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscard = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Image preview */}
      <button
        type="button"
        className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm transition-all hover:border-primary/40"
        onClick={() => !isUploading && !isResizing && inputRef.current?.click()}
        aria-label="Change chabura picture"
        disabled={isUploading || isResizing}
      >
        {displaySrc ? (
          <Image
            src={displaySrc}
            alt={name}
            fill
            className="object-cover"
            unoptimized={!!localPreview}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="size-10 text-muted-foreground/40" />
          </div>
        )}
        {/* Hover overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-6" />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading || isResizing}
      />

      {/* Action buttons — shown only when a file is selected */}
      {selectedFile ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={isUploading}
          >
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading || isResizing}
            className="bg-accent text-white hover:bg-accent/90"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 size-3.5" />
                Save photo
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isResizing}
          className="text-muted-foreground"
        >
          {isResizing ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Camera className="mr-1.5 size-3.5" />
              {previewUrl ? "Change photo" : "Add photo"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

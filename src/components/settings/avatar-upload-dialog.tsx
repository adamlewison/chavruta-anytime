"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { PutBlobResult } from "@vercel/blob";
import { resizeImage } from "@/lib/image-resize";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Loader2, Upload } from "lucide-react";

interface AvatarUploadDialogProps {
  currentImage: string | null;
  name: string | null;
}

export function AvatarUploadDialog({
  currentImage,
  name,
}: AvatarUploadDialogProps) {
  const router = useRouter();
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const finishWithUrl = async (url: string) => {
    setPreviewUrl(url);
    setSelectedFile(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    toast.success("Profile picture updated");
    await update();
    router.refresh();
    setTimeout(() => setOpen(false), 400);
  };

  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsResizing(true);
    try {
      const resized = await resizeImage(file, 512, 0.85);
      setSelectedFile(resized);
      setLocalPreview(URL.createObjectURL(resized));
    } catch (err) {
      console.error("Resize failed:", err);
      toast.error("Could not process image");
    } finally {
      setIsResizing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const response = await fetch(
        `/api/avatar/upload?filename=${encodeURIComponent(selectedFile.name)}`,
        { method: "POST", body: selectedFile },
      );
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      const blob = (await response.json()) as PutBlobResult;
      finishWithUrl(blob.url);
    } catch (err) {
      console.error("Upload threw:", err);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedFile(null);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setOpen(next);
  };

  const displayPreview = localPreview ?? previewUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative inline-flex"
          aria-label="Change profile picture"
        >
          <Avatar className="h-28 w-28">
            <AvatarImage
              src={previewUrl ?? undefined}
              alt={name ?? "Profile"}
            />
            <AvatarFallback className="text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-7 w-7" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update profile picture</DialogTitle>
          <DialogDescription>
            Select a new profile picture to upload. Supported formats: JPG, PNG,
            GIF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={displayPreview ?? undefined}
              alt={name ?? "Profile"}
            />
            <AvatarFallback className="text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {selectedFile && (
          <p className="text-center text-xs text-muted-foreground">
            {selectedFile.name} — {(selectedFile.size / 1024).toFixed(0)} KB
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isResizing}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isResizing}
            className="flex-1"
          >
            {isResizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                {selectedFile ? "Choose different" : "Choose photo"}
              </>
            )}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isResizing}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera } from "lucide-react";
import { AvatarUploadInline } from "@/components/profile/avatar-upload-inline";

interface AvatarUploadDialogProps {
  currentImage: string | null;
  name: string | null;
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

export function AvatarUploadDialog({
  currentImage,
  name,
}: AvatarUploadDialogProps) {
  const router = useRouter();
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage);

  const initials = getInitials(name);

  const handleUpload = async (url: string) => {
    setPreviewUrl(url);
    await update();
    router.refresh();
    setTimeout(() => setOpen(false), 400);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
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
        <AvatarUploadInline
          key={open ? "open" : "closed"}
          currentImage={previewUrl}
          name={name}
          onUpload={handleUpload}
        />
      </DialogContent>
    </Dialog>
  );
}

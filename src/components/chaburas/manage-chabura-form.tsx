"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateChabura } from "@/server/actions/chaburas";
import { ChaburaImageUpload } from "@/components/chaburas/chabura-image-upload";

interface ManageChaburaFormProps {
  chaburaId: string;
  slug: string;
  initialName: string;
  initialDescription: string;
  initialImage: string | null;
  initialIsPublic: boolean;
}

export function ManageChaburaForm({
  chaburaId,
  slug,
  initialName,
  initialDescription,
  initialImage,
  initialIsPublic,
}: ManageChaburaFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Chabura name is required");
      return;
    }
    setSaving(true);
    const result = await updateChabura(chaburaId, {
      name: name.trim(),
      description: description.trim(),
      isPublic,
    });
    if (result.success) {
      toast.success("Chabura updated");
      router.push(`/chaburas/${slug}`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Couldn't update chabura — try again?");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <ChaburaImageUpload
          chaburaId={chaburaId}
          initialImage={initialImage}
          name={initialName}
          onUploaded={() => router.refresh()}
        />
        <p className="text-xs text-muted-foreground">Tap to change photo</p>
      </div>

      {/* Fields */}
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Chabura name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="What does your chabura study?"
            rows={4}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is-public" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Public
            </Label>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "Anyone can find and join this chabura" : "Only invited members can join"}
            </p>
          </div>
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-accent text-white hover:bg-accent/90"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving…
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateChabura } from "@/server/actions/chaburas";

interface ManageChaburaFormProps {
  chaburaId: string;
  slug: string;
  initialName: string;
  initialDescription: string;
}

export function ManageChaburaForm({
  chaburaId,
  slug,
  initialName,
  initialDescription,
}: ManageChaburaFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
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
    <form onSubmit={handleSave} className="space-y-5">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Chabura name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="What does your chabura study?"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
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

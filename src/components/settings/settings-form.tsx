"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsFormProps {
  initialData: {
    name: string;
    bio: string;
    country: string;
    timezone: string;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);
  const [isPending, startTransition] = useTransition();

  const isDirty = name !== initialData.name || bio !== initialData.bio;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({ name, bio });
      if (result.success) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself"
            rows={3}
          />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Country</Label>
            <p className="text-sm font-medium text-foreground">
              {initialData.country || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Timezone</Label>
            <p className="text-sm font-medium text-foreground">
              {initialData.timezone || "—"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Country and timezone are set during onboarding and can&apos;t be
          changed here.
        </p>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="w-full"
        >
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

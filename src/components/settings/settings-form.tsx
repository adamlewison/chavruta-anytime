"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface SettingsFormProps {
  initialData: {
    name: string;
    bio: string;
    profileVisible: boolean;
    gender: string | null;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [name, setName] = useState(initialData.name);
  const [bio, setBio] = useState(initialData.bio);
  const [profileVisible, setProfileVisible] = useState(initialData.profileVisible);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    name !== initialData.name ||
    bio !== initialData.bio ||
    profileVisible !== initialData.profileVisible;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfile({ name, bio, profileVisible });
      if (result.success) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    });
  };

  return (
    <section className="space-y-5">
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <Label htmlFor="name" className="pt-2">
            Display name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <Label htmlFor="bio" className="pt-2">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself"
            rows={4}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-start">
          <Label className="pt-2">Gender</Label>
          <div className="flex flex-col gap-1">
            <p className="text-sm capitalize text-foreground">
              {initialData.gender ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Set during onboarding and cannot be changed here.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-center">
          <Label htmlFor="profile-visible">Profile publicly visible</Label>
          <div className="flex flex-col gap-1">
            <Switch
              id="profile-visible"
              checked={profileVisible}
              onCheckedChange={setProfileVisible}
            />
            <p className="text-xs text-muted-foreground">
              {profileVisible
                ? "Other users can find and view your profile."
                : "Your profile is hidden from search and other users."}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!isDirty || isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </section>
  );
}

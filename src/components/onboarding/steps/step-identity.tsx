"use client";

import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "../onboarding-wizard";

interface StepIdentityProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  const bioLength = data.bio.length;
  const bioOverLimit = bioLength > 280;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Tell us about yourself
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This helps your chavruta partners get to know you
        </p>
      </div>

      {/* Profile picture */}
      <div className="flex flex-col items-center gap-2">
        {data.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt={data.name || "Profile"}
            referrerPolicy="no-referrer"
            className="size-24 rounded-full object-cover ring-2 ring-ember/30"
          />
        ) : (
          <div
            className={cn(
              "size-24 rounded-full border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-1",
              "text-muted-foreground",
            )}
          >
            <Camera className="size-6" />
            <span className="text-[10px]">No photo yet</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {data.image
            ? "You can change this later in settings"
            : "You can add one later in settings"}
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Your full name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={100}
          autoComplete="name"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="A few words about you and what you like to learn..."
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          maxLength={300}
          rows={3}
          className="resize-none"
        />
        <div
          className={cn(
            "text-right text-xs",
            bioOverLimit ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {bioLength}/280
        </div>
      </div>
    </div>
  );
}

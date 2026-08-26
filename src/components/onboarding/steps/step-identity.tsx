"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AvatarUploadInline,
  type AvatarUploadInlineHandle,
} from "@/components/profile/avatar-upload-inline";
import type { OnboardingData } from "@/components/onboarding/types";

interface StepIdentityProps {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export interface StepIdentityHandle {
  prepareForNext: () => Promise<void>;
}

export const StepIdentity = forwardRef<StepIdentityHandle, StepIdentityProps>(
  function StepIdentity({ data, onChange }, ref) {
    const avatarRef = useRef<AvatarUploadInlineHandle>(null);

    useImperativeHandle(ref, () => ({
      prepareForNext: async () => {
        await avatarRef.current?.uploadIfPending();
      },
    }));

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
        <div className="flex flex-col items-center gap-1">
          <AvatarUploadInline
            ref={avatarRef}
            currentImage={data.image}
            name={data.name}
            onUpload={(url) => onChange({ image: url })}
          />
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
            placeholder="A few words about you..."
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
  },
);

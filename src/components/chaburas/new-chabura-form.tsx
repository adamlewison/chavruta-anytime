"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createChabura } from "@/server/actions/chaburas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SubjectOption {
  id: string;
  name: string;
}

interface NewChaburaFormProps {
  subjects: SubjectOption[];
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type SlugStatus = "idle" | "available" | "taken";

export function NewChaburaForm({ subjects }: NewChaburaFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slug = toSlug(name);
  const slugValid = slug.length >= 3;
  const isChecking = slugValid && slug !== resolvedSlug;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!slugValid) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chaburas/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      } finally {
        setResolvedSlug(slug);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, slugValid]);

  const canSubmit =
    name.trim().length >= 3 && slugValid && !isChecking && slugStatus === "available" && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await createChabura({
        name: name.trim(),
        description: description.trim(),
        slug,
        subjectId: subjectId || undefined,
        isPublic,
      });
      if (result.success && result.slug) {
        toast.success("Chabura created");
        router.push(`/chaburas/${result.slug}`);
      } else {
        toast.error(result.error || "Failed to create chabura");
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Daf Yomi"
              required
              minLength={3}
              maxLength={80}
            />

            {slug.length >= 3 && (
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground shrink-0">chaburas/</span>
                <span className="font-mono flex-1">{slug}</span>
                {isChecking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}
                {!isChecking && slugStatus === "available" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
                {!isChecking && slugStatus === "taken" && (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
              </div>
            )}
            {slugValid && !isChecking && slugStatus === "taken" && (
              <p className="text-sm text-destructive">That name is already taken.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this chabura learn? What's the pace and format?"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="public">Public</Label>
              <p className="text-sm text-muted-foreground">
                Anyone can discover and join this chabura
              </p>
            </div>
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(v) => setIsPublic(v === true)}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-white hover:bg-accent/90"
            size="lg"
            disabled={!canSubmit}
          >
            {isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

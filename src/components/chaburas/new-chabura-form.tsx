"use client";

import { useState, useTransition } from "react";
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

interface SubjectOption {
  id: string;
  name: string;
}

interface NewChaburaFormProps {
  subjects: SubjectOption[];
}

export function NewChaburaForm({ subjects }: NewChaburaFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPending, startTransition] = useTransition();

  const canSubmit = name.trim().length >= 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please enter a name (at least 3 characters)");
      return;
    }
    startTransition(async () => {
      const result = await createChabura({
        name: name.trim(),
        description: description.trim(),
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
            disabled={!canSubmit || isPending}
          >
            {isPending ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

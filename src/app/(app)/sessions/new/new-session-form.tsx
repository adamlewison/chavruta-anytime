"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RRuleBuilder } from "@/components/sessions/rrule-builder";
import { createSession } from "@/server/actions/sessions";
import { toast } from "sonner";
import { Loader2, Globe } from "lucide-react";

interface Subject {
  slug: string;
  name: string;
}

interface NewSessionFormProps {
  subjects: Subject[];
  userTimezone: string;
}

export function NewSessionForm({ subjects, userTimezone }: NewSessionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerConnectionId = searchParams.get("with") ?? undefined;
  const chaburaId = searchParams.get("for") ?? undefined;
  const defaultType =
    (searchParams.get("type") as "chavruta" | "chabura") ?? "chavruta";

  const [type, setType] = useState<"chavruta" | "chabura">(defaultType);
  const [title, setTitle] = useState("");
  const [subjectSlug, setSubjectSlug] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [schedule, setSchedule] = useState<{
    rrule: string;
    dtstart: string;
    timezone: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Derived timezone — use RRULE builder's TZ if set, else user's saved TZ
  const effectiveTz = schedule?.timezone ?? userTimezone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectSlug) {
      toast.error("Please select a subject");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!schedule) {
      toast.error("Please set a schedule");
      return;
    }

    setSubmitting(true);
    const result = await createSession({
      type,
      chavrutaPairId: type === "chavruta" ? partnerConnectionId : undefined,
      chaburaId: type === "chabura" ? chaburaId : undefined,
      subjectId: subjectSlug,
      title: title.trim(),
      rrule: schedule.rrule,
      dtstart: schedule.dtstart,
      durationMin,
      timezone: schedule.timezone,
    });

    if (result.success && result.sessionId) {
      toast.success("Session created!");
      router.push(`/sessions/${result.sessionId}`);
    } else {
      toast.error(result.error ?? "Failed to create session — try again?");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Create Session
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
        <div className="flex rounded-xl border overflow-hidden">
          {(["chavruta", "chabura"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                type === t
                  ? "bg-foreground text-white"
                  : "bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 space-y-5">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subjectSlug} onValueChange={setSubjectSlug}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Bava Metzia Chapter 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex gap-2 flex-wrap">
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMin(mins)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      durationMin === mins
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/50"
                    }`}
                  >
                    {mins < 60
                      ? `${mins}m`
                      : mins === 60
                        ? "1h"
                        : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timezone indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 shrink-0" />
          <span>
            Your timezone:{" "}
            <span className="font-medium text-foreground">{effectiveTz}</span>
          </span>
          <Badge variant="outline" asChild className="ml-auto">
            <Link href="/settings">Change</Link>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          Both of you will see this in your own timezone.
        </p>

        {/* Schedule / RRULE builder */}
        <div className="space-y-2">
          <Label>Schedule</Label>
          <RRuleBuilder
            value={schedule}
            onChange={setSchedule}
            timezone={effectiveTz}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-accent text-white hover:bg-accent/90"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating…
            </>
          ) : (
            "Create Session"
          )}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Loader2, ArrowLeft } from "lucide-react";
import type { SessionContext } from "./page";

interface Subject {
  slug: string;
  name: string;
}

interface NewSessionFormProps {
  subjects: Subject[];
  userTimezone: string;
  sessionContext: SessionContext | null;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NewSessionForm({ subjects, userTimezone, sessionContext }: NewSessionFormProps) {
  const router = useRouter();

  const defaultType: "chavruta" | "chabura" = sessionContext?.type ?? "chavruta";
  const contextLocked = !!sessionContext;

  const [type, setType] = useState<"chavruta" | "chabura">(defaultType);
  const [title, setTitle] = useState("");
  const [subjectSlug, setSubjectSlug] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [durationMins, setDurationMins] = useState(0);
  const [schedule, setSchedule] = useState<{
    rrule: string;
    dtstart: string;
    timezone: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveTz = schedule?.timezone ?? userTimezone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectSlug) { toast.error("Please select a subject"); return; }
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!schedule) { toast.error("Please set a schedule"); return; }

    setSubmitting(true);
    const result = await createSession({
      type,
      chavrutaPairId:
        type === "chavruta" && sessionContext?.type === "chavruta"
          ? sessionContext.connectionId
          : undefined,
      chaburaId:
        type === "chabura" && sessionContext?.type === "chabura"
          ? sessionContext.id
          : undefined,
      subjectId: subjectSlug,
      title: title.trim(),
      rrule: schedule.rrule,
      dtstart: schedule.dtstart,
      durationMin: durationHours * 60 + durationMins,
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

  const backHref =
    sessionContext?.type === "chabura"
      ? `/chaburas/${sessionContext.slug}`
      : sessionContext?.type === "chavruta"
        ? `/profile/${sessionContext.partnerId}`
        : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight">New session</h1>
        {sessionContext && (
          <p className="text-sm text-muted-foreground capitalize">{sessionContext.type}</p>
        )}
      </div>

      {/* Context identity */}
      {sessionContext && backHref && (
        <Link href={backHref} className="flex items-center gap-3 group">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={sessionContext.image ?? undefined} alt={sessionContext.name} />
            <AvatarFallback>{initialsOf(sessionContext.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground group-hover:underline">
            {sessionContext.name}
          </span>
        </Link>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* Type toggle — only when no context */}
        {!contextLocked && (
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["chavruta", "chabura"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize border transition-colors ${
                    type === t
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select value={subjectSlug} onValueChange={setSubjectSlug}>
            <SelectTrigger id="subject" className="border-0 border-b rounded-none px-0 focus:ring-0 shadow-none">
              <SelectValue placeholder="Choose a subject…" />
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
            className="border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={8}
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(0, Number(e.target.value)))}
                className="w-16 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none text-center"
              />
              <span className="text-sm text-muted-foreground">hr</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={59}
                value={durationMins}
                onChange={(e) => setDurationMins(Math.min(59, Math.max(0, Number(e.target.value))))}
                className="w-16 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none text-center"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label>Schedule</Label>
          <p className="text-xs text-muted-foreground">
            Times shown in <span className="font-medium text-foreground">{effectiveTz}</span>
          </p>
          <RRuleBuilder value={schedule} onChange={setSchedule} timezone={effectiveTz} />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-accent text-white hover:bg-accent/90 mt-2"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating…
            </>
          ) : (
            "Create session"
          )}
        </Button>
      </form>
    </div>
  );
}

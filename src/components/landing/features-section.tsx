"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Users, Video, Brain, CalendarClock, MonitorPlay, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Scroll-triggered fade-in wrapper ──────────────────────── */
function FadeInUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── How It Works ──────────────────────────────────────────── */
const steps = [
  {
    icon: BookOpen,
    title: "Sign Up & Tell Us What You Learn",
    description:
      "Create your profile in minutes. Share your interests, level, preferred topics, and when you like to learn.",
  },
  {
    icon: Users,
    title: "Get Matched with Compatible Partners",
    description:
      "Our matching engine considers subject, skill level, language, timezone, and schedule to find your ideal chavruta.",
  },
  {
    icon: Video,
    title: "Start Learning Together",
    description:
      "Jump into a video session with one tap. No downloads, no setup — just open your sefer and go.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-muted px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <FadeInUp>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Learning made simple
          </h2>
        </FadeInUp>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <FadeInUp key={step.title} delay={i * 0.12}>
              <div className="relative flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                  {i + 1}
                </div>
                <div className="mb-4 mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <step.icon className="size-6 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: "Smart Matching",
    description:
      "Matched by subject, level, language, and timezone so every session is productive from the first page.",
  },
  {
    icon: CalendarClock,
    title: "Flexible Scheduling",
    description:
      "Set recurring sessions that work around your life. Morning, night, Shabbos prep — you choose.",
  },
  {
    icon: MonitorPlay,
    title: "Video Built In",
    description:
      "One-tap video meetings powered by WebRTC. No accounts to create, no apps to install.",
  },
  {
    icon: BookMarked,
    title: "Chaburas",
    description:
      "Join or create learning groups for any topic. From daf yomi to halacha l'maaseh, learn b'rabbim.",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-background px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <FadeInUp>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-accent">
            Why ChavrutaAnytime?
          </p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to learn together
          </h2>
        </FadeInUp>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map((feat, i) => (
            <FadeInUp key={feat.title} delay={i * 0.1}>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feat.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feat.description}
                </p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ────────────────────────────────────────────── */
export function CtaSection() {
  return (
    <section className="bg-primary px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <FadeInUp>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Every chavruta starts somewhere.
          </h2>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Join ChavrutaAnytime and find your learning partner today.
          </p>
        </FadeInUp>
        <FadeInUp delay={0.2}>
          <div className="mt-10">
            <Button
              size="lg"
              className="h-12 rounded-lg bg-accent px-8 text-base font-semibold text-white shadow-sm hover:bg-accent/90"
              asChild
            >
              <Link href="/sign-in">Get Started — It&apos;s Free</Link>
            </Button>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}

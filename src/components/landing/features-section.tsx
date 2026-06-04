"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Video,
  Brain,
  CalendarClock,
  MonitorPlay,
  BookMarked,
  Globe,
  Shield,
  ArrowRight,
} from "lucide-react";
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
    number: "01",
    title: "Create Your Profile",
    description:
      "Tell us what you learn, your level, preferred language, and when you're available. Takes less than 2 minutes.",
  },
  {
    icon: Users,
    number: "02",
    title: "Get Matched Instantly",
    description:
      "Our algorithm considers subject, skill level, language, timezone, and availability to find your ideal chavruta.",
  },
  {
    icon: Video,
    number: "03",
    title: "Start Learning Together",
    description:
      "Jump into a video session with one tap. No downloads, no setup — just open your sefer and start.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-muted/50 px-6 py-28 sm:px-10">
      {/* Subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.02] select-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <FadeInUp>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-accent">
            How It Works
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Three steps to your next seder
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground sm:text-lg">
            From sign-up to your first session in minutes, not days.
          </p>
        </FadeInUp>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <FadeInUp key={step.title} delay={i * 0.15}>
              <div className="group relative flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1">
                {/* Step number */}
                <span className="mb-4 text-4xl font-black text-primary/10 transition-colors group-hover:text-primary/20">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 transition-all duration-300 group-hover:scale-110 group-hover:from-accent/20 group-hover:to-accent/10">
                  <step.icon className="size-7 text-accent" />
                </div>

                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {/* Connector line (visible on desktop between cards) */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 translate-x-full bg-gradient-to-r from-border to-transparent sm:block"
                  />
                )}
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
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-500",
  },
  {
    icon: CalendarClock,
    title: "Flexible Scheduling",
    description:
      "Set recurring sessions that work around your life. Morning, night, Shabbos prep — you choose.",
    gradient: "from-accent/10 to-amber-500/5",
    iconColor: "text-accent",
  },
  {
    icon: MonitorPlay,
    title: "Built-In Video",
    description:
      "One-tap video meetings powered by WebRTC. No accounts to create, no apps to install.",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconColor: "text-emerald-500",
  },
  {
    icon: BookMarked,
    title: "Chaburas",
    description:
      "Join or create learning groups for any topic. From daf yomi to halacha l'maaseh, learn b'rabbim.",
    gradient: "from-violet-500/10 to-violet-600/5",
    iconColor: "text-violet-500",
  },
  {
    icon: Globe,
    title: "Global Community",
    description:
      "Connect with learners across 50+ countries. Find partners in every timezone, for every subject.",
    gradient: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description:
      "Your data stays yours. No ads, no tracking, no selling your information. Just Torah learning.",
    gradient: "from-rose-500/10 to-rose-600/5",
    iconColor: "text-rose-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-background px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <FadeInUp>
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Everything you need to learn together
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground sm:text-lg">
            Built for serious learners who want a seamless experience without the friction.
          </p>
        </FadeInUp>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <FadeInUp key={feat.title} delay={i * 0.08}>
              <div className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.gradient} transition-transform duration-300 group-hover:scale-110`}>
                  <feat.icon className={`size-6 ${feat.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {feat.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
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
    <section className="relative overflow-hidden px-6 py-28 sm:px-10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#2d6ba3]" />
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(246,146,64,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <FadeInUp>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Every chavruta starts somewhere.
          </h2>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <p className="mt-5 text-lg leading-relaxed text-white/80 sm:text-xl">
            Don&apos;t wait for the perfect time. Join thousands of learners who found
            their partner on ChavrutaAnytime.
          </p>
        </FadeInUp>
        <FadeInUp delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="group h-13 rounded-xl bg-white px-10 text-base font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:scale-[1.02] hover:shadow-xl"
              asChild
            >
              <Link href="/sign-in">
                Get Started Free
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.3}>
          <p className="mt-6 text-sm text-white/60">
            Free forever. No credit card required.
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}

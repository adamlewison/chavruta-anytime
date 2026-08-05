"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import logoNameSrc from "~public/ca-logo-name.png";

/* ── Floating orb background ─────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Primary blue orb */}
      <motion.div
        className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #3D85C6 0%, transparent 70%)" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Accent orange orb */}
      <motion.div
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #F69240 0%, transparent 70%)" }}
        animate={{ x: [0, -20, 30, 0], y: [0, 30, -20, 0], scale: [1, 0.95, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Small floating accent */}
      <motion.div
        className="absolute top-1/3 left-1/4 h-[200px] w-[200px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #3D85C6 0%, transparent 70%)" }}
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(61,133,198,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(61,133,198,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      <FloatingOrbs />

      {/* Top nav */}
      <header className="relative z-10 flex w-full items-center justify-between border-b border-border/50 bg-background/60 backdrop-blur-xl px-6 py-4 sm:px-10">
        <Link href="/" aria-label="Home">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="#how-it-works">How It Works</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="#features">Features</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/5"
            asChild
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-12 text-center">
        {/* Badge */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Find your learning partner today
        </motion.div>

        {/* Logo wordmark */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          <Image
            src={logoNameSrc}
            alt="ChavrutaAnytime"
            height={80}
            width={Math.round((logoNameSrc.width / logoNameSrc.height) * 80)}
            className="h-16 w-auto sm:h-20 md:h-24"
            priority
          />
        </motion.div>

        {/* Tagline */}
        <motion.h1
          className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          Your{" "}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            chavruta
          </span>{" "}
          is waiting.{" "}
          <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
            Anytime
          </span>
          , anywhere.
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          Connect with Torah learning partners across the globe. Whether it&rsquo;s
          Gemara at midnight or Chumash at dawn&nbsp;&mdash; find your perfect match
          and start learning together.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
        >
          <Button
            size="lg"
            className="group relative h-13 overflow-hidden rounded-xl bg-accent px-10 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.02]"
            asChild
          >
            <Link href="/sign-in">
              <span className="relative z-10">Get Started Free</span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-accent via-accent/90 to-[#e87d2a] opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-13 rounded-xl border-border px-10 text-base font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
            asChild
          >
            <Link href="/chaburas">Browse Chaburas</Link>
          </Button>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-muted-foreground/30 p-1">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}

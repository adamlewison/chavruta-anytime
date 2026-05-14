"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 60% 20%, rgba(61,133,198,0.08) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(246,146,64,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Top nav */}
      <header className="relative z-10 flex w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 sm:px-10">
        <Link href="/" aria-label="Home">
          <Logo size="sm" />
        </Link>
        <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <motion.div
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          ✨ Find your learning partner today
        </motion.div>

        <motion.h1
          className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        >
          Find your{" "}
          <span className="text-primary">chavruta</span>
          {", "}
          <span className="text-accent">anytime</span>
          {", anywhere."}
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
        >
          Connect with Torah learning partners across the globe. Whether it&rsquo;s
          Gemara at midnight or Chumash at dawn&nbsp;&mdash; your chavruta is waiting.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <Button
            size="lg"
            className="h-12 rounded-lg bg-accent px-8 text-base font-semibold text-white shadow-sm hover:bg-accent/90 transition-all"
            asChild
          >
            <Link href="/sign-in">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-lg px-8 text-base font-medium border-primary text-primary hover:bg-primary/5"
            asChild
          >
            <Link href="/chaburas">Browse Chaburas</Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          className="mt-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Join thousands of learners worldwide
        </motion.p>
      </div>
    </section>
  );
}

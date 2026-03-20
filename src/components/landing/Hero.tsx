import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ParticleCanvas = lazy(() => import("./ParticleCanvas"));

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" as const, delay },
});

const badges = [
  { emoji: "🔒", label: "SEC Verified" },
  { emoji: "⚡", label: "Wolfram|Alpha" },
  { emoji: "🎙️", label: "Voice + Chat" },
];

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Three.js or gradient bg */}
      {!isMobile ? (
        <Suspense fallback={null}>
          <ParticleCanvas />
        </Suspense>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(0,214,143,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(224,85,85,0.08) 0%, transparent 50%), hsl(216,45%,5%)",
          }}
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-background/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-20">
        <motion.div {...fadeIn(0.2)} className="inline-block mb-6">
          <span
            className="text-primary text-xs font-medium tracking-wider px-4 py-1.5 rounded-full"
            style={{
              border: "1px solid rgba(0,200,255,0.3)",
              background: "rgba(0,200,255,0.08)",
            }}
          >
            [ AI Financial Research ]
          </span>
        </motion.div>

        <motion.h1
          {...fadeIn(0.4)}
          className="font-display font-bold text-foreground text-[40px] md:text-[72px] leading-[1.05] mb-6"
        >
          Find the Inflection Point.
        </motion.h1>

        <motion.p
          {...fadeIn(0.6)}
          className="text-muted-foreground text-base md:text-xl max-w-[600px] mx-auto mb-10"
        >
          Research any Fortune 500 in seconds. Voice or type — verified by SEC filings and
          Wolfram|Alpha.
        </motion.p>

        <motion.div {...fadeIn(0.8)} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <motion.a
            href="#cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full text-sm"
          >
            Start Demo
          </motion.a>
          <motion.a
            href="#dashboard-preview"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="border border-primary text-primary font-semibold px-8 py-3 rounded-full text-sm"
          >
            Watch It Work
          </motion.a>
        </motion.div>

        <motion.div
          {...fadeIn(1.0)}
          className="flex flex-wrap justify-center gap-3"
        >
          {badges.map((b, i) => (
            <motion.span
              key={b.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.5 }}
              className="glass text-xs text-muted-foreground px-4 py-2 rounded-full border border-border"
            >
              {b.emoji} {b.label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-primary animate-bounce-slow" />
      </motion.div>
    </section>
  );
};

export default Hero;

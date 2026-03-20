import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Player } from "@lottiefiles/react-lottie-player";

const steps = [
  {
    lottie: "https://lottie.host/1e8ce44d-0e5f-4f47-99e8-e29c4e1e305e/bWxhN0dHHQ.json",
    title: "Speak or Type",
    desc: "Ask about any Fortune 500 in plain English",
    accent: "hsl(193,100%,50%)",
  },
  {
    lottie: "https://lottie.host/f3e7c5aa-20fd-437f-97c5-3c3e30dcbe68/XNELXsaI8f.json",
    title: "AI Verifies",
    desc: "SEC filings + Wolfram|Alpha check every single claim",
    accent: "hsl(157,100%,42%)",
  },
  {
    lottie: "https://lottie.host/04476a84-4e7a-483a-902c-53f0c4027e13/f6K8vmQ9sM.json",
    title: "Get Answers",
    desc: "Cited answer + interactive chart in under 3 seconds",
    accent: "hsl(193,100%,50%)",
  },
];

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-primary text-xs tracking-[0.2em] uppercase mb-4">How It Works</p>
          <h2 className="font-display font-bold text-foreground text-3xl md:text-[48px] leading-tight">
            Three simple steps
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-10">
          {/* Connecting dashed line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0 origin-left"
            style={{ borderTop: "2px dashed rgba(0,200,255,0.3)" }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
              className="text-center relative z-10"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl glass border border-border flex items-center justify-center">
                {inView && (
                  <Player autoplay loop src={step.lottie} style={{ width: 40, height: 40 }} />
                )}
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

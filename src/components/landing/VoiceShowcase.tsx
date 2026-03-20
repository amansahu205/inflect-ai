import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const VoiceShowcase = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative mx-auto mb-8"
          style={{ maxWidth: 400 }}
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 80px rgba(240,165,0,0.3)", marginBottom: -40 }}
          >
            <video
              autoPlay muted loop playsInline
              className="w-full block"
              style={{ marginBottom: -40 }}
            >
              <source src="/videos/voice_button.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: "#F0A500" }}
        >
          Inflect Listens
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-muted-foreground"
        >
          Click the mic. Ask anything about a stock.
        </motion.p>
      </div>
    </section>
  );
};

export default VoiceShowcase;

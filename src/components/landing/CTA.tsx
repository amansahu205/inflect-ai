import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const CTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section
      id="cta"
      ref={ref}
      className="relative py-32 px-6 overflow-hidden"
    >
      <video
        autoPlay muted loop playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hero_bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(8,12,20,0.88)" }} />

      <div className="relative z-[2] max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="font-display font-bold text-foreground text-3xl md:text-[56px] leading-tight mb-6"
        >
          Ready to find your<br />inflection point?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-muted-foreground text-lg mb-10"
        >
          Join researchers and traders using AI-verified financial intelligence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.a
            href="#"
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,200,255,0.4)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-block bg-primary text-primary-foreground font-semibold px-10 py-4 rounded-full text-base"
          >
            Start for Free
          </motion.a>
          <p className="text-muted-foreground text-xs mt-5">
            No credit card required · Free demo included
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;

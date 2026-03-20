import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const CTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, rootMargin: "-100px" });

  return (
    <section
      id="cta"
      ref={ref}
      className="py-32 px-6"
      style={{ background: "linear-gradient(180deg, hsl(216,45%,5%) 0%, hsl(220,50%,8%) 100%)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
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

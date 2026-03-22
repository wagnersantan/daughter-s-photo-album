import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-[60svh] overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-4"
      >
        <span className="text-6xl">👶</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          Álbum da Sophia
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Um cantinho especial para guardar cada momento da nossa princesa
        </p>
      </motion.div>
    </section>
  );
}

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-[70svh] overflow-hidden px-4 py-12">
      {/* Bolinhas decorativas vivas */}
      <div className="absolute top-10 left-8 w-20 h-20 rounded-full bg-bubblegum/40 blur-xl animate-float" />
      <div className="absolute top-20 right-12 w-28 h-28 rounded-full bg-sunshine/40 blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-16 left-1/4 w-24 h-24 rounded-full bg-lavender/40 blur-xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-10 right-1/4 w-16 h-16 rounded-full bg-mint/40 blur-xl animate-float" style={{ animationDelay: '0.5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative text-center space-y-6 z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
          className="inline-block"
        >
          <span className="text-7xl md:text-8xl drop-shadow-lg">🌸</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
          <span className="bg-gradient-to-r from-primary via-coral to-bubblegum bg-clip-text text-transparent">
            Sophia
          </span>
        </h1>

        <p className="text-xl md:text-2xl font-display text-foreground/80 italic">
          ✨ nosso pedacinho de luz ✨
        </p>

        <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Um cantinho cheio de cor, risadas e amor para guardar cada
          descoberta da nossa princesa
        </p>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="pt-4 text-2xl"
        >
          ⬇️
        </motion.div>
      </motion.div>
    </section>
  );
}

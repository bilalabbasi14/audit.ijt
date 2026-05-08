import React from 'react';
import { motion } from 'motion/react';

export const AuthBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, oklch(0.6 0.2 260) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, var(--primary) 0%, transparent 40%)
          `
        }}
      />
      
      {/* Animated blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
          x: [0, -50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]"
      />

      {/* Noise / Grid pattern overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
    </div>
  );
};

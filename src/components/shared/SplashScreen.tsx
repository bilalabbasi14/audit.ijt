import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to finish
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const name = "audit.ijt";
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Subtle animated background shapes */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"
          />
          
          {/* Floating creative particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 - 50, 
                y: Math.random() * 100 - 50,
                opacity: 0 
              }}
              animate={{ 
                x: [null, Math.random() * 200 - 100],
                y: [null, Math.random() * 200 - 100],
                opacity: [0, 0.3, 0]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-2 h-2 rounded-full bg-primary"
            />
          ))}
          
          <div className="relative flex flex-col items-center">
            {/* Staggered Text Animation with enhanced effects */}
            <div className="flex">
              {name.split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20, rotateX: -90, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + index * 0.08,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                  className={`text-5xl md:text-7xl font-black italic tracking-tighter ${
                    char === "." || index > name.indexOf(".") 
                      ? "text-muted-foreground/40" 
                      : "text-primary"
                  }`}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Decorative underline */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2, ease: "circOut" }}
              className="mt-4 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="absolute bottom-12"
          >
            <div className="flex items-center gap-2 text-muted-foreground/40 text-sm font-medium tracking-widest uppercase">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-3 w-3 border border-current border-t-transparent rounded-full"
              />
              Initializing Audit
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

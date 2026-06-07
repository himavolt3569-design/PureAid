"use client";

import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

interface RevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export const Reveal = ({ children, width = "100%", delay = 0, direction = "up" }: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  const yOffset = direction === "up" ? 75 : direction === "down" ? -75 : 0;
  const xOffset = direction === "left" ? 75 : direction === "right" ? -75 : 0;

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: yOffset, x: xOffset },
          visible: { opacity: 1, y: 0, x: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: 0.8, delay: delay, ease: [0.17, 0.55, 0.55, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export const ParallaxBanner = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden bg-surface-container-low group">
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-[130%] object-cover object-center group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
        initial={{ y: "-15%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: false }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

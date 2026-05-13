'use client';

import React from 'react';
import { useScrollReveal } from '@/lib/use-scroll-reveal';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
  as?: 'div' | 'section' | 'article' | 'aside' | 'main' | 'span' | 'p';
}

/**
 * Wrapper component qui ajoute une animation fade-in au scroll
 * Usage: <ScrollReveal>...</ScrollReveal>
 */
export default function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0,
  as: Component = 'div'
}: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <Component 
      ref={ref as unknown as React.RefObject<HTMLDivElement>} 
      className={`${className} ${delay > 0 ? `scroll-reveal-delay-${delay}` : ''}`}
    >
      {children}
    </Component>
  );
}

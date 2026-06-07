'use client';

import { useEffect } from 'react';

/**
 * Composant qui ajoute automatiquement les animations de scroll
 * à toutes les sections principales de la page
 */
export default function ScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px',
      }
    );

    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      // Skip index 0 (hero) — it manages its own reveal animation
      if (index === 0) return;
      if (index <= 3) {
        section.classList.add(`scroll-reveal-delay-${Math.min(index, 3)}`);
      }
      section.classList.add('scroll-reveal-pending');
      observer.observe(section);
    });

    const cards = document.querySelectorAll('.product-card, .collection-card');
    cards.forEach((card, index) => {
      const delay = Math.min(Math.floor(index / 4), 3);
      if (delay > 0) {
        card.classList.add(`scroll-reveal-delay-${delay}`);
      }
      card.classList.add('scroll-reveal-pending');
      observer.observe(card);
    });

    return () => {
      sections.forEach((section, index) => {
        if (index === 0) return;
        observer.unobserve(section);
      });
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return null; // Ce composant ne rend rien
}

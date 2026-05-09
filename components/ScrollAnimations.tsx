'use client';

import { useEffect } from 'react';

/**
 * Composant qui ajoute automatiquement les animations de scroll
 * à toutes les sections principales de la page
 */
export default function ScrollAnimations() {
  useEffect(() => {
    // Créer l'IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal');
            // Ne trigger qu'une seule fois
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px',
      }
    );

    // Observer toutes les sections principales
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      // Ajouter un délai progressif aux sections
      if (index > 0 && index <= 3) {
        section.classList.add(`scroll-reveal-delay-${Math.min(index, 3)}`);
      }
      observer.observe(section);
    });

    // Observer les product cards et collection cards
    const cards = document.querySelectorAll('.product-card, .collection-card');
    cards.forEach((card, index) => {
      // Délai en cascade pour les cards
      const delay = Math.min(Math.floor(index / 4), 3);
      if (delay > 0) {
        card.classList.add(`scroll-reveal-delay-${delay}`);
      }
      observer.observe(card);
    });

    // Cleanup
    return () => {
      sections.forEach((section) => observer.unobserve(section));
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return null; // Ce composant ne rend rien
}

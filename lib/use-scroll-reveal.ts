'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook pour animer les éléments au scroll (fade-in from bottom)
 * Utilise l'Intersection Observer API pour détecter quand un élément entre dans le viewport
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal');
            // Option: ne déclencher qu'une seule fois
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return ref;
}

/**
 * Hook pour animer plusieurs éléments avec stagger delay
 */
export function useScrollRevealStagger<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options?: IntersectionObserverInit
) {
  const refs = useRef<(T | null)[]>([]);

  useEffect(() => {
    const elements = refs.current.filter((el): el is T => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = elements.indexOf(entry.target as T);
            entry.target.classList.add('scroll-reveal');
            if (index > 0) {
              entry.target.classList.add(`scroll-reveal-delay-${Math.min(index, 3)}`);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      elements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [count, options]);

  return (index: number) => (el: T | null) => {
    refs.current[index] = el;
  };
}

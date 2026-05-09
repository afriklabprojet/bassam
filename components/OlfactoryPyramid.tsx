'use client';

import React, { useState } from 'react';

interface OlfactoryPyramidProps {
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
}

/**
 * Pyramide olfactive interactive avec :
 * - Visualisation en pyramide 3D
 * - Hover effects sur chaque niveau
 * - Animations de révélation
 * - Design premium
 */
export default function OlfactoryPyramid({ notes }: OlfactoryPyramidProps) {
  const [activeLevel, setActiveLevel] = useState<'top' | 'heart' | 'base' | null>(null);

  const levels = [
    {
      key: 'top' as const,
      label: 'Notes de tête',
      description: 'Premières impressions fraiches et volatiles',
      icon: '🌸',
      duration: '15-30 min',
      notes: notes.top,
      color: '#F9EFE8',
      shadow: 'rgba(197,165,90,0.15)',
    },
    {
      key: 'heart' as const,
      label: 'Notes de cœur',
      description: 'Le caractère et la personnalité du parfum',
      icon: '❤️',
      duration: '2-4 heures',
      notes: notes.heart,
      color: '#EDD9C8',
      shadow: 'rgba(197,165,90,0.2)',
    },
    {
      key: 'base' as const,
      label: 'Notes de fond',
      description: 'Le sillage profond et persistant',
      icon: '🌿',
      duration: '4-8 heures',
      notes: notes.base,
      color: '#E2D9CB',
      shadow: 'rgba(197,165,90,0.25)',
    },
  ];

  return (
    <div className="olfactory-pyramid">
      {/* En-tête */}
      <div className="text-center mb-8">
        <span className="label">Composition olfactive</span>
        <h3
          className="heading-lg mt-2"
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--text-primary)',
          }}
        >
          La pyramide olfactive
        </h3>
        <p
          className="mt-2 text-sm"
          style={{ color: 'var(--text-secondary)', maxWidth: '42ch', margin: '0.75rem auto 0' }}
        >
          Découvrez les trois niveaux de senteurs qui composent ce parfum unique
        </p>
      </div>

      {/* Pyramide interactive */}
      <div className="pyramid-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="space-y-4">
          {levels.map((level, index) => {
            const isActive = activeLevel === level.key;
            const width = `${100 - index * 20}%`;

            return (
              <div
                key={level.key}
                className="pyramid-level"
                onMouseEnter={() => setActiveLevel(level.key)}
                onMouseLeave={() => setActiveLevel(null)}
                style={{
                  width,
                  margin: '0 auto',
                  borderRadius: 'var(--r-md)',
                  background: isActive ? level.color : 'var(--offwhite)',
                  border: `2px solid ${isActive ? 'var(--gold)' : 'var(--line-light)'}`,
                  padding: '1.5rem 2rem',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isActive ? 'scale(1.03) translateY(-4px)' : 'scale(1)',
                  boxShadow: isActive
                    ? `0 12px 32px ${level.shadow}, 0 0 24px rgba(197,165,90,0.1)`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header du niveau */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.5rem' }}>{level.icon}</span>
                    <div>
                      <h4
                        style={{
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {level.label}
                      </h4>
                      <p
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        {level.duration}
                      </p>
                    </div>
                  </div>

                  {/* Indicateur */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid ${isActive ? 'var(--gold)' : 'var(--line-light)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: isActive ? 'var(--gold)' : 'var(--text-pale)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    fontStyle: 'italic',
                  }}
                >
                  {level.description}
                </p>

                {/* Notes */}
                <div className="flex flex-wrap gap-2">
                  {level.notes.map((note, i) => (
                    <span
                      key={note}
                      className="note-badge"
                      style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                        padding: '5px 12px',
                        background: isActive ? 'rgba(197,165,90,0.12)' : '#fff',
                        border: `1px solid ${isActive ? 'var(--gold)' : 'var(--line-light)'}`,
                        borderRadius: 'var(--r-sm)',
                        transition: 'all 0.3s ease',
                        animation: isActive ? `fade-up 0.4s ease ${i * 0.05}s backwards` : 'none',
                      }}
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ligne de connexion visuelle */}
        <div
          style={{
            position: 'relative',
            margin: '2rem auto 0',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
            {/* Gradient line */}
            <defs>
              <linearGradient id="pyramidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 200 0 L 200 60"
              stroke="url(#pyramidGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
          </svg>

          <div
            style={{
              display: 'inline-block',
              background: 'var(--offwhite)',
              border: '1px solid var(--line-light)',
              borderRadius: 'var(--r-md)',
              padding: '8px 16px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '-30px',
            }}
          >
            Évolution du parfum
          </div>
        </div>
      </div>
    </div>
  );
}

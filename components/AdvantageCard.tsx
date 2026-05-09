'use client';

import React from 'react';

interface AdvantageCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function AdvantageCard({ icon, title, description }: AdvantageCardProps) {
  return (
    <div className="flex flex-col items-center text-center group">
      {/* Gold icon ring */}
      <div
        style={{
          width: '56px',
          height: '56px',
          border: '1px solid var(--gold)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
          fontSize: '1.375rem',
          marginBottom: '1.25rem',
          transition: 'background 0.25s',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'var(--gold-muted)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="heading-md mb-3"
        style={{ fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '0.01em' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          fontWeight: 300,
          maxWidth: '22ch',
        }}
      >
        {description}
      </p>
    </div>
  );
}

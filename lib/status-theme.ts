/** Shared semantic status colors for admin severity/status badges (stock alerts, refunds, maintenance, barcodes...). */
export type SemanticStatus = 'danger' | 'warning' | 'success' | 'info' | 'neutral' | 'purple';

export const SEMANTIC_STATUS_COLOR: Record<SemanticStatus, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  success: 'var(--success)',
  info: 'var(--info)',
  neutral: 'var(--neutral)',
  purple: 'var(--purple)',
};

export const SEMANTIC_STATUS_BG: Record<SemanticStatus, string> = {
  danger: 'rgba(239,68,68,0.12)',
  warning: 'rgba(245,158,11,0.12)',
  success: 'rgba(16,185,129,0.12)',
  info: 'rgba(59,130,246,0.12)',
  neutral: 'rgba(107,114,128,0.12)',
  purple: 'rgba(139,92,246,0.12)',
};

export function getSemanticStatusStyle(status: SemanticStatus): { bg: string; color: string } {
  return { bg: SEMANTIC_STATUS_BG[status], color: SEMANTIC_STATUS_COLOR[status] };
}

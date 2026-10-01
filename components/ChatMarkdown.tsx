import React from 'react';

/**
 * Minimal, dependency-free markdown renderer for assistant replies: paragraphs,
 * bullet/numbered lists, **bold**, links and simple tables. Output is built from
 * React elements only (no HTML injection), and only http(s) links are linkified.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+)/g;

function Link({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  const sameSite = typeof window !== 'undefined' && (() => {
    try {
      return new URL(href).hostname === window.location.hostname;
    } catch {
      return false;
    }
  })();
  return (
    <a
      href={href}
      target={sameSite ? undefined : '_blank'}
      rel="noopener noreferrer"
      style={{ color: 'var(--gold)', textDecoration: 'underline', wordBreak: 'break-word' }}
    >
      {children}
    </a>
  );
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    const md = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (md) return <Link key={key} href={md[2]}>{md[1]}</Link>;
    if (/^https?:\/\//.test(part)) return <Link key={key} href={part}>{part}</Link>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

const isTableLine = (line: string) => line.trim().startsWith('|') && line.trim().endsWith('|');
const isSeparatorRow = (line: string) => /^\|[\s:|-]+\|$/.test(line.trim());
const BULLET = /^\s*(?:[-*•]|👉)\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function splitRow(line: string): string[] {
  return line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
}

export default function ChatMarkdown({ text }: Readonly<{ text: string }>) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    if (line.trim() === '') {
      i++;
      continue;
    }

    if (/^\s*(-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)', margin: '0.5rem 0' }} />);
      i++;
      continue;
    }

    if (isTableLine(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        if (!isSeparatorRow(lines[i])) rows.push(splitRow(lines[i]));
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key} style={{ overflowX: 'auto', margin: '0.25rem 0' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', width: '100%', overflowWrap: 'normal', wordBreak: 'normal' }}>
            {head && (
              <thead>
                <tr>
                  {head.map((cell, c) => (
                    <th key={`${key}-h${c}`} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid rgba(197,165,90,0.4)', color: 'var(--gold)' }}>
                      {renderInline(cell, `${key}-h${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, r) => (
                <tr key={`${key}-r${r}`}>
                  {row.map((cell, c) => (
                    <td key={`${key}-r${r}c${c}`} style={{ padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', verticalAlign: 'top' }}>
                      {renderInline(cell, `${key}-r${r}c${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (bullet || numbered) {
      const ordered = !bullet;
      const items: string[] = [];
      while (i < lines.length) {
        const m = (ordered ? NUMBERED : BULLET).exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={key} style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: ordered ? 'decimal' : 'disc' }}>
          {items.map((item, n) => (
            <li key={`${key}-${n}`} style={{ marginBottom: 2 }}>{renderInline(item, `${key}-${n}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Paragraph: gather until blank line or the start of another block type.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isTableLine(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      para.push(lines[i].replace(/^#{1,6}\s+/, ''));
      i++;
    }
    blocks.push(
      <p key={key} style={{ margin: '0.25rem 0' }}>
        {para.map((p, n) => (
          <React.Fragment key={`${key}-${n}`}>
            {n > 0 && <br />}
            {renderInline(p, `${key}-${n}`)}
          </React.Fragment>
        ))}
      </p>,
    );
  }

  return <>{blocks}</>;
}

'use client';

import { useState } from 'react';

export function CollapsibleText({
  text,
  maxLength = 120,
  className = 'text-sm leading-relaxed text-zinc-400',
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > maxLength;
  const display = !needsToggle || expanded ? text : `${text.slice(0, maxLength).trim()}…`;

  return (
    <div>
      <p className={`whitespace-pre-line ${className}`}>{display}</p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const PANEL_WIDTH = 300;
const VIEWPORT_PAD = 12;

interface InfoTooltipProps {
  title: string;
  body: string;
  rules?: string[];
  size?: 'sm' | 'md';
  align?: 'auto' | 'start' | 'end' | 'center';
}

interface PanelPosition {
  top: number;
  left: number;
  arrowLeft: number;
  placement: 'bottom' | 'top';
}

function computePosition(
  triggerRect: DOMRect,
  panelHeight: number,
  align: 'auto' | 'start' | 'end' | 'center'
): PanelPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panelW = Math.min(PANEL_WIDTH, vw - VIEWPORT_PAD * 2);
  const gap = 10;

  let left: number;
  if (align === 'end') {
    left = triggerRect.right - panelW;
  } else if (align === 'start') {
    left = triggerRect.left;
  } else {
    left = triggerRect.left + triggerRect.width / 2 - panelW / 2;
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - panelW - VIEWPORT_PAD));

  let top = triggerRect.bottom + gap;
  let placement: 'bottom' | 'top' = 'bottom';

  if (top + panelHeight > vh - VIEWPORT_PAD) {
    top = triggerRect.top - panelHeight - gap;
    placement = 'top';
  }
  top = Math.max(VIEWPORT_PAD, top);

  const iconCenter = triggerRect.left + triggerRect.width / 2;
  const arrowLeft = Math.max(16, Math.min(iconCenter - left, panelW - 16));

  return { top, left, arrowLeft, placement };
}

export function InfoTooltip({ title, body, rules, size = 'sm', align = 'auto' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PanelPosition | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedAlign = align === 'auto' ? 'end' : align;

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 220;
    setPos(computePosition(rect, panelHeight, resolvedAlign));
  }, [resolvedAlign]);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open && panelRef.current) updatePosition();
  }, [open, updatePosition, rules?.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const panel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        className={`info-tooltip-panel info-tooltip-fixed info-tooltip-${pos?.placement ?? 'bottom'}`}
        role="tooltip"
        onMouseEnter={show}
        onMouseLeave={hide}
        style={
          pos
            ? {
                top: pos.top,
                left: pos.left,
                width: Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_PAD * 2),
                ['--arrow-left' as string]: `${pos.arrowLeft}px`,
              }
            : { visibility: 'hidden', top: -9999, left: 0, width: PANEL_WIDTH }
        }
      >
        <strong>{title}</strong>
        <p>{body}</p>
        {rules && rules.length > 0 && (
          <ul>
            {rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>,
      document.body
    );

  return (
    <div className={`info-tooltip-wrap ${size}`} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="info-icon-btn"
        aria-label={`Info: ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        ⓘ
      </button>
      {panel}
    </div>
  );
}

interface InfoNoteProps {
  title?: string;
  children: ReactNode;
  variant?: 'info' | 'tip';
}

export function InfoNote({ title, children, variant = 'info' }: InfoNoteProps) {
  return (
    <div className={`info-note info-note-${variant}`}>
      <span className="info-note-icon">{variant === 'tip' ? '💡' : 'ℹ️'}</span>
      <div>
        {title && <strong>{title}</strong>}
        <div className="info-note-body">{children}</div>
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  help?: { title: string; body: string; rules?: string[] };
}

export function SectionHeader({ title, help }: SectionHeaderProps) {
  return (
    <div className="section-header-with-info">
      <h2>{title}</h2>
      {help && <InfoTooltip title={help.title} body={help.body} rules={help.rules} size="md" align="start" />}
    </div>
  );
}

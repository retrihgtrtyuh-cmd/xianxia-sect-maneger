import React, { useEffect, useRef, useState } from 'react';
import { ARCHETYPE_INFO } from '../engine/gameMath';
import { ArchetypeId } from '../types/game';
import { t, getLocalizedDaoHeartLabel } from '../i18n';

export function formatArchetypeBonusText(archKey: ArchetypeId): string {
  const info = ARCHETYPE_INFO[archKey] || ARCHETYPE_INFO.NOVICE;
  const b = info.statBonuses || {};
  const parts: string[] = [];
  if (b.maxHp) parts.push(`+${b.maxHp} ${t('statHp', null) || 'к Здоровью'}`);
  if (b.pAtk) parts.push(`+${b.pAtk} ${t('statPAtk')}`);
  if (b.mAtk) parts.push(`+${b.mAtk} ${t('statMAtk')}`);
  if (b.pDef) parts.push(`+${b.pDef} ${t('statPDef')}`);
  if (b.mDef) parts.push(`+${b.mDef} ${t('statMDef')}`);
  if (b.spd) parts.push(`+${b.spd} ${t('statSpd')}`);
  if (b.crit) parts.push(`+${b.crit}% ${t('statCrit')}`);
  if (b.eva) parts.push(`+${b.eva}% ${t('statEva')}`);
  if (parts.length === 0) {
    return 'Базовые параметры 1-го царства (Закалка Тела). При прорыве во 2-е царство открывается выбор боевой специализации.';
  }
  return `Бонусы пути: ${parts.join(', ')}.`;
}

export function formatArchetypeTooltip(archKey: ArchetypeId): string {
  const info = ARCHETYPE_INFO[archKey] || ARCHETYPE_INFO.NOVICE;
  const dmgLabel =
    info.attackType === 'MAGICAL'
      ? 'Духовная атака (бьёт по Маг. защите)'
      : 'Физическая атака (бьёт по Физ. защите)';
  return `${info.role} · ${dmgLabel}\n${info.description}\n${formatArchetypeBonusText(archKey)}`;
}

export function getDaoHeartLabel(daoHeart: number | boolean): string {
  return getLocalizedDaoHeartLabel(daoHeart);
}

export function formatDaoHeartTooltip(daoHeart: number | boolean, subtitle?: string): string {
  const label = getDaoHeartLabel(daoHeart);
  const subLine = subtitle ? `${subtitle}\n\n` : '\n';
  return `${t('daoTooltipHeader', { label })}\n${subLine}${t('daoTooltipBody')}`;
}


export const TOOLTIP_LINGER_MS = 600;

export const Tooltip: React.FC = () => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coords, setCoords] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const cancelHide = () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const scheduleHide = (delayMs = TOOLTIP_LINGER_MS) => {
      if (delayMs <= 0) {
        cancelHide();
        setVisible(false);
        return;
      }
      if (hideTimeoutRef.current !== null) return;
      hideTimeoutRef.current = window.setTimeout(() => {
        hideTimeoutRef.current = null;
        setVisible(false);
      }, delayMs);
    };

    const findTooltipTarget = (node: EventTarget | null): HTMLElement | null => {
      if (!node || !(node instanceof HTMLElement)) return null;
      const el = node.closest('[data-tooltip], [title]') as HTMLElement | null;
      if (!el) return null;
      if (el.hasAttribute('title') && !el.hasAttribute('data-tooltip')) {
        const rawTitle = el.getAttribute('title');
        if (rawTitle) {
          el.setAttribute('data-tooltip', rawTitle);
        }
        el.removeAttribute('title');
      } else if (el.hasAttribute('title')) {
        el.removeAttribute('title');
      }
      const text = el.getAttribute('data-tooltip');
      if (!text) return null;
      return el;
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const el = tooltipRef.current;
      const pad = 12;
      const offsetX = 14;
      const offsetY = 16;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const width = el?.offsetWidth || 280;
      const height = el?.offsetHeight || 110;

      let left = clientX + offsetX;
      let top = clientY + offsetY;

      if (left + width + pad > vw) {
        left = Math.max(pad, clientX - width - offsetX);
      }
      if (top + height + pad > vh) {
        top = Math.max(pad, clientY - height - offsetY);
      }

      setCoords({ left: Math.round(left), top: Math.round(top) });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = findTooltipTarget(e.target);
      if (target) {
        cancelHide();
        setTitle(target.getAttribute('data-tooltip-title') || '');
        setContent(target.getAttribute('data-tooltip') || '');
        setVisible(true);
        updatePosition(e.clientX, e.clientY);
      } else if (visible) {
        scheduleHide(TOOLTIP_LINGER_MS);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (visible) {
        const target = findTooltipTarget(e.target);
        if (target) {
          cancelHide();
          updatePosition(e.clientX, e.clientY);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const fromTarget = findTooltipTarget(e.target);
      const toTarget = findTooltipTarget(e.relatedTarget);
      if (fromTarget && !toTarget) {
        scheduleHide(TOOLTIP_LINGER_MS);
      } else if (!e.relatedTarget && visible) {
        scheduleHide(TOOLTIP_LINGER_MS);
      }
    };

    const handleScrollOrClick = () => {
      cancelHide();
      setVisible(false);
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('scroll', handleScrollOrClick, true);
    document.addEventListener('click', handleScrollOrClick, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('scroll', handleScrollOrClick, true);
      document.removeEventListener('click', handleScrollOrClick);
    };
  }, [visible]);

  return (
    <div
      ref={tooltipRef}
      id="sect-tooltip"
      role="tooltip"
      aria-hidden={!visible}
      className={`sect-tooltip ${visible ? 'visible' : ''}`}
      style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
    >
      {title && <div className="sect-tooltip-title">{title}</div>}
      <div className="sect-tooltip-body">{content}</div>
    </div>
  );
};

export default Tooltip;

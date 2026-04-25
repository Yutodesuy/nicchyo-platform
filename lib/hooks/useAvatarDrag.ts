import { useState, useRef, useCallback, useEffect } from 'react';

const HOLD_MS = 250;

type DragState = {
  startX: number;
  startY: number;
  startOffset: number;
  startOffsetY: number;
  min: number;
  max: number;
  minY: number;
  maxY: number;
  moved: boolean;
  pointerId: number | null;
  active: boolean;
};

type UseAvatarDragOptions = {
  onHoldChange?: (holding: boolean) => void;
  onDrop?: (position: { x: number; y: number }) => void;
};

export type UseAvatarDragReturn = {
  avatarOffset: { x: number; y: number };
  isHolding: boolean;
  holdPhase: 'idle' | 'priming' | 'active';
  /** Checks (and clears) whether the last pointer interaction was a drag. Used to suppress click. */
  consumeWasMoved: () => boolean;
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onDragStart: (event: React.DragEvent<HTMLButtonElement>) => void;
  };
};

export function useAvatarDrag({
  onHoldChange,
  onDrop,
}: UseAvatarDragOptions = {}): UseAvatarDragReturn {
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const [holdPhase, setHoldPhase] = useState<'idle' | 'priming' | 'active'>('idle');

  // Keep a ref in sync so callbacks don't need avatarOffset as a dep
  const avatarOffsetRef = useRef(avatarOffset);
  useEffect(() => {
    avatarOffsetRef.current = avatarOffset;
  }, [avatarOffset]);

  const rafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    startOffset: 0,
    startOffsetY: 0,
    min: 0,
    max: 0,
    minY: 0,
    maxY: 0,
    moved: false,
    pointerId: null,
    active: false,
  });

  const onHoldChangeRef = useRef(onHoldChange);
  const onDropRef = useRef(onDrop);
  useEffect(() => { onHoldChangeRef.current = onHoldChange; }, [onHoldChange]);
  useEffect(() => { onDropRef.current = onDrop; }, [onDrop]);

  const consumeWasMoved = useCallback(() => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return true;
    }
    return false;
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsHolding(true);
    setHoldPhase('priming');
    onHoldChangeRef.current?.(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const viewWidth = document.documentElement.clientWidth;
    const viewHeight = document.documentElement.clientHeight;
    const { x, y } = avatarOffsetRef.current;
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: x,
      startOffsetY: y,
      min: x - rect.left,
      max: x + (viewWidth - rect.right),
      minY: y - rect.top,
      maxY: y + (viewHeight - rect.bottom),
      moved: false,
      pointerId: event.pointerId,
      active: false,
    };
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdTimerRef.current = window.setTimeout(() => {
      dragStateRef.current.active = true;
      setHoldPhase('active');
    }, HOLD_MS);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragStateRef.current.moved = true;
    }
    if (!dragStateRef.current.active && Math.abs(deltaX) > 4) {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setIsHolding(false);
      setHoldPhase('idle');
      onHoldChangeRef.current?.(false);
    }
    const nextX = Math.max(
      dragStateRef.current.min,
      Math.min(dragStateRef.current.max, dragStateRef.current.startOffset + deltaX)
    );
    const nextY = dragStateRef.current.active
      ? Math.max(
          dragStateRef.current.minY,
          Math.min(dragStateRef.current.maxY, dragStateRef.current.startOffsetY + deltaY)
        )
      : 0;
    pendingOffsetRef.current = { x: nextX, y: nextY };
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(() => {
        if (pendingOffsetRef.current !== null) {
          setAvatarOffset(pendingOffsetRef.current);
        }
        rafRef.current = null;
      });
    }
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const wasActive = dragStateRef.current.active;
    dragStateRef.current.pointerId = null;
    dragStateRef.current.active = false;
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setHoldPhase('idle');
    onHoldChangeRef.current?.(false);
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingOffsetRef.current !== null) {
      setAvatarOffset(pendingOffsetRef.current);
      pendingOffsetRef.current = null;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (wasActive) {
      setAvatarOffset({ x: 0, y: 0 });
      onDropRef.current?.({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const onContextMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const onDragStart = useCallback((event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  return {
    avatarOffset,
    isHolding,
    holdPhase,
    consumeWasMoved,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onContextMenu, onDragStart },
  };
}

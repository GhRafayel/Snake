import { RefObject, useEffect } from "react";
import { MoveDirectionType } from "./DirectionControl";

// Minimum finger travel (px) before a swipe counts as a turn.
const SWIPE_THRESHOLD = 24;

interface SwipeControlsParamsType {
    targetRef: RefObject<HTMLElement | null>;
    onSwipe: (dir: MoveDirectionType) => void;
}

export function useSwipeControls({ targetRef, onSwipe }: SwipeControlsParamsType) {
    useEffect(() => {
        const el = targetRef.current;
        if (!el) return;

        let startX = 0;
        let startY = 0;
        let tracking = false;

        const handleStart = (e: TouchEvent) => {
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            tracking = true;
        };

        // Fires while the finger moves, so turns feel instant. After each turn the
        // origin resets, letting one continuous gesture chain several turns.
        const handleMove = (e: TouchEvent) => {
            e.preventDefault();
            if (!tracking) return;
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

            if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'RIGHT' : 'LEFT');
            else onSwipe(dy > 0 ? 'DOWN' : 'UP');

            startX = t.clientX;
            startY = t.clientY;
        };

        const handleEnd = () => { tracking = false; };

        el.addEventListener('touchstart', handleStart, { passive: true });
        el.addEventListener('touchmove', handleMove, { passive: false });
        el.addEventListener('touchend', handleEnd);
        el.addEventListener('touchcancel', handleEnd);
        return () => {
            el.removeEventListener('touchstart', handleStart);
            el.removeEventListener('touchmove', handleMove);
            el.removeEventListener('touchend', handleEnd);
            el.removeEventListener('touchcancel', handleEnd);
        };
    }, [targetRef, onSwipe]);
}

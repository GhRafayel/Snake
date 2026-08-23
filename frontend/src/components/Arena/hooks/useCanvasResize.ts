import { RefObject, useEffect } from "react";
import { fitCanvas } from "../utils/canvas";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";

export function useCanvasResize(
    canvasRef: RefObject<HTMLCanvasElement | null>,
    containerId: string
) {
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = document.getElementById(containerId);
        const ctx = canvas?.getContext('2d') ?? null;
        if (!canvas || !container || !ctx) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cssWidth = Math.max(0, Math.floor(entry.contentRect.width));
                const cssHeight = Math.max(0, Math.floor(entry.contentRect.height));
                const size = Math.min(cssWidth, cssHeight);
                useGameCanvasStore.getState().setScreen({ width: size, height: size });
                fitCanvas({ canvas, ctx, cssWidth: size, cssHeight: size });
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [canvasRef, containerId]);
}

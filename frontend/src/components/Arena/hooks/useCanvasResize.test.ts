import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCanvasResize } from "./useCanvasResize";
import { useGameCanvasStore } from "@/src/components/Store/useGameCanvasStore";
import { fitCanvas } from "../utils/canvas";

vi.mock("../utils/canvas", () => ({
    fitCanvas: vi.fn(),
}));

const initialCanvasStoreState = useGameCanvasStore.getState();

type ResizeCallback = (entries: Array<{ contentRect: { width: number; height: number } }>) => void;

class FakeResizeObserver {
    static instances: FakeResizeObserver[] = [];
    callback: ResizeCallback;
    observedElements: Element[] = [];
    disconnected = false;

    constructor(callback: ResizeCallback) {
        this.callback = callback;
        FakeResizeObserver.instances.push(this);
    }

    observe(el: Element) {
        this.observedElements.push(el);
    }

    disconnect() {
        this.disconnected = true;
    }

    unobserve() {}
}

describe("useCanvasResize", () => {
    beforeEach(() => {
        useGameCanvasStore.setState(initialCanvasStoreState, true);
        vi.mocked(fitCanvas).mockReset();
        FakeResizeObserver.instances = [];
        vi.stubGlobal("ResizeObserver", FakeResizeObserver);
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("does nothing (no ResizeObserver created) when the container element is missing", () => {
        const canvas = document.createElement("canvas");
        renderHook(() => useCanvasResize({ current: canvas }, "missing-container"));

        expect(FakeResizeObserver.instances).toHaveLength(0);
    });

    it("does nothing when the canvasRef has no current element", () => {
        const container = document.createElement("div");
        container.id = "arena-container";
        document.body.appendChild(container);

        renderHook(() => useCanvasResize({ current: null }, "arena-container"));

        expect(FakeResizeObserver.instances).toHaveLength(0);
    });

    it("does nothing when the canvas 2d context is unavailable", () => {
        const container = document.createElement("div");
        container.id = "arena-container";
        document.body.appendChild(container);
        const canvas = document.createElement("canvas");
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

        renderHook(() => useCanvasResize({ current: canvas }, "arena-container"));

        expect(FakeResizeObserver.instances).toHaveLength(0);
    });

    it("observes the container and updates screen + calls fitCanvas on resize, using the smaller dimension", () => {
        const container = document.createElement("div");
        container.id = "arena-container";
        document.body.appendChild(container);
        const canvas = document.createElement("canvas");
        const fakeCtx = {} as CanvasRenderingContext2D;
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeCtx);

        renderHook(() => useCanvasResize({ current: canvas }, "arena-container"));

        expect(FakeResizeObserver.instances).toHaveLength(1);
        const observer = FakeResizeObserver.instances[0];
        expect(observer.observedElements).toEqual([container]);

        observer.callback([{ contentRect: { width: 500.7, height: 300.2 } }]);

        expect(useGameCanvasStore.getState().screen).toEqual({ width: 300, height: 300 });
        expect(fitCanvas).toHaveBeenCalledWith({
            canvas,
            ctx: fakeCtx,
            cssWidth: 300,
            cssHeight: 300,
        });
    });

    it("clamps negative content-rect dimensions to 0", () => {
        const container = document.createElement("div");
        container.id = "arena-container";
        document.body.appendChild(container);
        const canvas = document.createElement("canvas");
        const fakeCtx = {} as CanvasRenderingContext2D;
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fakeCtx);

        renderHook(() => useCanvasResize({ current: canvas }, "arena-container"));
        const observer = FakeResizeObserver.instances[0];

        observer.callback([{ contentRect: { width: -10, height: 50 } }]);

        expect(useGameCanvasStore.getState().screen).toEqual({ width: 0, height: 0 });
    });

    it("disconnects the observer on unmount", () => {
        const container = document.createElement("div");
        container.id = "arena-container";
        document.body.appendChild(container);
        const canvas = document.createElement("canvas");
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);

        const { unmount } = renderHook(() => useCanvasResize({ current: canvas }, "arena-container"));
        const observer = FakeResizeObserver.instances[0];

        unmount();

        expect(observer.disconnected).toBe(true);
    });
});

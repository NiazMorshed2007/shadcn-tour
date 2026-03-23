import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TourProvider, TourStep, TourDefinition, useTour } from "../components/tour";

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const DEFAULT_RECT: DOMRect = {
  top: 100, left: 100, width: 200, height: 50,
  bottom: 150, right: 300, x: 100, y: 100,
  toJSON: () => {},
};

// Helper to create a target element in the DOM
function createTargetElement({
  id,
  rect,
  ...attrs
}: {
  id?: string;
  rect?: Partial<DOMRect>;
  [key: string]: unknown;
} = {}) {
  const el = document.createElement("div");
  if (id) {
    el.id = id;
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "string") {
      el.setAttribute(key, value);
    }
  }
  el.getBoundingClientRect = () => ({ ...DEFAULT_RECT, ...rect });
  el.scrollIntoView = vi.fn();
  document.body.appendChild(el);
  return el;
}

// Helper component that exposes single-tour controls (setSteps + startTour)
function TourControls() {
  const tour = useTour();
  return (
    <div>
      <button data-testid="start" onClick={() => tour.startTour()}>Start</button>
      <button data-testid="next" onClick={tour.nextStep}>Next</button>
      <button data-testid="prev" onClick={tour.previousStep}>Previous</button>
      <button data-testid="end" onClick={tour.endTour}>End</button>
      <span data-testid="step">{tour.currentStep}</span>
      <span data-testid="active">{String(tour.isActive)}</span>
      <span data-testid="tour-id">{tour.activeTourId ?? "none"}</span>
    </div>
  );
}

// Helper component that sets steps on mount (single-tour pattern)
function SetStepsOnMount({ steps }: { steps: TourStep[] }) {
  const { setSteps } = useTour();
  React.useEffect(() => { setSteps(steps); }, [setSteps, steps]);
  return null;
}

const basicSteps: TourStep[] = [
  { content: <div>Step 1</div>, selectorId: "target-1", position: "bottom" },
  { content: <div>Step 2</div>, selectorId: "target-2", position: "right" },
  { content: <div>Step 3</div>, selectorId: "target-3", position: "bottom" },
];

// ---------------------------------------------------------------------------
// Core behavior — baseline functionality (single tour, rendering, navigation)
// ---------------------------------------------------------------------------
describe("core behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    createTargetElement({ id: "target-1" });
    createTargetElement({ id: "target-2", rect: { top: 200, left: 300 } });
    createTargetElement({ id: "target-3", rect: { top: 400, left: 100 } });
  });

  describe("rendering", () => {
    it("renders children", () => {
      render(
        <TourProvider>
          <div data-testid="child">Hello</div>
        </TourProvider>
      );
      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("renders overlay, highlight, and tooltip when tour is active", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("uses position: fixed on all overlay elements", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });

      const svg = document.querySelector("svg");
      expect(svg).toHaveClass("fixed");

      const highlightDiv = document.querySelector(".z-\\[100\\].border-2");
      expect(highlightDiv).toHaveStyle({ position: "fixed" });

      const tooltip = document.querySelector(".bg-background.z-\\[100\\]");
      expect(tooltip).toHaveStyle({ position: "fixed" });
    });
  });

  describe("navigation", () => {
    it("advances with nextStep", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("0");

      act(() => { screen.getByTestId("next").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("1");
      expect(screen.getByText("Step 2")).toBeInTheDocument();
    });

    it("goes back with previousStep", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("1");

      act(() => { screen.getByTestId("prev").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("0");
    });

    it("does not go below step 0", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("prev").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("0");
    });
  });

  describe("completion", () => {
    it("fires onComplete on last step", () => {
      const onComplete = vi.fn();
      render(
        <TourProvider onComplete={onComplete}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("next").click(); });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith("default");
      expect(screen.getByTestId("active")).toHaveTextContent("false");
    });

    it("startTour respects isCompleted state", () => {
      const onComplete = vi.fn();
      render(
        <TourProvider onComplete={onComplete}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      // Complete the tour
      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("next").click(); });
      expect(screen.getByTestId("active")).toHaveTextContent("false");

      // Try to restart — should not work
      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByTestId("active")).toHaveTextContent("false");
    });
  });
});

// ---------------------------------------------------------------------------
// Extended features — multiple tours, keyboard nav, skip/close, lifecycle callbacks
// ---------------------------------------------------------------------------
describe("extended features", () => {
  let targets: HTMLElement[];

  beforeEach(() => {
    document.body.innerHTML = "";
    targets = [
      createTargetElement({ id: "target-1" }),
      createTargetElement({ id: "target-2", rect: { top: 200, left: 300 } }),
      createTargetElement({ id: "target-3", rect: { top: 400, left: 100 } }),
    ];
  });

  describe("multiple named tours", () => {
    const tours: TourDefinition[] = [
      {
        id: "intro",
        steps: [
          { content: <div>Intro Step 1</div>, selectorId: "target-1" },
          { content: <div>Intro Step 2</div>, selectorId: "target-2" },
        ],
      },
      {
        id: "advanced",
        steps: [
          { content: <div>Advanced Step 1</div>, selectorId: "target-2" },
          { content: <div>Advanced Step 2</div>, selectorId: "target-3" },
          { content: <div>Advanced Step 3</div>, selectorId: "target-1" },
        ],
      },
    ];

    function MultiTourControls() {
      const { startTour, activeTourId, totalSteps, isActive } = useTour();
      return (
        <div>
          <button data-testid="start-intro" onClick={() => startTour("intro")}>Start Intro</button>
          <button data-testid="start-advanced" onClick={() => startTour("advanced")}>Start Advanced</button>
          <span data-testid="tour-id">{activeTourId ?? "none"}</span>
          <span data-testid="total">{totalSteps}</span>
          <span data-testid="active">{String(isActive)}</span>
        </div>
      );
    }

    it("starts a tour by ID and loads correct steps", () => {
      render(
        <TourProvider tours={tours}>
          <MultiTourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start-intro").click(); });
      expect(screen.getByTestId("tour-id")).toHaveTextContent("intro");
      expect(screen.getByTestId("total")).toHaveTextContent("2");
      expect(screen.getByText("Intro Step 1")).toBeInTheDocument();
    });

    it("starts a different tour by ID", () => {
      render(
        <TourProvider tours={tours}>
          <MultiTourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start-advanced").click(); });
      expect(screen.getByTestId("tour-id")).toHaveTextContent("advanced");
      expect(screen.getByTestId("total")).toHaveTextContent("3");
      expect(screen.getByText("Advanced Step 1")).toBeInTheDocument();
    });

    it("fires onComplete with tour ID", () => {
      const onComplete = vi.fn();
      render(
        <TourProvider tours={tours} onComplete={onComplete}>
          <MultiTourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start-intro").click(); });

      const nextButtons = () => screen.getAllByRole("button", { name: /next/i });
      act(() => { nextButtons()[0].click(); });
      const finishButtons = () => screen.getAllByRole("button", { name: /finish/i });
      act(() => { finishButtons()[0].click(); });

      expect(onComplete).toHaveBeenCalledWith("intro");
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowRight advances step", async () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByTestId("step")).toHaveTextContent("0");

      await act(async () => { fireEvent.keyDown(window, { key: "ArrowRight" }); });
      expect(screen.getByTestId("step")).toHaveTextContent("1");
    });

    it("ArrowLeft goes back", async () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });

      await act(async () => { fireEvent.keyDown(window, { key: "ArrowLeft" }); });
      expect(screen.getByTestId("step")).toHaveTextContent("0");
    });

    it("Escape dismisses tour", async () => {
      const onSkip = vi.fn();
      render(
        <TourProvider onSkip={onSkip}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByTestId("active")).toHaveTextContent("true");

      await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); });
      expect(screen.getByTestId("active")).toHaveTextContent("false");
      expect(onSkip).toHaveBeenCalledWith("default", 0);
    });
  });

  describe("skip button", () => {
    it("shows skip button on non-last steps", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByText("Skip tour")).toBeInTheDocument();
    });

    it("hides skip button on last step", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("next").click(); });

      expect(screen.queryByText("Skip tour")).not.toBeInTheDocument();
      expect(screen.getByText("Finish")).toBeInTheDocument();
    });

    it("respects showSkip: false per step", () => {
      const stepsWithNoSkip: TourStep[] = [
        { content: <div>No skip here</div>, selectorId: "target-1", showSkip: false },
        { content: <div>Skip allowed</div>, selectorId: "target-2" },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={stepsWithNoSkip} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.queryByText("Skip tour")).not.toBeInTheDocument();

      act(() => { screen.getByTestId("next").click(); });
      // Step 2 is the last step, so skip is hidden regardless
      expect(screen.queryByText("Skip tour")).not.toBeInTheDocument();
    });
  });

  describe("close button", () => {
    it("does not show close button by default", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("shows close button when closeable is true on provider", () => {
      render(
        <TourProvider closeable>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("respects per-step closeable override", () => {
      const stepsWithCloseable: TourStep[] = [
        { content: <div>Closeable</div>, selectorId: "target-1", closeable: true },
        { content: <div>Not closeable</div>, selectorId: "target-2", closeable: false },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={stepsWithCloseable} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

      act(() => { screen.getByTestId("next").click(); });
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });
  });

  describe("lifecycle callbacks", () => {
    it("fires onStart when tour starts", () => {
      const onStart = vi.fn();
      render(
        <TourProvider onStart={onStart}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(onStart).toHaveBeenCalledWith("default");
    });

    it("fires onStepChange on navigation", () => {
      const onStepChange = vi.fn();
      render(
        <TourProvider onStepChange={onStepChange}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      expect(onStepChange).toHaveBeenCalledWith("default", 1);

      act(() => { screen.getByTestId("prev").click(); });
      expect(onStepChange).toHaveBeenCalledWith("default", 0);
    });

    it("fires onSkip when tour is skipped", () => {
      const onSkip = vi.fn();
      render(
        <TourProvider onSkip={onSkip}>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      act(() => { screen.getByTestId("next").click(); });
      act(() => { screen.getByTestId("end").click(); });
      expect(onSkip).toHaveBeenCalledWith("default", 1);
    });
  });

  describe("scroll into view", () => {
    it("calls scrollIntoView when element is off-screen", () => {
      const offScreenElement = createTargetElement({
        id: "target-offscreen",
        rect: { top: -100, bottom: -50 },
      });

      const stepsWithOffscreen: TourStep[] = [
        { content: <div>Off screen</div>, selectorId: "target-offscreen" },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={stepsWithOffscreen} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(offScreenElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });

    it("does not call scrollIntoView when element is in viewport", () => {
      render(
        <TourProvider>
          <SetStepsOnMount steps={basicSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(targets[0].scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe("CSS selector targeting", () => {
    it("targets elements by data-tour attribute using selector prop", () => {
      createTargetElement({ "data-tour": "export" });
      createTargetElement({ "data-tour": "toolbar", rect: { top: 200, left: 300 } });

      const selectorSteps: TourStep[] = [
        { content: <div>Export Step</div>, selector: '[data-tour="export"]' },
        { content: <div>Toolbar Step</div>, selector: '[data-tour="toolbar"]' },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={selectorSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByText("Export Step")).toBeInTheDocument();
      expect(screen.getByTestId("active")).toHaveTextContent("true");

      act(() => { screen.getByTestId("next").click(); });
      expect(screen.getByText("Toolbar Step")).toBeInTheDocument();
    });

    it("can mix selectorId and selector steps in the same tour", () => {
      createTargetElement({ id: "id-target" });
      createTargetElement({ "data-tour": "selector-target", rect: { top: 200 } });

      const mixedSteps: TourStep[] = [
        { content: <div>By ID</div>, selectorId: "id-target" },
        { content: <div>By Selector</div>, selector: '[data-tour="selector-target"]' },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={mixedSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByText("By ID")).toBeInTheDocument();

      act(() => { screen.getByTestId("next").click(); });
      expect(screen.getByText("By Selector")).toBeInTheDocument();
    });

    it("targets elements with compound CSS selectors", () => {
      createTargetElement({ class: "tour-highlight", "data-name": "sidebar" });

      const compoundSteps: TourStep[] = [
        { content: <div>Sidebar</div>, selector: '.tour-highlight[data-name="sidebar"]' },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={compoundSteps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByText("Sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("active")).toHaveTextContent("true");
    });

    it("works with named tours using selector", () => {
      createTargetElement({ "data-tour": "step-a" });
      createTargetElement({ "data-tour": "step-b", rect: { top: 200 } });

      const tours: TourDefinition[] = [
        {
          id: "selector-tour",
          steps: [
            { content: <div>Selector A</div>, selector: '[data-tour="step-a"]' },
            { content: <div>Selector B</div>, selector: '[data-tour="step-b"]' },
          ],
        },
      ];

      function Controls() {
        const { startTour, activeTourId, isActive } = useTour();
        return (
          <div>
            <button data-testid="start" onClick={() => startTour("selector-tour")}>Start</button>
            <span data-testid="tour-id">{activeTourId ?? "none"}</span>
            <span data-testid="active">{String(isActive)}</span>
          </div>
        );
      }

      render(
        <TourProvider tours={tours}>
          <Controls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(screen.getByTestId("tour-id")).toHaveTextContent("selector-tour");
      expect(screen.getByText("Selector A")).toBeInTheDocument();
    });

    it("scrolls into view for off-screen selector targets", () => {
      const el = createTargetElement({ "data-tour": "offscreen", rect: { top: -100, bottom: -50 } });

      const steps: TourStep[] = [
        { content: <div>Off screen</div>, selector: '[data-tour="offscreen"]' },
      ];

      render(
        <TourProvider>
          <SetStepsOnMount steps={steps} />
          <TourControls />
        </TourProvider>
      );

      act(() => { screen.getByTestId("start").click(); });
      expect(el.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });
  });
});

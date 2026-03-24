"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Torus, X } from "lucide-react";

interface TourStepBase {
  content: React.ReactNode;
  width?: number;
  height?: number;
  padding?: number;
  showSkip?: boolean;
  closeable?: boolean;
  borderRadius?: number;
  onClickWithinArea?: () => void;
  position?: "top" | "bottom" | "left" | "right";
}

/** Target an element by its ID (backward compatible) */
interface TourStepById extends TourStepBase {
  selectorId: string;
  selector?: never;
}

/** Target an element by a CSS selector (e.g. '[data-tour="export"]') */
interface TourStepBySelector extends TourStepBase {
  selector: string;
  selectorId?: never;
}

export type TourStep = TourStepById | TourStepBySelector;

export interface TourDefinition {
  id: string;
  steps: TourStep[];
}

interface TourContextType {
  activeTourId: string | null;
  isTourCompleted: boolean;
  isActive: boolean;
  steps: TourStep[];
  totalSteps: number;
  currentStep: number;
  endTour: () => void;
  startTour: (tourId?: string) => void;
  setSteps: (steps: TourStep[]) => void;
  setIsTourCompleted: (completed: boolean) => void;
  previousStep: () => void;
  nextStep: () => void;
}

interface TourProviderProps {
  isTourCompleted?: boolean;
  children: React.ReactNode;
  tours?: TourDefinition[];
  closeable?: boolean;
  className?: string;
  onStart?: (tourId: string) => void;
  onComplete?: (tourId: string) => void;
  onSkip?: (tourId: string, step: number) => void;
  onStepChange?: (tourId: string, step: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

const PADDING = 16;

function getElementPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" = "bottom",
  contentSize: { width: number; height: number }
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const elementCenterX = elementPos.left + elementPos.width / 2;
  const elementInRightHalf = elementCenterX > viewportWidth / 2;

  // Always resolve to absolute top + left so Framer Motion never animates
  // between "auto" and a number — that causes the element to stretch when
  // both top & bottom (or left & right) are numeric mid-animation.
  let left: number = elementPos.left;
  let top: number = elementPos.top;

  switch (position) {
    case "top":
      top = elementPos.top - PADDING - contentSize.height;
      if (elementInRightHalf) {
        left = elementPos.left + elementPos.width - contentSize.width;
      } else {
        left = elementPos.left;
      }
      break;
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING;
      if (elementInRightHalf) {
        left = elementPos.left + elementPos.width - contentSize.width;
      } else {
        left = elementPos.left;
      }
      break;
    case "left":
      left = elementPos.left - PADDING - contentSize.width;
      top = elementPos.top + elementPos.height / 2 - contentSize.height / 2;
      break;
    case "right":
      left = elementPos.left + elementPos.width + PADDING;
      top = elementPos.top + elementPos.height / 2 - contentSize.height / 2;
      break;
  }

  top = Math.max(PADDING, Math.min(top, viewportHeight - contentSize.height - PADDING));
  left = Math.max(PADDING, Math.min(left, viewportWidth - contentSize.width - PADDING));

  return { top, left };
}

export function TourProvider({
  isTourCompleted = false,
  closeable = false,
  className,
  children,
  tours,
  onStart,
  onSkip,
  onComplete,
  onStepChange,
}: TourProviderProps) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [elementPosition, setElementPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isCompleted, setIsCompleted] = useState(isTourCompleted);

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState({ width: 300, height: 200 });
  const contentTransitioning = useRef(false);
  const prevStepRef = useRef(-1);

  // Track step transitions to prevent content-size jitter during content exit/enter.
  // The ResizeObserver fires intermediate sizes as the old content exits and new content
  // enters, which would cause contentPosition to recalculate mid-animation.
  useEffect(() => {
    if (currentStep >= 0 && prevStepRef.current >= 0) {
      contentTransitioning.current = true;
    }
    prevStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (contentTransitioning.current) return;
      setContentSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [currentStep]);

  const updateElementPosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep];
      const element = step?.selector
        ? document.querySelector<HTMLElement>(step.selector)
        : document.getElementById(step?.selectorId ?? "");
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setElementPosition(getElementPosition(element));
      }
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updateElementPosition();
    window.addEventListener("resize", updateElementPosition);
    window.addEventListener("scroll", updateElementPosition);

    return () => {
      window.removeEventListener("resize", updateElementPosition);
      window.removeEventListener("scroll", updateElementPosition);
    };
  }, [updateElementPosition]);

  const nextStep = useCallback(async () => {
    setCurrentStep((prev) => {
      const isLast = prev >= steps.length - 1;
      if (isLast) {
        setIsCompleted(true);
        onComplete?.(activeTourId ?? "default");
        return -1;
      }
      const next = prev + 1;
      onStepChange?.(activeTourId ?? "default", next);
      return next;
    });
  }, [steps.length, onComplete, onStepChange, activeTourId]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev <= 0) return prev;
      const next = prev - 1;
      onStepChange?.(activeTourId ?? "default", next);
      return next;
    });
  }, [onStepChange, activeTourId]);

  const endTour = useCallback(() => {
    onSkip?.(activeTourId ?? "default", currentStep);
    setCurrentStep(-1);
  }, [onSkip, activeTourId, currentStep]);

  const startTour = useCallback((tourId?: string) => {
    if (isCompleted) return;

    if (tourId && tours) {
      const tour = tours.find((t) => t.id === tourId);
      if (!tour) return;
      setActiveTourId(tourId);
      setSteps(tour.steps);
    } else if (!tourId && !tours) {
      setActiveTourId("default");
    } else if (tourId) {
      setActiveTourId(tourId);
    }

    setCurrentStep(0);
    onStart?.(tourId ?? activeTourId ?? "default");
  }, [isCompleted, tours, onStart, activeTourId]);

  useEffect(() => {
    if (currentStep < 0) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          nextStep();
          break;
        case "ArrowLeft":
          previousStep();
          break;
        case "Escape":
          endTour();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStep, nextStep, previousStep, endTour]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (currentStep >= 0 && elementPosition && steps[currentStep]?.onClickWithinArea) {
        const clickX = e.clientX;
        const clickY = e.clientY;

        const isWithinBounds =
          clickX >= elementPosition.left &&
          clickX <= elementPosition.left + (steps[currentStep]?.width || elementPosition.width) &&
          clickY >= elementPosition.top &&
          clickY <= elementPosition.top + (steps[currentStep]?.height || elementPosition.height);

        if (isWithinBounds) {
          steps[currentStep].onClickWithinArea?.();
        }
      }
    },
    [currentStep, elementPosition, steps]
  );

  useEffect(() => {
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  const setIsTourCompleted = useCallback((completed: boolean) => {
    setIsCompleted(completed);
  }, []);

  const currentStepData = steps[currentStep];
  const spotlightPadding = currentStepData?.padding ?? 8;
  const spotlightBorderRadius = currentStepData?.borderRadius ?? 8;
  const isCloseable = currentStepData?.closeable ?? closeable;
  const isLastStep = currentStep === steps.length - 1;
  const showSkip = !isLastStep && (currentStepData?.showSkip !== false);
  const spotlightWidth = currentStepData?.width || elementPosition?.width || 0;
  const spotlightHeight = currentStepData?.height || elementPosition?.height || 0;

  const contentPosition = useMemo(() => (
    elementPosition
      ? calculateContentPosition(elementPosition, currentStepData?.position, contentSize)
      : { top: 0, left: 0 }
  ), [elementPosition, currentStepData?.position, contentSize]);

  return (
    <TourContext.Provider
      value={{
        activeTourId,
        currentStep,
        steps,
        totalSteps: steps.length,
        isActive: currentStep >= 0,
        isTourCompleted: isCompleted,
        startTour,
        endTour,
        setSteps,
        setIsTourCompleted,
        previousStep,
        nextStep,
      }}
    >
      {children}
      <AnimatePresence>
        {currentStep >= 0 && elementPosition && (
          <>
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 h-full w-full pointer-events-auto"
            >
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={elementPosition.left - spotlightPadding}
                    y={elementPosition.top - spotlightPadding}
                    width={spotlightWidth + spotlightPadding * 2}
                    height={spotlightHeight + spotlightPadding * 2}
                    rx={spotlightBorderRadius}
                    ry={spotlightBorderRadius}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.5)"
                mask="url(#tour-mask)"
              />
            </motion.svg>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "fixed",
                top: elementPosition.top,
                left: elementPosition.left,
                width: spotlightWidth,
                height: spotlightHeight,
                borderRadius: spotlightBorderRadius,
              }}
              className={cn("z-[100] border-2 border-muted-foreground", className)}
            />

            <motion.div
              ref={contentRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                top: contentPosition.top,
                left: contentPosition.left,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                opacity: { duration: 0.4 },
              }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: "fixed",
                maxWidth: 400,
                minWidth: 300,
              }}
              className="bg-background relative z-[100] rounded-lg border p-4 shadow-lg"
            >
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {currentStep + 1} / {steps.length}
                </span>
                {isCloseable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      endTour();
                    }}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                )}
              </div>
              <AnimatePresence mode="wait">
                <div>
                  <motion.div
                    key={`tour-content-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    className="overflow-hidden"
                    transition={{
                      duration: 0.2,
                      height: {
                        duration: 0.4,
                      },
                    }}
                    onAnimationComplete={() => {
                      contentTransitioning.current = false;
                      if (contentRef.current) {
                        const rect = contentRef.current.getBoundingClientRect();
                        setContentSize({ width: rect.width, height: rect.height });
                      }
                    }}
                  >
                    {steps[currentStep]?.content}
                  </motion.div>
                  <div className="mt-4 flex items-center justify-between">
                    {showSkip ? (
                      <button
                        onClick={endTour}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Skip tour
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <Button variant="outline" size="sm" onClick={previousStep}>
                          Previous
                        </Button>
                      )}
                      <Button size="sm" onClick={nextStep}>
                        {currentStep === steps.length - 1 ? "Finish" : "Next"}
                      </Button>
                    </div>
                  </div>
                </div>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}

export function TourAlertDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
  const { startTour, steps, isTourCompleted, currentStep } = useTour();

  if (isTourCompleted || steps.length === 0 || currentStep > -1) {
    return null;
  }
  const handleSkip = async () => {
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md p-6">
        <AlertDialogHeader className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <motion.div
              initial={{ scale: 0.7, filter: "blur(10px)" }}
              animate={{
                scale: 1,
                filter: "blur(0px)",
                y: [0, -8, 0],
                rotate: [42, 48, 42],
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                y: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <Torus className="size-32 stroke-1 text-primary" />
            </motion.div>
          </div>
          <AlertDialogTitle className="text-center text-xl font-medium">
            Welcome to the Tour
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground mt-2 text-center text-sm">
            Take a quick tour to learn about the key features and functionality of this application.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-6 space-y-3">
          <Button onClick={() => startTour()} className="w-full">
            Start Tour
          </Button>
          <Button onClick={handleSkip} variant="ghost" className="w-full">
            Skip Tour
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

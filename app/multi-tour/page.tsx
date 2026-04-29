"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Torus } from "lucide-react"

import {
  useTour,
  TourProvider,
  TourDefinition,
  TourStep,
} from "@/components/tour"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { NavActions } from "@/components/nav-actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TOUR_STEPS } from "@/components/tour-constants"

// Intro tour uses selectorId (element IDs) — the original approach
const introSteps: TourStep[] = [
  {
    content: (
      <div>
        <h3 className="font-semibold">Team Switcher</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Switch between your teams and workspaces here.
        </p>
      </div>
    ),
    selectorId: TOUR_STEPS.TEAM_SWITCHER.id,
    position: "right",
    padding: 8,
    borderRadius: 8,
  },
  {
    content: (
      <div>
        <h3 className="font-semibold">Writing Area</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This is your main content area for writing and editing.
        </p>
      </div>
    ),
    selectorId: TOUR_STEPS.WRITING_AREA.id,
    position: "left",
    padding: 12,
    borderRadius: 12,
  },
];

// Advanced tour uses selector (CSS selectors via data-tour attributes)
const advancedSteps: TourStep[] = [
  {
    content: (
      <div>
        <h3 className="font-semibold">Ask AI</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Use the AI assistant to help with your tasks.
        </p>
      </div>
    ),
    selector: TOUR_STEPS.ASK_AI.selector,
    position: "bottom",
    padding: 10,
    borderRadius: 10,
    showSkip: false,
  },
  {
    content: (
      <div>
        <h3 className="font-semibold">Favorites</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Quickly access your favorite pages from the sidebar.
        </p>
      </div>
    ),
    selector: TOUR_STEPS.FAVORITES.selector,
    position: "right",
    padding: 8,
    borderRadius: 8,
  },
  {
    content: (
      <div>
        <h3 className="font-semibold">Team Switcher</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You can also manage team settings from here.
        </p>
      </div>
    ),
    selector: TOUR_STEPS.TEAM_SWITCHER.selector,
    position: "right",
    padding: 8,
    borderRadius: 8,
  },
];

const tours: TourDefinition[] = [
  { id: "intro", steps: introSteps },
  { id: "advanced", steps: advancedSteps },
];

function TourChoiceDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { startTour, isTourCompleted, isActive } = useTour();

  if (isTourCompleted || isActive) return null;

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
            Choose a Tour
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground mt-2 text-center text-sm">
            Pick a tour to explore different parts of the application.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => {
              startTour("intro");
              setIsOpen(false);
            }}
            className="w-full"
          >
            Intro Tour
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              startTour("advanced");
              setIsOpen(false);
            }}
            className="w-full"
          >
            Advanced Tour
          </Button>
          <Button onClick={() => setIsOpen(false)} variant="ghost" className="w-full">
            Skip Tour
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MultiTourContent() {
  const [openTour, setOpenTour] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpenTour(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SidebarProvider>
      <TourChoiceDialog isOpen={openTour} setIsOpen={setOpenTour} />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Project Management & Task Tracking
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <NavActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 py-10">
          <div id={TOUR_STEPS.WRITING_AREA.id} className="max-w-3xl p-3 space-y-4 h-full w-full mx-auto">
            <h1 className="text-4xl font-bold">Hello World</h1>
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur distinctio repudiandae earum veritatis architecto? Molestiae, tenetur perferendis fugit aliquam, debitis non dolores earum illum suscipit deserunt sunt est deleniti tempora?
            </p>
            <br />
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur distinctio repudiandae earum veritatis architecto? Molestiae, tenetur perferendis fugit aliquam, debitis non dolores earum illum suscipit deserunt sunt est deleniti tempora?
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MultiTourPage() {
return (
    <TourProvider
      closeable
      tours={tours}
      onStart={(id) => console.log(`[tour] onStart: ${id}`)}
      onStepChange={(id, step) => console.log(`[tour] onStepChange: ${id} → step ${step}`)}
      onComplete={(id) => console.log(`[tour] onComplete: ${id}`)}
      onSkip={(id, step) => console.log(`[tour] onSkip: ${id} at step ${step}`)}
    >
      <MultiTourContent />
    </TourProvider>
  );
}

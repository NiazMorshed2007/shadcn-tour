"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { TOUR_STEP_IDS } from "@/components/tour-constants"
import { TourAlertDialog, TourStep, useTour } from "@/components/tour"
import { NavActions } from "@/components/nav-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"


const steps: TourStep[] = [
  {
    content: <div>Team Switcher</div>,
    selectorId: TOUR_STEP_IDS.TEAM_SWITCHER,
    position: "right",
    onClickWithinArea: () => { },
  },
  {
    content: <div>Writing Area</div>,
    selectorId: TOUR_STEP_IDS.WRITING_AREA,
    position: "left",
    onClickWithinArea: () => { },
  },
  {
    content: <div>Ask AI</div>,
    selectorId: TOUR_STEP_IDS.ASK_AI,
    position: "bottom",
    onClickWithinArea: () => { },
  },
  {
    content: <div>Quicly access your favorite pages</div>,
    selectorId: TOUR_STEP_IDS.FAVORITES,
    position: "right",
    onClickWithinArea: () => { },
  },
];

export default function Page() {
  const [openTour, setOpenTour] = useState(false);
  const { setSteps } = useTour();

  useEffect(() => {
    setSteps(steps);
    const timer = setTimeout(() => {
      setOpenTour(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [setSteps]);


  return (
    <SidebarProvider>
      <TourAlertDialog isOpen={openTour} setIsOpen={setOpenTour} />
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
          <div id={TOUR_STEP_IDS.WRITING_AREA} className="max-w-3xl p-3 space-y-4 h-full w-full mx-auto">
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
  )
}

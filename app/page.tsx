"use client"

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Copy, Star } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Home() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("pnpx shadcn add https://tour.niazmorshed.dev/tour.json");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-40 flex flex-col gap-4 items-center justify-center">
      <h1 className="text-5xl font-bold">Shadcn/tour</h1>
      <p className="text-muted-foreground">
        Make your own product tour with shadcn/tour.
      </p>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button>Open Example</Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="center">
            <div className="flex flex-col gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Standard
                </Button>
              </Link>
              <Link href="/multi-tour">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Multi-Tour
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
        <Link href="https://github.com/NiazMorshed2007/shadcn-tour" target="_blank">
          <Button variant={"outline"}>
            <Star className="w-4 h-4" />
            Star on GitHub
          </Button>
        </Link>
      </div>


      <div className="mt-10 px-4 relative pr-12 rounded-xl border font-mono text-sm shadow-lg p-2 max-w-sm md:max-w-xl">
        <div className="overflow-x-auto whitespace-nowrap">
          <span className="text-muted-foreground">$</span>{" "}
          <span className="text-purple-500">pnpx</span>{" "}
          <span className="text-muted-foreground"> shadcn add
            https://tour.niazmorshed.dev/tour.json
          </span>
        </div>
        <Button
          size={"icon"}
          variant={"ghost"}
          className="absolute right-1 top-1 size-7"
          onClick={handleCopy}
        >
          {copied ? <Check className={"size-4"} /> : <Copy className={"size-4"} />}
        </Button>
      </div>
    </div>
  );
}

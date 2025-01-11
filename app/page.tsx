"use client"

import { Button } from "@/components/ui/button";
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
        <Link href="/dashboard" target="_blank">
          <Button>Open Example</Button>
        </Link>
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

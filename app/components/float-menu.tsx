"use client"

import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function FloatMenu() {
  return (
    <div className="fixed bottom-6 right-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white dark:bg-background rounded-full shadow-lg group relative border-primary/20"
              onClick={() => window.open("https://github.com/mmaxou/Moemail-for-University", "_blank")}
            >
              <Github 
                className="w-4 h-4 transition-all duration-300 text-primary group-hover:scale-110"
              />
              <span className="sr-only">获取网站源代码</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>获取网站源代码</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
} 
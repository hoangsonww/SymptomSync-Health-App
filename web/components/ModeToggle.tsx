import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ModeToggleProps = {
  isExpanded?: boolean;
};

export function ModeToggle({ isExpanded = true }: ModeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`w-full flex items-center transition-colors cursor-pointer rounded ${
            isExpanded
              ? "items-center gap-3 px-4 py-3 hover:bg-white/10"
              : "justify-center p-3 hover:bg-white/10"
          }`}
          aria-label="Toggle theme menu"
        >
          <div className="flex-shrink-0 flex justify-center items-center w-5 h-5 relative">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          {isExpanded && (
            <span className="whitespace-nowrap transition-opacity duration-200 block text-base font-medium">
              Theme
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setTheme("light");
          }}
          className="cursor-pointer"
        >
          <Sun className="h-5 w-5" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setTheme("dark");
          }}
          className="cursor-pointer"
        >
          <Moon className="h-5 w-5" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setTheme("system");
          }}
          className="cursor-pointer"
        >
          <Laptop className="h-5 w-5" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

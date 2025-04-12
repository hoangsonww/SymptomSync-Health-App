import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    console.log("Popover open state changed:", open);
  }, [open]);

  const formattedDate = value ? format(value, "PPP") : "Pick a date";

  return (
    <Popover
      open={open}
      onOpenChange={(newState) => {
        console.log("Popover onOpenChange called with:", newState);
        setOpen(newState);
      }}
    >
      <PopoverTrigger asChild className="cursor-pointer">
        <div onClick={() => console.log("PopoverTrigger wrapper clicked")}>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left cursor-pointer",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formattedDate : "Pick a date"}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto p-0 z-50 rounded-md"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            console.log("Calendar date selected:", d);
            if (d) {
              onChange(d);
              console.log("Date changed. Closing popover.");
              setOpen(false);
            }
          }}
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
}

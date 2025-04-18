import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CustomTimePicker({
  value,
  onChange,
  className,
}: CustomTimePickerProps) {
  const [initialHour, initialMinute] = value ? value.split(":") : ["00", "00"];
  const [localHour, setLocalHour] = React.useState(initialHour);
  const [localMinute, setLocalMinute] = React.useState(initialMinute);

  React.useEffect(() => {
    const [h, m] = value.split(":");
    setLocalHour(h);
    setLocalMinute(m);
  }, [value]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalHour(e.target.value);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMinute(e.target.value);
  };

  const handleHourBlur = () => {
    let num = parseInt(localHour, 10);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(num, 23));
    const paddedHour = num.toString().padStart(2, "0");
    setLocalHour(paddedHour);
    const paddedMinute = localMinute.padStart(2, "0");
    onChange(`${paddedHour}:${paddedMinute}`);
  };

  const handleMinuteBlur = () => {
    let num = parseInt(localMinute, 10);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(num, 59));
    const paddedMinute = num.toString().padStart(2, "0");
    setLocalMinute(paddedMinute);
    const paddedHour = localHour.padStart(2, "0");
    onChange(`${paddedHour}:${paddedMinute}`);
  };

  return (
    <div className="flex flex-col">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "w-full border cursor-pointer bg-background text-foreground hover:text-white",
              className,
            )}
          >
            {value || "Select time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-4 rounded-md">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={localHour}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              maxLength={2}
              className="border rounded p-2 w-16 text-center"
              placeholder="HH"
            />
            <span>:</span>
            <input
              type="text"
              value={localMinute}
              onChange={handleMinuteChange}
              onBlur={handleMinuteBlur}
              maxLength={2}
              className="border rounded p-2 w-16 text-center"
              placeholder="MM"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

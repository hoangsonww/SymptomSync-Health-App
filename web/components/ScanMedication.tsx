import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Camera } from "lucide-react";
import {
  BrowserMultiFormatReader,
  Result,
  NotFoundException,
  ChecksumException,
  FormatException,
} from "@zxing/library";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MedInfo {
  name: string;
  dosage: string;
  unit: string;
}

interface BarcodeScanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (info: MedInfo) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const entryToMed = (entry: any): MedInfo => ({
  name: entry.title ?? "Unknown",
  dosage: entry.published_date ?? "—",
  unit: "",
});

export const BarcodeScanModal: React.FC<BarcodeScanModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualDosage, setManualDosage] = useState("");
  const [manualUnit, setManualUnit] = useState("mg");

  const startScanner = () => {
    readerRef.current?.reset();
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .getVideoInputDevices()
      .then((devices) => {
        if (!devices.length) {
          toast.error("No camera found");
          return;
        }
        reader.decodeFromInputVideoDeviceContinuously(
          devices[0].deviceId,
          videoRef.current!,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: Result | undefined, error: any) => {
            if (result) {
              reader.reset();
              const code = result.getText();
              setScannedCode(code);
              lookup(code);
            } else if (
              error &&
              !(error instanceof NotFoundException) &&
              !(error instanceof ChecksumException) &&
              !(error instanceof FormatException)
            ) {
              console.error(error);
              toast.error("Camera error");
              reader.reset();
            }
          },
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error("Unable to access camera");
      });
  };

  useEffect(() => {
    if (!open) return;
    setResults(null);
    setSelected(null);
    setScannedCode(null);
    setFallback(false);
    setManualName("");
    setManualDosage("");
    setManualUnit("mg");
    startScanner();
    return () => {
      readerRef.current?.reset();
      readerRef.current = null;
    };
  }, [open]);

  const lookup = async (ndc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/med?ndc=${ndc}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();

      if (Array.isArray(data) && data.length) {
        setResults(data);
        setSelected(data.length === 1 ? 0 : null);
        toast.success(
          `Found ${data.length} result${data.length > 1 ? "s" : ""}`,
        );
      } else {
        setFallback(true);
        toast.error("No record found – enter manually");
      }
    } catch {
      setFallback(true);
      toast.error("Lookup failed – enter manually");
    } finally {
      setLoading(false);
    }
  };

  const confirmManual = () => {
    if (!manualName.trim()) {
      toast.error("Name is required");
      return;
    }
    onConfirm({
      name: manualName.trim(),
      dosage: manualDosage.trim() || "—",
      unit: manualUnit,
    });
    onClose();
  };

  const confirmSelected = () => {
    if (selected == null || !results) return;
    onConfirm(entryToMed(results[selected]));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>📷 Scan Medication Barcode/QR Code</DialogTitle>
          <DialogDescription>
            Align the barcode/QR code in the frame below.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1 space-y-4 pl-1">
          {!results && !loading && !fallback && (
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden ring-2 ring-primary/50">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Camera className="w-14 h-14 animate-pulse" />
              </div>
            </div>
          )}

          {scannedCode && (
            <p className="text-xs text-muted-foreground">
              Scanned: <code>{scannedCode}</code>
            </p>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}

          {results && (
            <p className="text-sm font-medium">
              Now pick the correct product from the list below and we&apos;ll
              fill in the details for you:
            </p>
          )}

          {results?.map((entry, idx) => {
            const img =
              Array.isArray(entry.images) && entry.images.length
                ? entry.images[0]
                : null;
            const isSelected = selected === idx;
            return (
              <div
                key={idx}
                className={cn(
                  "border rounded-lg p-4 flex gap-4 cursor-pointer transition",
                  isSelected
                    ? "bg-primary/60 dark:bg-primary/50 ring-2 ring-primary/80"
                    : "hover:bg-muted/40",
                )}
                onClick={() => setSelected(idx)}
              >
                {img && (
                  <img
                    src={img}
                    alt={entry.title}
                    className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium",
                      isSelected && "text-foreground",
                    )}
                  >
                    {entry.title}
                  </h3>
                  {entry.published_date && (
                    <p
                      className={cn(
                        "text-sm",
                        isSelected
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {entry.published_date}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {results && (
            <p className="text-xs italic text-muted-foreground">
              *Please double-check this information — automated look-ups can be
              imperfect.
            </p>
          )}

          {fallback && (
            <>
              <p className="text-sm text-muted-foreground">
                Couldn’t find <code>{scannedCode}</code>. Enter manually:
              </p>
              <Input
                placeholder="Name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Dosage / published date"
                  value={manualDosage}
                  onChange={(e) => setManualDosage(e.target.value)}
                />
                <Select value={manualUnit} onValueChange={setManualUnit}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="none">—</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2 mt-4">
          {!results && !fallback && (
            <Button
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          )}

          {results && !fallback && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  setResults(null);
                  setSelected(null);
                  setScannedCode(null);
                  startScanner();
                }}
                className="cursor-pointer"
              >
                Rescan
              </Button>
              <Button
                disabled={selected == null}
                onClick={confirmSelected}
                className="cursor-pointer"
              >
                Confirm
              </Button>
            </>
          )}

          {fallback && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFallback(false);
                  setScannedCode(null);
                  startScanner();
                }}
              >
                Rescan
              </Button>
              <Button onClick={confirmManual}>Confirm Manual</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expand, X } from "lucide-react";

interface LeadSheetViewerProps {
  imageUrl: string;
  title: string;
}

export default function LeadSheetViewer({ imageUrl, title }: LeadSheetViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      <div className="relative group">
        <img
          src={imageUrl}
          alt={`Lead sheet for ${title}`}
          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsExpanded(true)}
        >
          <Expand className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={imageUrl}
              alt={`Lead sheet for ${title}`}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
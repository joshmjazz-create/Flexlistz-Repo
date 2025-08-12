import { useState, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { browserStorage } from "@/lib/browser-storage";

interface BrowserFileUploaderProps {
  maxFileSize?: number;
  onComplete?: (fileId: string) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function BrowserFileUploader({
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
}: BrowserFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpe?g)$/)) {
      alert('Please select a PNG or JPEG image file');
      return;
    }

    setIsUploading(true);
    
    try {
      const fileId = await browserStorage.storeFile(file);
      onComplete?.(fileId);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : children}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
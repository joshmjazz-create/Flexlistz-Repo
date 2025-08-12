import { useState, useEffect } from "react";
import { browserStorage } from "@/lib/browser-storage";

interface BrowserImageProps {
  fileId: string | null;
  alt?: string;
  className?: string;
}

export function BrowserImage({ fileId, alt = "Lead sheet", className = "" }: BrowserImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await browserStorage.getFileUrl(fileId);
        if (url) {
          setImageUrl(url);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [fileId]);

  if (!fileId) {
    return null;
  }

  if (loading) {
    return <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}>Loading...</div>;
  }

  if (error || !imageUrl) {
    return <div className={`bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center ${className}`}>Image not found</div>;
  }

  return <img src={imageUrl} alt={alt} className={className} />;
}
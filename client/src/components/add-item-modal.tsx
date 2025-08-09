import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseMediaLink } from "@/utils/parseMediaLink";
import ItemForm from "./item-form";
import { useState } from "react";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
}

export default function AddItemModal({ isOpen, onClose, collectionId }: AddItemModalProps) {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}/items`] });
      // Invalidate field-values queries so autocomplete gets updated immediately
      queryClient.invalidateQueries({ queryKey: ["/api/field-values/key"] });
      queryClient.invalidateQueries({ queryKey: ["/api/field-values/composer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/field-values/style"] });
      onClose();
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (formData: any) => {
    // Parse media URL if provided
    const mediaData = formData.mediaUrl.trim() ? parseMediaLink(formData.mediaUrl) : {};

    createItemMutation.mutate({
      collectionId,
      title: formData.title.trim(),
      key: formData.key.trim() || null,
      composer: formData.composer.trim() || null,
      style: formData.style.trim() || null,
      notes: formData.notes.trim() || null,
      leadSheetUrl: formData.leadSheetUrl.trim() || null,
      extraTags: formData.extraTags.filter((tag: any) => tag.key.trim() && tag.value.trim()),
      knowledgeLevel: formData.knowledgeLevel || 'does-not-know',
      ...mediaData,
    });
    
    // Reset unsaved changes flag after successful save
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndExit = () => {
    if (pendingFormData) {
      handleSubmit(pendingFormData);
    }
    setShowConfirmDialog(false);
  };

  const handleExitWithoutSaving = () => {
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
    onClose();
  };

  const handleFormChange = (formData: any) => {
    setHasUnsavedChanges(true);
    setPendingFormData(formData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          
          <ItemForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            onChange={handleFormChange}
            isSubmitting={createItemMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Changes?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have unsaved changes. Do you want to save your changes before closing?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExitWithoutSaving}>
              Exit Without Saving
            </Button>
            <Button onClick={handleSaveAndExit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
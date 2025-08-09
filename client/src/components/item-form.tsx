import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Upload, Image } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import AutocompleteInput from "./autocomplete-input";

interface ExtraTag {
  key: string;
  value: string;
}

interface FormData {
  title: string;
  key: string;
  composer: string;
  style: string;
  notes: string;
  leadSheetUrl: string;
  mediaUrl: string;
  knowledgeLevel: string;
  extraTags: ExtraTag[];
}

interface ItemFormProps {
  initial?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onChange?: (data: FormData) => void;
  isSubmitting?: boolean;
}

export default function ItemForm({ initial, onSubmit, onCancel, onChange, isSubmitting = false }: ItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: initial?.title || "",
    key: initial?.key || "",
    composer: initial?.composer || "",
    style: initial?.style || "",
    notes: initial?.notes || "",
    leadSheetUrl: initial?.leadSheetUrl || "",
    mediaUrl: initial?.mediaUrl || "",
    knowledgeLevel: initial?.knowledgeLevel || "does-not-know",
    extraTags: initial?.extraTags || [],
  });

  const queryClient = useQueryClient();

  // Handle lead sheet upload
  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      // Normalize the URL to get the object path
      const response = await fetch("/api/lead-sheets", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadSheetURL: uploadURL }),
      });
      const data = await response.json();
      
      // Update the form data with the normalized object path
      const newFormData = { ...formData, leadSheetUrl: data.objectPath };
      setFormData(newFormData);
      onChange?.(newFormData);
    }
  };

  // Fetch available tag keys for autocomplete
  const { data: tagKeys = [] } = useQuery<string[]>({
    queryKey: ["/api/tags/keys"],
  });

  // Fetch values for specific keys
  const getTagValues = (key: string) => {
    return useQuery({
      queryKey: ["/api/tags/values", key],
      enabled: !!key.trim(),
    });
  };

  const updateField = (field: keyof Omit<FormData, 'extraTags'>, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onChange?.(newFormData);
  };

  const addExtraTag = () => {
    const newFormData = {
      ...formData,
      extraTags: [...formData.extraTags, { key: "", value: "" }]
    };
    setFormData(newFormData);
    onChange?.(newFormData);
  };

  const updateExtraTag = (index: number, field: 'key' | 'value', value: string) => {
    const newFormData = {
      ...formData,
      extraTags: formData.extraTags.map((tag, i) => 
        i === index ? { ...tag, [field]: value } : tag
      )
    };
    setFormData(newFormData);
    onChange?.(newFormData);
  };

  const removeExtraTag = (index: number) => {
    const newFormData = {
      ...formData,
      extraTags: formData.extraTags.filter((_, i) => i !== index)
    };
    setFormData(newFormData);
    onChange?.(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fixed Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Song Details</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter song title"
              required
            />
          </div>

          <div>
            <Label htmlFor="key">Key</Label>
            <AutocompleteInput
              field="key"
              value={formData.key}
              onChange={(value) => updateField('key', value)}
            />
          </div>

          <div>
            <Label htmlFor="composer">Composer</Label>
            <AutocompleteInput
              field="composer"
              value={formData.composer}
              onChange={(value) => updateField('composer', value)}
            />
          </div>

          <div>
            <Label htmlFor="style">Style</Label>
            <AutocompleteInput
              field="style"
              value={formData.style}
              onChange={(value) => updateField('style', value)}
            />
          </div>

          <div>
            <Label>Lead Sheet (Upload Image)</Label>
            <div className="space-y-2">
              {formData.leadSheetUrl && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                  <Image className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">Lead sheet uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateField('leadSheetUrl', '')}
                    className="ml-auto text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{formData.leadSheetUrl ? 'Replace Lead Sheet' : 'Upload Lead Sheet'}</span>
                </div>
              </ObjectUploader>
              <p className="text-xs text-gray-500">
                Upload a .png or .jpg image of the lead sheet
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="knowledgeLevel">Knowledge Level</Label>
            <Select value={formData.knowledgeLevel} onValueChange={(value) => updateField('knowledgeLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select knowledge level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="does-not-know">Learning</SelectItem>
                <SelectItem value="kind-of-knows">Kind of Knows</SelectItem>
                <SelectItem value="knows">Knows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="mediaUrl">Media URL (YouTube or Spotify)</Label>
          <Input
            id="mediaUrl"
            value={formData.mediaUrl}
            onChange={(e) => updateField('mediaUrl', e.target.value)}
            placeholder="Paste YouTube or Spotify URL"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add any notes or comments"
            rows={3}
          />
        </div>
      </div>

      {/* Extra Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Additional Tags</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExtraTag}
            className="text-gray-900 dark:text-gray-100"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Tag
          </Button>
        </div>

        {formData.extraTags.length > 0 && (
          <div className="space-y-3">
            {formData.extraTags.map((tag, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={tag.key}
                    onChange={(e) => updateExtraTag(index, 'key', e.target.value)}
                    placeholder="Tag name (e.g., Era, Tempo)"
                    list={`keys-datalist-${index}`}
                  />
                  <datalist id={`keys-datalist-${index}`}>
                    {tagKeys.map((key: string) => (
                      <option key={key} value={key} />
                    ))}
                  </datalist>
                </div>
                
                <div className="flex-1">
                  <Input
                    value={tag.value}
                    onChange={(e) => updateExtraTag(index, 'value', e.target.value)}
                    placeholder="Tag value (e.g., 1950s, Slow)"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExtraTag(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {formData.extraTags.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No additional tags. Use the "Add Tag" button to add custom attributes.
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !formData.title.trim()} className="text-gray-900 dark:text-gray-100">
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="text-gray-900 dark:text-gray-100">
          Cancel
        </Button>
      </div>
    </form>
  );
}
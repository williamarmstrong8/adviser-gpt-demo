import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';
import { generateDraftTitle } from '@/utils/draftUtils';
import { SavedDraft, UploadedFile } from '@/types/drafts';

interface SaveDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  prompt?: string;
  sampleFile?: UploadedFile | null;
  informationalFiles?: UploadedFile[];
  includeWebSources?: boolean;
  onSaved?: () => void;
}

export function SaveDraftDialog({
  open,
  onOpenChange,
  content,
  prompt,
  sampleFile,
  informationalFiles,
  includeWebSources,
  onSaved,
}: SaveDraftDialogProps) {
  const { saveDraft } = useDrafts();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Generate title when dialog opens
  useEffect(() => {
    if (open && content) {
      const generatedTitle = generateDraftTitle(content);
      setTitle(generatedTitle);
      setDescription('');
    }
  }, [open, content]);

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Draft content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required.',
        variant: 'destructive',
      });
      return;
    }

    const savedDraft = saveDraft({
      title: title.trim(),
      content: content.trim(),
      prompt: prompt?.trim() || undefined,
      sampleFile: sampleFile
        ? {
            name: sampleFile.name,
            type: sampleFile.type,
            size: sampleFile.size,
          }
        : undefined,
      informationalFiles:
        informationalFiles && informationalFiles.length > 0
          ? informationalFiles.map((f) => ({
              name: f.name,
              type: f.type,
              size: f.size,
            }))
          : undefined,
      includeWebSources: includeWebSources || false,
      description: description.trim() || undefined,
      isShared: false,
    });

    toast({
      title: 'Draft saved ✓',
      description: `"${savedDraft.title}" has been saved.`,
    });

    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Draft</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this draft"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help you remember this draft"
              className="mt-1 min-h-20 resize-none"
            />
          </div>

          <div className="text-sm text-foreground/70 bg-foreground/5 p-3 rounded-lg">
            <p className="font-medium mb-1">Draft preview:</p>
            <p className="text-xs">{content.length > 200 ? `${content.substring(0, 200)}...` : content}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
              Save Draft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

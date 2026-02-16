import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';
import { generatePromptTitle } from '@/utils/draftUtils';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SavePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  onSaved?: () => void;
}

export function SavePromptDialog({ open, onOpenChange, prompt, onSaved }: SavePromptDialogProps) {
  const { savePrompt } = useDrafts();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Generate title when dialog opens
  useEffect(() => {
    if (open && prompt) {
      const generatedTitle = generatePromptTitle(prompt);
      setTitle(generatedTitle);
      setDescription('');
      setTags([]);
      setTagInput('');
    }
  }, [open, prompt]);

  const handleSave = () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Prompt cannot be empty.',
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

    const savedPrompt = savePrompt({
      title: title.trim(),
      prompt: prompt.trim(),
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isShared: false,
    });

    toast({
      title: 'Prompt saved ✓',
      description: `"${savedPrompt.title}" has been saved.`,
    });

    onOpenChange(false);
    onSaved?.();
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Prompt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this prompt"
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
              placeholder="Add a description to help you remember this prompt"
              className="mt-1 min-h-20 resize-none"
            />
          </div>


          <div className="text-sm text-foreground/70 bg-foreground/5 p-3 rounded-lg">
            <p className="font-medium mb-1">Prompt preview:</p>
            <p className="text-xs">{prompt.length > 200 ? `${prompt.substring(0, 200)}...` : prompt}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim() || !prompt.trim()}>
              Save Prompt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

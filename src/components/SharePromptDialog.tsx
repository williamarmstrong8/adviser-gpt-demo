import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';

interface SharePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
}

export function SharePromptDialog({ open, onOpenChange, promptId }: SharePromptDialogProps) {
  const { sharePrompt } = useDrafts();
  const { toast } = useToast();

  const handleShare = () => {
    sharePrompt(promptId);
    toast({
      title: 'Prompt shared ✓',
      description: 'This prompt is now visible to everyone in your firm.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Prompt with Firm</DialogTitle>
          <DialogDescription>
            This prompt will be visible to everyone in your firm. They will be able to use it but cannot edit or delete it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare}>
            Share Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

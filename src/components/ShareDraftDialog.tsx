import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';

interface ShareDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
}

export function ShareDraftDialog({ open, onOpenChange, draftId }: ShareDraftDialogProps) {
  const { shareDraft } = useDrafts();
  const { toast } = useToast();

  const handleShare = () => {
    shareDraft(draftId);
    toast({
      title: 'Draft shared ✓',
      description: 'This draft is now visible to everyone in your firm.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Draft with Firm</DialogTitle>
          <DialogDescription>
            This draft will be visible to everyone in your firm. They will be able to view and use it but cannot edit or delete it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare}>
            Share Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

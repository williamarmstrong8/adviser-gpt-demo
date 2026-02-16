import { useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SavedDraft } from '@/types/drafts';

interface NewDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  savedDrafts: SavedDraft[];
  onSave: () => void;
  onClear: () => void;
}

export function NewDraftDialog({
  open,
  onOpenChange,
  content,
  savedDrafts,
  onSave,
  onClear,
}: NewDraftDialogProps) {
  // Check if current content matches any saved draft
  const isAlreadySaved = useMemo(() => {
    if (!content.trim()) return false;
    const normalizedContent = content.trim();
    return savedDrafts.some((draft) => draft.content.trim() === normalizedContent);
  }, [content, savedDrafts]);

  const handleSave = () => {
    onOpenChange(false);
    onSave();
  };

  const handleClear = () => {
    onOpenChange(false);
    onClear();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Current Draft?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAlreadySaved ? (
              <>
                This draft is already saved. Clearing it will remove it from the editor, but it will remain in your saved drafts.
                <span className="block mt-2 font-medium text-foreground">
                  Do you want to clear the current draft?
                </span>
              </>
            ) : (
              <>
                You have unsaved changes. Clearing will remove the current draft from the editor.
                <span className="block mt-2 font-medium text-foreground">
                  Would you like to save this draft before clearing?
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          {!isAlreadySaved && (
            <AlertDialogAction onClick={handleSave} className="bg-sidebar-primary hover:bg-sidebar-primary/80">
              Save Draft
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={handleClear} className="bg-foreground hover:bg-foreground/90 text-background">
            {isAlreadySaved ? 'Clear Draft' : 'Clear without Saving'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

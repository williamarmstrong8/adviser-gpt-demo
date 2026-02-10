import React, { useState, useMemo } from 'react';
import { FileText, Search, Edit, Trash2, Share2, X, MoreHorizontal, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ShareDraftDialog } from './ShareDraftDialog';
import { SavedDraft } from '@/types/drafts';

interface SavedDraftsPanelProps {
  onLoadDraft: (draft: SavedDraft) => void;
}

// Format relative time helper
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch {
    return 'Unknown';
  }
};

export function SavedDraftsPanel({ onLoadDraft }: SavedDraftsPanelProps) {
  const { myDrafts, firmDrafts, deleteDraft, shareDraft, unshareDraft } = useDrafts();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');
  const isMine = (d: { userId: string }) => d.userId === profile.email;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [shareDraftId, setShareDraftId] = useState<string | null>(null);

  const filteredDrafts = useMemo(() => {
    const drafts = activeTab === 'my' ? myDrafts : firmDrafts;
    if (!searchQuery.trim()) return drafts;

    const query = searchQuery.toLowerCase();
    return drafts.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.content.toLowerCase().includes(query) ||
        d.prompt?.toLowerCase().includes(query)
    );
  }, [myDrafts, firmDrafts, activeTab, searchQuery]);

  const handleLoad = (draft: SavedDraft) => {
    onLoadDraft(draft);
    toast({
      title: 'Draft loaded',
      description: 'Draft has been loaded into the editor.',
    });
  };

  const handleDelete = (id: string) => {
    setDraftToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (draftToDelete) {
      deleteDraft(draftToDelete);
      toast({
        title: 'Draft deleted',
        description: 'The draft has been deleted.',
      });
      setDraftToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleShare = (id: string) => {
    shareDraft(id);
    toast({
      title: 'Draft shared',
      description: 'The draft has been shared with your firm.',
    });
  };

  const handleUnshare = (id: string) => {
    unshareDraft(id);
    toast({
      title: 'Draft unshared',
      description: 'The draft is now only visible to you.',
    });
  };

  const handleDuplicate = (draft: SavedDraft) => {
    // Create a copy with new ID and timestamp
    const duplicated = {
      ...draft,
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${draft.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      isShared: false,
    };
    // This would need to be added to context - for now just show toast
    toast({
      title: 'Duplicate functionality',
      description: 'Duplication will be available soon.',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-foreground/10">
        <h3 className="text-sm font-semibold mb-3">Saved Drafts</h3>
        <div className="space-y-3">
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'shared')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my" className="text-xs">
                Mine ({myDrafts.length})
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">
                Shared ({firmDrafts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredDrafts.length === 0 ? (
          <div className="text-center py-8 text-sm text-foreground/70">
            {searchQuery ? (
              <>
                <p>No drafts found matching "{searchQuery}"</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </>
            ) : (
              <p>
                {activeTab === 'my'
                  ? "You haven't saved any drafts yet."
                  : 'No shared drafts available.'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="group flex items-start gap-3 p-3 border border-foreground/10 rounded-lg hover:bg-sidebar-background/70 transition"
              >
                <FileText className="h-5 w-5 text-foreground/70 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{draft.title}</h4>
                    {draft.isShared && (
                      <Badge variant="secondary" className="text-xs">
                        Shared
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-foreground/70 mb-2 line-clamp-2">
                    {draft.content.length > 200 ? `${draft.content.substring(0, 200)}...` : draft.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <span>Created {formatDate(draft.createdAt)}</span>
                    {draft.lastModifiedAt !== draft.createdAt && (
                      <>
                        <span>•</span>
                        <span>Modified {formatDate(draft.lastModifiedAt)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{draft.createdBy}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleLoad(draft)}>
                      Load
                    </DropdownMenuItem>
                    {draft.isShared && isMine(draft) && (
                      <DropdownMenuItem onClick={() => handleUnshare(draft.id)}>
                        <X className="h-4 w-4 mr-2" />
                        Unshare
                      </DropdownMenuItem>
                    )}
                    {activeTab === 'my' && (
                      <>
                        {!draft.isShared && (
                          <DropdownMenuItem onClick={() => setShareDraftId(draft.id)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(draft)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(draft.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDraftToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      {shareDraftId && (
        <ShareDraftDialog
          open={!!shareDraftId}
          onOpenChange={(open) => !open && setShareDraftId(null)}
          draftId={shareDraftId}
        />
      )}
    </div>
  );
}

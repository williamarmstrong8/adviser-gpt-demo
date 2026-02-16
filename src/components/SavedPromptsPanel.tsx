import React, { useState, useMemo } from 'react';
import { PlusCircle, Search, Edit, Trash2, Share2, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrafts } from '@/contexts/DraftsContext';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
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
import { SavePromptDialog } from '@/components/SavePromptDialog';
import { SharePromptDialog } from '@/components/SharePromptDialog';

interface SavedPromptsPanelProps {
  onLoadPrompt: (prompt: string) => void;
}

export function SavedPromptsPanel({ onLoadPrompt }: SavedPromptsPanelProps) {
  const { myPrompts, firmPrompts, savedPrompts, deletePrompt, sharePrompt, unsharePrompt, updatePrompt } = useDrafts();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');
  const isMine = (p: { userId: string }) => p.userId === profile.email;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [editPromptId, setEditPromptId] = useState<string | null>(null);
  const [sharePromptId, setSharePromptId] = useState<string | null>(null);

  const filteredPrompts = useMemo(() => {
    const prompts = activeTab === 'my' ? myPrompts : firmPrompts;
    if (!searchQuery.trim()) return prompts;

    const query = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.prompt.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [myPrompts, firmPrompts, activeTab, searchQuery]);

  const handleLoad = (prompt: string) => {
    onLoadPrompt(prompt);
    toast({
      title: 'Prompt loaded',
      description: 'Prompt has been loaded into the editor.',
    });
  };

  const handleDelete = (id: string) => {
    setPromptToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete);
      toast({
        title: 'Prompt deleted',
        description: 'The prompt has been deleted.',
      });
      setPromptToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleShare = (id: string) => {
    sharePrompt(id);
    toast({
      title: 'Prompt shared',
      description: 'The prompt has been shared with your firm.',
    });
  };

  const handleUnshare = (id: string) => {
    unsharePrompt(id);
    toast({
      title: 'Prompt unshared',
      description: 'The prompt is now only visible to you.',
    });
  };

  const handleEdit = (prompt: typeof myPrompts[0]) => {
    setEditPromptId(prompt.id);
  };

  const promptBeingDeleted = promptToDelete ? savedPrompts.find((p) => p.id === promptToDelete) : null;
  const isDeletingSharedPrompt = promptBeingDeleted?.isShared ?? false;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-foreground/10">
        <h3 className="text-sm font-semibold mb-3">Saved Prompts</h3>
        <div className="space-y-3">
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'shared')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my" className="text-xs">
                Mine ({myPrompts.length})
              </TabsTrigger>
              <TabsTrigger value="shared" className="text-xs">
                Shared ({firmPrompts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-8 text-sm text-foreground/70">
            {searchQuery ? (
              <>
                <p>No prompts found matching "{searchQuery}"</p>
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
                  ? "You haven't saved any prompts yet."
                  : 'No shared prompts available.'}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="group relative p-3 border border-foreground/10 rounded-lg hover:bg-sidebar-background/70 transition cursor-pointer"
                onClick={() => handleLoad(prompt.prompt)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">{prompt.title}</h4>
                      {prompt.isShared && (
                        <Badge variant="secondary" className="text-xs">
                          Shared
                        </Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-xs text-foreground/70 mb-2 line-clamp-2">
                        {prompt.description}
                      </p>
                    )}
                    <p className="text-xs text-foreground/60 line-clamp-2 mb-2">
                      {prompt.prompt}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {prompt.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {prompt.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{prompt.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-foreground/50">
                        {formatDate(prompt.createdAt)} • {prompt.createdBy}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(prompt.prompt);
                      }}>
                        Load
                      </DropdownMenuItem>
                      {prompt.isShared && isMine(prompt) && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleUnshare(prompt.id);
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Unshare
                        </DropdownMenuItem>
                      )}
                      {activeTab === 'my' && (
                        <>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(prompt);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!prompt.isShared && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSharePromptId(prompt.id);
                            }}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(prompt.id);
                            }}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
              {isDeletingSharedPrompt && (
                <span className="block mt-2 font-medium text-foreground">
                  This prompt is shared with your firm. Deleting it will remove it from the shared list for everyone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      {sharePromptId && (
        <SharePromptDialog
          open={!!sharePromptId}
          onOpenChange={(open) => !open && setSharePromptId(null)}
          promptId={sharePromptId}
        />
      )}
    </div>
  );
}

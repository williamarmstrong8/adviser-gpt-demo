import React from 'react';
import { X } from 'lucide-react';
import { diffWords } from 'diff';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChangeHistoryEntry } from '@/types/vault';

interface ChangeHistoryModalProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  currentQuestion?: string;
  currentAnswer?: string;
}

export function ChangeHistoryModal({
  open,
  onClose,
  itemId,
  currentQuestion = '',
  currentAnswer = '',
}: ChangeHistoryModalProps) {
  const [history, setHistory] = React.useState<ChangeHistoryEntry[]>([]);
  
  // Reload history from localStorage when modal opens or itemId changes
  React.useEffect(() => {
    if (open) {
      try {
        const savedHistory = localStorage.getItem('ag_vault_change_history');
        if (savedHistory) {
          const allHistory = JSON.parse(savedHistory);
          const itemHistory = allHistory[itemId] || [];
          setHistory(itemHistory);
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.warn('Failed to load change history:', error);
        setHistory([]);
      }
    }
  }, [open, itemId]);

  // Render diff-highlighted text
  const renderDiffText = (previousText: string, currentText: string) => {
    const diff = diffWords(previousText || '', currentText || '');
    
    return (
      <div className="text-sm leading-relaxed">
        {diff.map((part, index) => {
          if (part.removed) {
            return (
              <span
                key={index}
                className="text-red-600 line-through bg-red-50 px-1 rounded"
              >
                {part.value}
              </span>
            );
          } else if (part.added) {
            return (
              <span
                key={index}
                className="text-green-700 underline decoration-green-700 bg-green-50 px-1 rounded"
              >
                {part.value}
              </span>
            );
          } else {
            return (
              <span key={index} className="text-foreground">
                {part.value}
              </span>
            );
          }
        })}
      </div>
    );
  };

  // Reverse history to show newest first
  const reversedHistory = [...history].reverse();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change History</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {reversedHistory.length === 0 ? (
            <div className="text-center py-8 text-foreground/70">
              No change history available for this item.
            </div>
          ) : (
            reversedHistory.map((entry, index) => {
              // For diff highlighting, compare with previous chronological entry
              // reversedHistory is newest first: [newest, ..., oldest]
              // For entry at index i, compare with entry at index i+1 (the previous chronological entry)
              // For the oldest entry (last in reversed array), there's no previous entry
              const isOldestEntry = index === reversedHistory.length - 1;
              const previousEntry = isOldestEntry ? null : reversedHistory[index + 1];
              
              const previousQuestion = previousEntry?.question || '';
              const previousAnswer = previousEntry?.answer || '';
              
              const entryQuestion = entry.question || '';
              const entryAnswer = entry.answer || '';
              
              const hasQuestionDiff = entryQuestion !== previousQuestion;
              const hasAnswerDiff = entryAnswer !== previousAnswer;
              
              return (
                <div
                  key={`${entry.date}-${index}`}
                  className="border-b border-foreground/20 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">
                        {format(new Date(entry.date), 'MM/dd/yyyy h:mm a')}
                      </div>
                      <div className="text-sm text-foreground/70">
                        {entry.user}
                      </div>
                    </div>
                  </div>
                  
                  {/* Always show question section if entry has question field or it's the oldest entry */}
                  {(entryQuestion !== undefined || isOldestEntry) && (
                    <div className="mb-4">
                      <div className="text-xs font-bold mb-2 text-foreground/70">
                        Question:
                      </div>
                      {isOldestEntry ? (
                        // Oldest entry: show all text as new (green underlined)
                        <div className="text-sm leading-relaxed">
                          <span className="text-green-700 underline decoration-green-700 bg-green-50 px-1 rounded">
                            {entryQuestion || '(empty)'}
                          </span>
                        </div>
                      ) : hasQuestionDiff && previousEntry ? (
                        renderDiffText(previousQuestion, entryQuestion)
                      ) : (
                        <div className="text-sm leading-relaxed text-foreground">
                          {entryQuestion || '(empty)'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Always show answer section if entry has answer field or it's the oldest entry */}
                  {(entryAnswer !== undefined || isOldestEntry) && (
                    <div>
                      <div className="text-xs font-bold mb-2 text-foreground/70">
                        Answer:
                      </div>
                      {isOldestEntry ? (
                        // Oldest entry: show all text as new (green underlined)
                        <div className="text-sm leading-relaxed">
                          <span className="text-green-700 underline decoration-green-700 bg-green-50 px-1 rounded">
                            {entryAnswer || '(empty)'}
                          </span>
                        </div>
                      ) : hasAnswerDiff && previousEntry ? (
                        renderDiffText(previousAnswer, entryAnswer)
                      ) : (
                        <div className="text-sm leading-relaxed text-foreground">
                          {entryAnswer || '(empty)'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


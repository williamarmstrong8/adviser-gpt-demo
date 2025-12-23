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
import { useChangeHistory } from '@/hooks/useChangeHistory';

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
  const { getChangeHistory } = useChangeHistory();
  const history = getChangeHistory(itemId);

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

  // Get previous entry for comparison (for diff highlighting)
  const getPreviousEntry = (currentIndex: number): ChangeHistoryEntry | null => {
    if (currentIndex === history.length - 1) {
      // This is the most recent entry, compare with current state
      return {
        date: new Date().toISOString(),
        user: '',
        question: currentQuestion || '',
        answer: currentAnswer || '',
      };
    }
    return history[currentIndex + 1] || null;
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
              // For diff highlighting, compare with previous version
              // Since we reversed, index 0 is newest, index 1 is second newest, etc.
              const originalIndex = history.length - 1 - index;
              const previousEntry = getPreviousEntry(originalIndex);
              
              // For the oldest entry (last in reversed array), there's no previous entry
              // So all text should be shown as new (green underlined)
              const isFirstEntry = index === reversedHistory.length - 1;
              
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
                        {format(new Date(entry.date), 'MM/dd/yyyy')}
                      </div>
                      <div className="text-sm text-foreground/70">
                        {entry.user}
                      </div>
                    </div>
                  </div>
                  
                  {/* Always show question section if entry has question field or it's the first entry */}
                  {(entryQuestion !== undefined || isFirstEntry) && (
                    <div className="mb-4">
                      <div className="text-xs font-bold mb-2 text-foreground/70">
                        Question:
                      </div>
                      {isFirstEntry ? (
                        // First entry: show all text as new (green underlined)
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
                  
                  {/* Always show answer section if entry has answer field or it's the first entry */}
                  {(entryAnswer !== undefined || isFirstEntry) && (
                    <div>
                      <div className="text-xs font-bold mb-2 text-foreground/70">
                        Answer:
                      </div>
                      {isFirstEntry ? (
                        // First entry: show all text as new (green underlined)
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


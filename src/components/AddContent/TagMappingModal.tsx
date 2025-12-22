import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTagTypes } from "@/hooks/useTagTypes";
import { Tag } from "@/types/vault";
import { ParsedExcelRow } from "@/utils/excelParser";
import { parseCommaSeparatedValues } from "@/utils/excelParser";
import { TagColumnAnalysis } from "@/types/import";
import { X, Plus, CheckSquare, Square, Check, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TagMappingModalProps {
  open: boolean;
  onClose: () => void;
  rows: ParsedExcelRow[];
  tagColumns: string[]; // Columns that contain tags (comma-separated values)
  onSave: (mappedTags: Record<number, Tag[]>) => void; // row index -> tags
  tagTypeColumnMapping?: Record<string, string>; // maps tag type name to column name
  tagAnalyses?: Record<string, TagColumnAnalysis>; // analysis results from ExcelQAPair
}

interface ColumnTagState {
  tagType: string | null;
  uniqueValues: string[];
  matchedTags: Map<string, { type: string; value: string }>; // value → matched tag
  customMappings: Map<string, { type: string; value: string }>; // value → custom mapped tag
  removedTags: Set<string>; // values to exclude
}

interface TagValueInfo {
  columnName: string;
  value: string;
  isMatched: boolean;
  matchedTag?: { type: string; value: string };
  customMapping?: { type: string; value: string };
  isRemoved: boolean;
}

export function TagMappingModal({
  open,
  onClose,
  rows,
  tagColumns,
  onSave,
  tagTypeColumnMapping,
  tagAnalyses,
}: TagMappingModalProps) {
  const { tagTypes, addTagTypeValue } = useTagTypes();
  
  // Column-based state: column name → ColumnTagState
  const [columnStates, setColumnStates] = useState<Record<string, ColumnTagState>>({});
  
  // Individual tag editing state
  const [editingTag, setEditingTag] = useState<{ column: string; value: string } | null>(null);
  const [editingInput, setEditingInput] = useState<string>("");
  const [editingIsNew, setEditingIsNew] = useState(false);
  
  // Bulk selection state
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set()); // "column:value" keys
  const [bulkActions, setBulkActions] = useState<Record<string, { mapValue: string; createValue: string; isNew: boolean }>>({});
  
  // Tag type change confirmation state
  const [pendingTagTypeChange, setPendingTagTypeChange] = useState<{ columnName: string; newTagType: string } | null>(null);
  
  // Performance optimization: lazy loading and pagination
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedRows, setProcessedRows] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<Record<string, number>>({});
  const ITEMS_PER_PAGE_INITIAL = 50;
  const ITEMS_PER_PAGE_LOAD_MORE = 100;

  // Extract unique values per column - optimized with lazy loading
  const [columnUniqueValues, setColumnUniqueValues] = useState<Record<string, Set<string>>>({});
  
  // Process rows in chunks to avoid blocking UI - updates incrementally
  useEffect(() => {
    if (!open || rows.length === 0) {
      setColumnUniqueValues({});
      setProcessedRows(0);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setProcessedRows(0);
    
    // Initialize with empty sets
    const initialValues: Record<string, Set<string>> = {};
    tagColumns.forEach((columnName) => {
      initialValues[columnName] = new Set<string>();
    });
    setColumnUniqueValues(initialValues);

    let currentIndex = 0;
    const BATCH_SIZE = 100; // Process 100 rows at a time
    
    const processBatch = () => {
      const endIndex = Math.min(currentIndex + BATCH_SIZE, rows.length);
      
      // Process this batch and collect new unique values
      const batchResults: Record<string, Set<string>> = {};
      tagColumns.forEach((columnName) => {
        batchResults[columnName] = new Set<string>();
      });
      
      for (let i = currentIndex; i < endIndex; i++) {
        const row = rows[i];
        tagColumns.forEach((columnName) => {
          const cellValue = row[columnName];
          if (cellValue) {
            const parsedValues = parseCommaSeparatedValues(String(cellValue));
            parsedValues.forEach((value) => {
              const trimmedValue = value.trim();
              if (trimmedValue) {
                batchResults[columnName].add(trimmedValue);
              }
            });
          }
        });
      }
      
      // Update state incrementally with new values
      setColumnUniqueValues((prev) => {
        const updated: Record<string, Set<string>> = {};
        tagColumns.forEach((columnName) => {
          const prevSet = prev[columnName] || new Set<string>();
          const newSet = new Set(prevSet);
          // Add all new values from this batch
          batchResults[columnName].forEach((value) => newSet.add(value));
          updated[columnName] = newSet;
        });
        return updated;
      });
      
      currentIndex = endIndex;
      setProcessedRows(currentIndex);
      
      if (currentIndex < rows.length) {
        // Use requestAnimationFrame for smooth processing
        requestAnimationFrame(processBatch);
      } else {
        setIsProcessing(false);
      }
    };
    
    // Start processing
    requestAnimationFrame(processBatch);
  }, [open, rows, tagColumns]);

  // Initialize and update column states incrementally as data loads
  useEffect(() => {
    if (!open || Object.keys(columnUniqueValues).length === 0) {
      // Reset states when modal closes or no data
      if (!open) {
        setColumnStates({});
        setItemsPerPage({});
        setSelectedTags(new Set());
        setEditingTag(null);
        setBulkActions({});
      }
      return;
    }

    // Update column states with current unique values (incremental updates)
    setColumnStates((prevStates) => {
      const updatedStates: Record<string, ColumnTagState> = { ...prevStates };
      const itemsToInitialize: Record<string, number> = {};
      
      tagColumns.forEach((columnName) => {
        const uniqueValues = Array.from(columnUniqueValues[columnName] || []);
        
        // If this column state doesn't exist yet, initialize it
        if (!updatedStates[columnName]) {
          // Find tag type for this column from tagTypeColumnMapping (reverse lookup)
          let tagType: string | null = null;
          const matchedTagsMap = new Map<string, { type: string; value: string }>();
          
          if (tagTypeColumnMapping) {
            // Find which tag type name maps to this column name
            const tagTypeName = Object.entries(tagTypeColumnMapping).find(
              ([_, colName]) => colName === columnName
            )?.[0];
            
            if (tagTypeName && tagAnalyses && tagAnalyses[tagTypeName]) {
              tagType = tagTypeName;
              const analysis = tagAnalyses[tagTypeName];
              
              // Populate matchedTags from analysis mappings
              analysis.mappings.forEach((mapping) => {
                if (mapping.status === 'matched' && mapping.mappedTagName) {
                  matchedTagsMap.set(mapping.sourceValue, {
                    type: tagTypeName,
                    value: mapping.mappedTagName,
                  });
                }
              });
            }
          }
          
          updatedStates[columnName] = {
            tagType,
            uniqueValues,
            matchedTags: matchedTagsMap,
            customMappings: new Map(),
            removedTags: new Set(),
          };
          
          // Track items per page to initialize
          itemsToInitialize[columnName] = ITEMS_PER_PAGE_INITIAL;
        } else {
          // Update existing state with new unique values (preserve user changes)
          const existingState = updatedStates[columnName];
          const existingValuesSet = new Set(existingState.uniqueValues);
          const newValuesSet = new Set(uniqueValues);
          
          // Only update if there are new values
          if (uniqueValues.length !== existingState.uniqueValues.length || 
              !uniqueValues.every(v => existingValuesSet.has(v))) {
            updatedStates[columnName] = {
              ...existingState,
              uniqueValues, // Update with all current unique values
              // Preserve matchedTags, customMappings, and removedTags
            };
          }
        }
      });
      
      // Initialize items per page for new columns
      if (Object.keys(itemsToInitialize).length > 0) {
        setItemsPerPage((prev) => ({ ...prev, ...itemsToInitialize }));
      }
      
      return updatedStates;
    });
  }, [open, tagColumns, columnUniqueValues, tagTypeColumnMapping, tagAnalyses]);

  // Smart matching function: checks ALL tag types case-insensitively
  const findMatchingTag = (value: string): { type: string; value: string } | null => {
    const normalizedValue = value.trim().toLowerCase();
    
    for (const tagType of tagTypes) {
      const match = tagType.values.find(
        (existingValue) => existingValue.toLowerCase() === normalizedValue
      );
      if (match) {
        return { type: tagType.name, value: match };
      }
    }
    return null;
  };

  // Apply tag type change (internal function that actually performs the change)
  const applyTagTypeChange = (columnName: string, selectedTagType: string) => {
    setColumnStates((prev) => {
      const currentState = prev[columnName];
      if (!currentState) return prev;

      const newState: ColumnTagState = {
        ...currentState,
        tagType: selectedTagType,
        matchedTags: new Map(),
        customMappings: new Map(),
      };

      // Auto-match all values in this column against ALL tag types
      // If a match is found, use it (even if it's from a different tag type)
      // The user can override by mapping manually
      currentState.uniqueValues.forEach((value) => {
        if (currentState.removedTags.has(value)) return; // Skip removed tags
        
        const match = findMatchingTag(value);
        if (match) {
          // Found a match - use it, but if it's from a different tag type,
          // we'll still show it as matched but user can override
          newState.matchedTags.set(value, match);
        }
      });

      return {
        ...prev,
        [columnName]: newState,
      };
    });
  };

  // Handle tag type selection for a column (checks for custom mappings first)
  const handleColumnTagTypeChange = (columnName: string, selectedTagType: string) => {
    const currentState = columnStates[columnName];
    if (!currentState) return;

    // Check if there are custom mappings that would be lost
    if (currentState.customMappings.size > 0) {
      // Show confirmation dialog
      setPendingTagTypeChange({ columnName, newTagType: selectedTagType });
    } else {
      // No custom mappings, proceed directly
      applyTagTypeChange(columnName, selectedTagType);
    }
  };

  // Handle confirmation of tag type change
  const handleConfirmTagTypeChange = () => {
    if (pendingTagTypeChange) {
      applyTagTypeChange(pendingTagTypeChange.columnName, pendingTagTypeChange.newTagType);
      setPendingTagTypeChange(null);
    }
  };

  // Handle cancellation of tag type change
  const handleCancelTagTypeChange = () => {
    setPendingTagTypeChange(null);
  };

  // Get tag info for a value - optimized with useCallback
  const getTagInfo = useCallback((columnName: string, value: string): TagValueInfo => {
    const state = columnStates[columnName];
    if (!state) {
      return {
        columnName,
        value,
        isMatched: false,
        isRemoved: false,
      };
    }

    const isRemoved = state.removedTags.has(value);
    const matchedTag = state.matchedTags.get(value);
    const customMapping = state.customMappings.get(value);

    // Consider it matched if:
    // 1. There's an auto-matched tag for the current tag type, OR
    // 2. There's a custom mapping (user-created or user-mapped)
    const isMatched = (!!matchedTag && matchedTag.type === state.tagType) || !!customMapping;

    return {
      columnName,
      value,
      isMatched,
      matchedTag,
      customMapping,
      isRemoved,
    };
  }, [columnStates]);

  // Toggle tag removal
  const toggleTagRemoval = (columnName: string, value: string) => {
    setColumnStates((prev) => {
      const state = prev[columnName];
      if (!state) return prev;

      const newRemovedTags = new Set(state.removedTags);
      if (newRemovedTags.has(value)) {
        newRemovedTags.delete(value);
      } else {
        newRemovedTags.add(value);
      }

      return {
        ...prev,
        [columnName]: {
          ...state,
          removedTags: newRemovedTags,
        },
      };
    });
  };

  // Start editing a tag (map to existing or create new)
  const startEditingTag = (columnName: string, value: string) => {
    const state = columnStates[columnName];
    const customMapping = state?.customMappings.get(value);
    
    setEditingTag({ column: columnName, value });
    setEditingInput(customMapping?.value || value);
    setEditingIsNew(!!customMapping);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTag(null);
    setEditingInput("");
    setEditingIsNew(false);
  };

  // Apply individual tag mapping
  const applyTagMapping = (columnName: string, value: string, mappedValue: string, isNew: boolean) => {
    const state = columnStates[columnName];
    if (!state || !state.tagType) return;

    if (isNew) {
      // Create new tag value
      const success = addTagTypeValue(state.tagType, mappedValue);
      if (success) {
        setColumnStates((prev) => {
          const currentState = prev[columnName];
          if (!currentState) return prev;

          const newMappings = new Map(currentState.customMappings);
          newMappings.set(value, { type: state.tagType!, value: mappedValue });

          return {
            ...prev,
            [columnName]: {
              ...currentState,
              customMappings: newMappings,
            },
          };
        });
      }
    } else {
      // Map to existing value
      setColumnStates((prev) => {
        const currentState = prev[columnName];
        if (!currentState) return prev;

        const newMappings = new Map(currentState.customMappings);
        newMappings.set(value, { type: state.tagType!, value: mappedValue });

        return {
          ...prev,
          [columnName]: {
            ...currentState,
            customMappings: newMappings,
          },
        };
      });
    }

    // Clear editing state if this was from inline editing
    if (editingTag?.column === columnName && editingTag?.value === value) {
      cancelEditing();
    }
  };

  // Get current mapped value for display - optimized with useCallback
  const getCurrentMappedValue = useCallback((columnName: string, value: string): string => {
    const state = columnStates[columnName];
    if (!state) return "";
    
    const customMapping = state.customMappings.get(value);
    if (customMapping) {
      return customMapping.value;
    }
    
    const matchedTag = state.matchedTags.get(value);
    if (matchedTag && matchedTag.type === state.tagType) {
      return matchedTag.value;
    }
    
    return "";
  }, [columnStates]);

  // Bulk selection handlers - optimized with useCallback
  const getTagKey = useCallback((columnName: string, value: string) => `${columnName}:${value}`, []);

  const toggleTagSelection = useCallback((columnName: string, value: string) => {
    const key = getTagKey(columnName, value);
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, [getTagKey]);

  const toggleSelectAll = useCallback((columnName: string) => {
    const state = columnStates[columnName];
    if (!state) return;

    // Use requestAnimationFrame to batch the update for better performance
    requestAnimationFrame(() => {
      const allKeys = state.uniqueValues
        .filter((v) => !state.removedTags.has(v))
        .map((v) => getTagKey(columnName, v));

      const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedTags.has(key));

      setSelectedTags((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          allKeys.forEach((key) => next.delete(key));
        } else {
          allKeys.forEach((key) => next.add(key));
        }
        return next;
      });
    });
  }, [columnStates, selectedTags, getTagKey]);
  
  // Load more items for a column
  const loadMoreItems = useCallback((columnName: string) => {
    setItemsPerPage((prev) => ({
      ...prev,
      [columnName]: (prev[columnName] || ITEMS_PER_PAGE_INITIAL) + ITEMS_PER_PAGE_LOAD_MORE,
    }));
  }, []);

  // Bulk map to existing value
  const handleBulkMap = (columnName: string) => {
    const action = bulkActions[columnName];
    if (!action || !action.mapValue) return;

    const columnSelectedTags = Array.from(selectedTags).filter((key) => key.startsWith(`${columnName}:`));
    columnSelectedTags.forEach((key) => {
      const [, value] = key.split(":", 2);
      const state = columnStates[columnName];
      if (!state || !state.tagType) return;

      applyTagMapping(columnName, value, action.mapValue, false);
    });

    // Clear selection for this column
    setSelectedTags((prev) => {
      const next = new Set(prev);
      columnSelectedTags.forEach((key) => next.delete(key));
      return next;
    });
    
    // Clear bulk action for this column
    setBulkActions((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
  };

  // Bulk create new values
  const handleBulkCreate = (columnName: string) => {
    const action = bulkActions[columnName];
    if (!action || !action.createValue.trim()) return;

    const columnSelectedTags = Array.from(selectedTags).filter((key) => key.startsWith(`${columnName}:`));
    columnSelectedTags.forEach((key) => {
      const [, value] = key.split(":", 2);
      const state = columnStates[columnName];
      if (!state || !state.tagType) return;

      applyTagMapping(columnName, value, action.createValue.trim(), true);
    });

    // Clear selection for this column
    setSelectedTags((prev) => {
      const next = new Set(prev);
      columnSelectedTags.forEach((key) => next.delete(key));
      return next;
    });
    
    // Clear bulk action for this column
    setBulkActions((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
  };

  // Get all unmatched tags for bulk actions (filtered by selected column if needed) - optimized with useCallback
  const getUnmatchedTagsForBulk = useCallback((columnName: string): string[] => {
    const state = columnStates[columnName];
    if (!state || !state.tagType) return [];

    return state.uniqueValues.filter((value) => {
      if (state.removedTags.has(value)) return false;
      // Consider unmatched if no match OR if match is from different tag type
      const match = state.matchedTags.get(value);
      if (match && match.type === state.tagType) {
        return false; // Matched to the correct tag type
      }
      // If matched to different tag type or not matched, allow bulk action
      return true;
    });
  }, [columnStates]);

  // Save handler
  const handleSave = () => {
    const rowTags: Record<number, Tag[]> = {};

    // Process each row
    rows.forEach((row, rowIndex) => {
      const tagsForRow: Tag[] = [];

      // Process each tag column
      tagColumns.forEach((columnName) => {
        const state = columnStates[columnName];
        if (!state || !state.tagType) return;

        const cellValue = row[columnName];
        if (!cellValue) return;

        const parsedValues = parseCommaSeparatedValues(String(cellValue));
        parsedValues.forEach((value) => {
          const trimmedValue = value.trim();
          if (!trimmedValue) return;

          // Skip removed tags
          if (state.removedTags.has(trimmedValue)) return;

          // Check for custom mapping first (user override)
          const customMapping = state.customMappings.get(trimmedValue);
          if (customMapping) {
            tagsForRow.push(customMapping);
            return;
          }

          // Check for matched tag (only use if it matches the selected tag type)
          const matchedTag = state.matchedTags.get(trimmedValue);
          if (matchedTag && matchedTag.type === state.tagType) {
            tagsForRow.push(matchedTag);
            return;
          }

          // If matched to different tag type, use the column's tag type with the matched value
          // This preserves the matched value but applies it to the correct tag type
          if (matchedTag && state.tagType) {
            tagsForRow.push({
              type: state.tagType,
              value: matchedTag.value, // Use the matched value (properly cased)
            });
            return;
          }

          // If no mapping exists but tag type is set, use the value as-is with the column's tag type
          // This handles cases where user didn't map but wants to create
          if (state.tagType) {
            tagsForRow.push({
              type: state.tagType,
              value: trimmedValue,
            });
          }
        });
      });

      if (tagsForRow.length > 0) {
        rowTags[rowIndex] = tagsForRow;
      }
    });

    onSave(rowTags);
    onClose();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !left-1/2 !top-1/2">
        <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
          <DialogTitle className="text-lg">Map Tags from Excel</DialogTitle>
          <p className="text-sm text-foreground/70 mt-2">
            {tagTypeColumnMapping 
              ? "Review and adjust tag mappings. Tags that match existing values are auto-mapped."
              : "Select a tag type for each column. Tags that match existing values will be auto-mapped."}
          </p>
          {isProcessing && (
            <div className="flex items-center gap-2 mt-2 text-xs text-foreground/60">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing {rows.length} rows... ({processedRows} processed)</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {tagColumns.map((columnName) => {
              const state = columnStates[columnName];
              const uniqueValues = state?.uniqueValues || [];
              const unmatchedTags = getUnmatchedTagsForBulk(columnName);
              const columnSelectedTags = uniqueValues
                .filter((v) => !state?.removedTags.has(v))
                .map((v) => getTagKey(columnName, v))
                .filter((key) => selectedTags.has(key));

              return (
                <div key={columnName} className="space-y-3 border border-foreground/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{columnName}</Label>
                      <p className="text-xs text-foreground/60 mt-1">
                        {uniqueValues.length} unique value{uniqueValues.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Select
                      value={state?.tagType || ""}
                      onValueChange={(tagType) => handleColumnTagTypeChange(columnName, tagType)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select tag type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tagTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.name}>
                            {tt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {state?.tagType && tagTypeColumnMapping && (
                      <p className="text-xs text-foreground/60 mt-1">
                        Tag type can be changed, but custom mappings will be cleared
                      </p>
                    )}
                  </div>

                  {state?.tagType && (
                    <>
                      {/* Bulk Actions Bar */}
                      {columnSelectedTags.length > 0 && (
                        <div className="p-3 bg-sidebar-background rounded-md border border-foreground/10">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {columnSelectedTags.length} selected
                            </Badge>
                            {!bulkActions[columnName]?.isNew ? (
                              <>
                                <Select
                                  value={bulkActions[columnName]?.mapValue || ""}
                                  onValueChange={(val) => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: val, createValue: "", isNew: false },
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-[200px]">
                                    <SelectValue placeholder="Map to existing value" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tagTypes
                                      .find((tt) => tt.name === state.tagType)
                                      ?.values.map((val) => (
                                        <SelectItem key={val} value={val}>
                                          {val}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => handleBulkMap(columnName)}
                                  disabled={!bulkActions[columnName]?.mapValue}
                                  size="sm"
                                  className="h-8"
                                >
                                  Map Selected
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: "", createValue: "", isNew: true },
                                    }));
                                  }}
                                  size="sm"
                                  className="h-8"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Create New
                                </Button>
                              </>
                            ) : (
                              <>
                                <Input
                                  value={bulkActions[columnName]?.createValue || ""}
                                  onChange={(e) => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: "", createValue: e.target.value, isNew: true },
                                    }));
                                  }}
                                  placeholder="New tag value"
                                  className="h-8 w-[200px]"
                                />
                                <Button
                                  onClick={() => handleBulkCreate(columnName)}
                                  disabled={!bulkActions[columnName]?.createValue.trim()}
                                  size="sm"
                                  className="h-8"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Create
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setBulkActions((prev) => {
                                      const next = { ...prev };
                                      delete next[columnName];
                                      return next;
                                    });
                                  }}
                                  size="sm"
                                  className="h-8"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTags((prev) => {
                                  const next = new Set(prev);
                                  columnSelectedTags.forEach((key) => next.delete(key));
                                  return next;
                                });
                              }}
                              className="h-8 ml-auto"
                            >
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Table View - Always show if we have any data */}
                      {uniqueValues.length > 0 && (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Excel Value</TableHead>
                                <TableHead>Mapped To</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                // Get visible items based on pagination
                                const visibleCount = itemsPerPage[columnName] || ITEMS_PER_PAGE_INITIAL;
                                const visibleValues = uniqueValues.slice(0, visibleCount);
                                const hasMore = uniqueValues.length > visibleCount;
                                
                                return (
                                  <>
                                    {visibleValues.map((value) => {
                                      const tagInfo = getTagInfo(columnName, value);
                                      if (tagInfo.isRemoved) return null;

                                      const tagKey = getTagKey(columnName, value);
                                      const isSelected = selectedTags.has(tagKey);
                                      const isMatched = (!!tagInfo.matchedTag && tagInfo.matchedTag.type === state.tagType) || !!tagInfo.customMapping;
                                      const currentMappedValue = getCurrentMappedValue(columnName, value);
                                      const tagType = tagTypes.find(tt => tt.name === state.tagType);
                                      const isCreatingNew = editingTag?.column === columnName && editingTag?.value === value && editingIsNew;
                                      const isSelectingExisting = editingTag?.column === columnName && editingTag?.value === value && !editingIsNew;

                                      return (
                                        <TableRow
                                          key={value}
                                          className={isSelected ? "bg-sidebar-primary/5" : ""}
                                        >
                                          {/* Checkbox Column */}
                                          <TableCell>
                                            {!isMatched && (
                                              <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleTagSelection(columnName, value)}
                                              />
                                            )}
                                          </TableCell>

                                          {/* Excel Value Column */}
                                          <TableCell className="font-medium">{value}</TableCell>

                                          {/* Mapped To Column */}
                                          <TableCell>
                                            {isCreatingNew ? (
                                              <div className="flex items-center gap-2">
                                                <Input
                                                  value={editingInput}
                                                  onChange={(e) => setEditingInput(e.target.value)}
                                                  placeholder="New value"
                                                  className="h-8 flex-1"
                                                  autoFocus
                                                />
                                                <Button
                                                  size="sm"
                                                  onClick={() => {
                                                    if (editingInput.trim()) {
                                                      applyTagMapping(columnName, value, editingInput.trim(), true);
                                                    }
                                                  }}
                                                  className="h-8"
                                                >
                                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                  Create
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  onClick={cancelEditing}
                                                  variant="outline"
                                                  className="h-8"
                                                >
                                                  Cancel
                                                </Button>
                                              </div>
                                            ) : isSelectingExisting ? (
                                              <Select
                                                value={editingInput}
                                                onValueChange={(val) => {
                                                  if (val === "__create_new__") {
                                                    setEditingIsNew(true);
                                                    setEditingInput(value);
                                                  } else {
                                                    applyTagMapping(columnName, value, val, false);
                                                  }
                                                }}
                                              >
                                                <SelectTrigger className="h-8 w-full">
                                                  <SelectValue placeholder="Select value" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {tagType?.values.map((val) => (
                                                    <SelectItem key={val} value={val}>
                                                      {val}
                                                    </SelectItem>
                                                  ))}
                                                  <SelectItem value="__create_new__">
                                                    <div className="flex items-center gap-2">
                                                      <Plus className="h-3.5 w-3.5" />
                                                      Create new
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Select
                                                value={currentMappedValue || undefined}
                                                onValueChange={(val) => {
                                                  if (val === "__create_new__") {
                                                    setEditingTag({ column: columnName, value });
                                                    setEditingInput(value);
                                                    setEditingIsNew(true);
                                                  } else if (val === "__clear__") {
                                                    // Clear mapping
                                                    setColumnStates((prev) => {
                                                      const currentState = prev[columnName];
                                                      if (!currentState) return prev;
                                                      const newMappings = new Map(currentState.customMappings);
                                                      newMappings.delete(value);
                                                      return {
                                                        ...prev,
                                                        [columnName]: {
                                                          ...currentState,
                                                          customMappings: newMappings,
                                                        },
                                                      };
                                                    });
                                                  } else {
                                                    // Map to existing value
                                                    applyTagMapping(columnName, value, val, false);
                                                  }
                                                }}
                                              >
                                                <SelectTrigger className="h-8 w-full">
                                                  <SelectValue placeholder="Select value" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {currentMappedValue && (
                                                    <SelectItem value={currentMappedValue}>
                                                      {currentMappedValue}
                                                    </SelectItem>
                                                  )}
                                                  {tagType?.values
                                                    .filter(v => v !== currentMappedValue)
                                                    .map((val) => (
                                                      <SelectItem key={val} value={val}>
                                                        {val}
                                                      </SelectItem>
                                                    ))}
                                                  <SelectItem value="__create_new__">
                                                    <div className="flex items-center gap-2">
                                                      <Plus className="h-3.5 w-3.5" />
                                                      Create new
                                                    </div>
                                                  </SelectItem>
                                                  {currentMappedValue && (
                                                    <SelectItem value="__clear__">
                                                      Clear mapping
                                                    </SelectItem>
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            )}
                                          </TableCell>

                                          {/* Status Column */}
                                          <TableCell>
                                            {isMatched ? (
                                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                <Check className="h-3 w-3 text-green-600" />
                                                Matched
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="w-fit">Unmatched</Badge>
                                            )}
                                          </TableCell>

                                          {/* Remove Column */}
                                          <TableCell>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleTagRemoval(columnName, value)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                    
                                    {/* Load More Button */}
                                    {hasMore && (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                          <Button
                                            variant="outline"
                                            onClick={() => loadMoreItems(columnName)}
                                            className="w-full"
                                          >
                                            Load More ({uniqueValues.length - visibleCount} remaining)
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                );
                              })()}
                            </TableBody>
                          </Table>
                          
                          {/* Loading indicator below table while processing */}
                          {isProcessing && (
                            <div className="flex items-center justify-center py-4 text-sm text-foreground/60 border-t mt-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing rows... ({processedRows} / {rows.length})
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Show loading state only if no data yet */}
                      {uniqueValues.length === 0 && isProcessing && (
                        <div className="flex items-center justify-center py-8 text-sm text-foreground/60">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing rows... ({processedRows} / {rows.length})
                        </div>
                      )}

                      {/* Select All / Deselect All */}
                      {(() => {
                        const unmatchedTagsList = getUnmatchedTagsForBulk(columnName);
                        if (unmatchedTagsList.length === 0) return null;
                        
                        return (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleSelectAll(columnName)}
                              className="h-8"
                            >
                              {columnSelectedTags.length === unmatchedTagsList.length ? (
                                <>
                                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Square className="h-3.5 w-3.5 mr-1.5" />
                                  Select All Unmatched
                                </>
                              )}
                            </Button>
                            <span className="text-xs text-foreground/60">
                              {unmatchedTagsList.length} unmatched tag{unmatchedTagsList.length !== 1 ? "s" : ""} need mapping
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-background flex-shrink-0">
          <Button variant="outline" onClick={onClose} size="sm" className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-sidebar-primary hover:bg-sidebar-primary/80 h-9">
            Save to Vault
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      {/* Confirmation dialog for tag type change */}
      <AlertDialog open={pendingTagTypeChange !== null} onOpenChange={(open) => {
        if (!open) {
          handleCancelTagTypeChange();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Tag Type?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTagTypeChange && (() => {
                const state = columnStates[pendingTagTypeChange.columnName];
                const customMappingCount = state?.customMappings.size || 0;
                return (
                  <>
                    Changing the tag type will clear all custom mappings you've made for this column.{" "}
                    <strong>{customMappingCount}</strong> custom mapping{customMappingCount !== 1 ? "s" : ""} will be lost.{" "}
                    Auto-matched tags will be re-evaluated for the new tag type. Do you want to continue?
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTagTypeChange}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTagTypeChange}>
              Change Tag Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

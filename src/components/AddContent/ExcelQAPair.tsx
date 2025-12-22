import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useVaultEdits } from "@/hooks/useVaultState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTagTypes } from "@/hooks/useTagTypes";
import { STRATEGIES } from "@/types/vault";
import { migrateStrategyToTags } from "@/utils/tagMigration";
import { parseExcelFile, ParsedExcelRow, ExcelParseResult, parseCommaSeparatedValues } from "@/utils/excelParser";
import { TagMappingModal } from "./TagMappingModal";
import { QuestionItem, Tag } from "@/types/vault";
import { Upload, File, X, CornerDownRight, Calendar, FileText, Loader2 } from "lucide-react";
import { TagColumnAnalysis, ImportSession, ImportSummary } from "@/types/import";
import { analyzeTagColumn } from "@/utils/tagAnalysis";
import { ImportResultScreen } from "@/components/Import/ImportResultScreen";

export function ExcelQAPair() {
  const { toast } = useToast();
  const { saveManyEdits, getEdit, clearEdit } = useVaultEdits();
  const { profile } = useUserProfile();
  const { addTagTypeValue, tagTypes, getAllTagTypes } = useTagTypes();
  
  const [strategy, setStrategy] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showTagMapping, setShowTagMapping] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  
  // Column mappings
  const [sectionColumn, setSectionColumn] = useState<string>("");
  const [questionColumn, setQuestionColumn] = useState<string>("");
  const [answerColumn, setAnswerColumn] = useState<string>("");
  const [subQuestionColumn, setSubQuestionColumn] = useState<string>("");
  
  // Tag type column mapping: maps tag type name to Excel column name
  const [tagTypeColumnMapping, setTagTypeColumnMapping] = useState<Record<string, string>>({});
  // Tag analyses: stores analysis results for each tag type
  const [tagAnalyses, setTagAnalyses] = useState<Record<string, TagColumnAnalysis>>({});
  // Track which tag type is currently being analyzed
  const [analyzingTagType, setAnalyzingTagType] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = ['.csv', '.xlsx', '.xls'];

    if (!acceptedTypes.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV, XLSX, or XLS files only.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsParsing(true);

    try {
      const result = await parseExcelFile(file);
      setParseResult(result);
      toast({
        title: "File parsed successfully ✓",
        description: `Found ${result.rows.length} rows with ${result.headers.length} columns.`,
      });
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse Excel file.",
        variant: "destructive",
      });
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParseResult(null);
    setSectionColumn("");
    setQuestionColumn("");
    setAnswerColumn("");
    setSubQuestionColumn("");
    setTagTypeColumnMapping({});
    setTagAnalyses({});
    setAnalyzingTagType(null);
    setShowResultScreen(false);
    setImportSummary(null);
    setImportSession(null);
  };

  const handleUndoImport = () => {
    if (!importSession || !importSummary || isUndoing) return;
    
    setIsUndoing(true);
    
    // Check if there are actually any items to undo
    if (!importSummary.importedItemIds || importSummary.importedItemIds.length === 0) {
      toast({
        title: "Nothing to undo",
        description: "No items were imported in this session.",
      });
      setIsUndoing(false);
      // Still reset the UI
      setShowResultScreen(false);
      setImportSummary(null);
      setImportSession(null);
      handleRemoveFile();
      setStrategy("");
      setShowTagMapping(false);
      return;
    }
    
    try {
      // Clear all imported items by ID directly
      // Since our items don't have documentId set, we can't use rollbackImport
      // Instead, we'll clear them directly by their IDs
      // Store itemIds in a local variable to avoid issues if state changes
      const itemIdsToClear = [...importSummary.importedItemIds];
      
      // Verify which items actually exist before clearing
      const itemsThatExist = itemIdsToClear.filter(itemId => {
        const item = getEdit(itemId);
        return item !== undefined && item !== null;
      });
      
      if (itemsThatExist.length === 0) {
        toast({
          title: "Nothing to undo",
          description: "No imported items were found to remove.",
        });
        setIsUndoing(false);
        // Still reset the UI
        setShowResultScreen(false);
        setImportSummary(null);
        setImportSession(null);
        handleRemoveFile();
        setStrategy("");
        setShowTagMapping(false);
        return;
      }
      
      // Clear items - only batch if there are many items to prevent UI freeze
      if (itemsThatExist.length > 100) {
        // For large batches, use requestAnimationFrame to keep UI responsive
        let processed = 0;
        const batchSize = 100;
        
        let actuallyRemoved = 0;
        const processBatch = () => {
          const batch = itemsThatExist.slice(processed, processed + batchSize);
          batch.forEach(itemId => {
            try {
              const item = getEdit(itemId);
              if (item) {
                clearEdit(itemId);
                actuallyRemoved++;
              }
            } catch (err) {
              console.warn(`Failed to clear item ${itemId}:`, err);
            }
          });
          
          processed += batch.length;
          
          if (processed < itemsThatExist.length) {
            requestAnimationFrame(processBatch);
          } else {
            // All items processed - reset UI completely to start
            setIsUndoing(false);
            setShowResultScreen(false);
            setImportSummary(null);
            setImportSession(null);
            handleRemoveFile();
            setStrategy("");
            setShowTagMapping(false);
            
            toast({
              title: "Import rolled back",
              description: actuallyRemoved > 0
                ? `${actuallyRemoved} item${actuallyRemoved !== 1 ? 's' : ''} removed.`
                : "Import rolled back.",
            });
          }
        };
        
        requestAnimationFrame(processBatch);
      } else {
        // For small batches, clear immediately and count as we go
        let actuallyRemoved = 0;
        itemsThatExist.forEach(itemId => {
          try {
            const item = getEdit(itemId);
            if (item) {
              clearEdit(itemId);
              actuallyRemoved++;
            }
          } catch (err) {
            console.warn(`Failed to clear item ${itemId}:`, err);
          }
        });
        
        // Reset UI state completely to start
        setIsUndoing(false);
        setShowResultScreen(false);
        setImportSummary(null);
        setImportSession(null);
        handleRemoveFile();
        setStrategy("");
        setShowTagMapping(false);
        
        toast({
          title: "Import rolled back",
          description: actuallyRemoved > 0
            ? `${actuallyRemoved} item${actuallyRemoved !== 1 ? 's' : ''} removed.`
            : "Import rolled back.",
        });
      }
    } catch (error) {
      console.error('Error during undo:', error);
      toast({
        title: "Error rolling back import",
        description: error instanceof Error ? error.message : "Failed to rollback import.",
        variant: "destructive",
      });
      // Still reset UI even if there was an error
      setShowResultScreen(false);
      setImportSummary(null);
      setImportSession(null);
      setIsUndoing(false);
    }
  };

  // Handle tag type column selection and analysis
  const handleTagTypeColumnChange = async (tagTypeName: string, columnName: string) => {
    // Handle clearing (when "__clear__" is selected)
    if (!parseResult || !columnName || columnName === "__clear__") {
      // Clear mapping if column is cleared
      setTagTypeColumnMapping(prev => {
        const updated = { ...prev };
        delete updated[tagTypeName];
        return updated;
      });
      setTagAnalyses(prev => {
        const updated = { ...prev };
        delete updated[tagTypeName];
        return updated;
      });
      return;
    }

    // Update mapping
    setTagTypeColumnMapping(prev => ({ ...prev, [tagTypeName]: columnName }));
    setAnalyzingTagType(tagTypeName);

    try {
      // Extract all values from the column
      const columnValues: string[] = [];
      parseResult.rows.forEach((row) => {
        const cellValue = row[columnName];
        if (cellValue) {
          columnValues.push(String(cellValue));
        }
      });

      // Find tag type
      const tagType = tagTypes.find(tt => tt.name === tagTypeName);
      if (!tagType) {
        throw new Error(`Tag type not found: ${tagTypeName}`);
      }

      // Analyze
      const analysisResult = analyzeTagColumn(
        tagType.id,
        tagType.name,
        columnName,
        columnValues,
        getAllTagTypes()
      );

      // Store analysis result
      setTagAnalyses(prev => ({ ...prev, [tagTypeName]: analysisResult }));

      toast({
        title: "Tag analysis complete ✓",
        description: `Found ${analysisResult.stats.uniqueCount} unique values in ${columnName}.`,
      });
    } catch (error) {
      toast({
        title: "Error analyzing tags",
        description: error instanceof Error ? error.message : "Failed to analyze tag column.",
        variant: "destructive",
      });
      // Remove the mapping on error
      setTagTypeColumnMapping(prev => {
        const updated = { ...prev };
        delete updated[tagTypeName];
        return updated;
      });
    } finally {
      setAnalyzingTagType(null);
    }
  };

  const handleSaveTags = (mappedTags?: Record<number, Tag[]>) => {
    if (!parseResult) {
      toast({
        title: "Missing information",
        description: "Please ensure file is parsed.",
        variant: "destructive",
      });
      return;
    }

    // Ensure Strategy tag type exists if strategy is set
    if (strategy) {
      const strategyTagType = "Strategy";
      if (!STRATEGIES.includes(strategy)) {
        addTagTypeValue(strategyTagType, strategy);
      }
    }

    // Create QuestionItem for each row
    const itemsToSave: Array<[string, QuestionItem]> = [];
    const baseTags = strategy ? migrateStrategyToTags(strategy) : [];
    
    // Track import summary data
    const tagsByType: Record<string, { existingUsed: Set<string>; newCreated: Set<string> }> = {};
    const createdTagValues: Array<{ tagType: string; value: string }> = [];
    const importedItemIds: string[] = [];

    parseResult.rows.forEach((row, index) => {
      const section = row[sectionColumn] || "";
      const question = String(row[questionColumn] || "").trim();
      const answer = String(row[answerColumn] || "").trim();
      const subQuestion = subQuestionColumn ? String(row[subQuestionColumn] || "").trim() : null;

      if (!question || !answer) {
        return; // Skip rows without required fields
      }

      // Start with base tags (strategy)
      const allTags: Tag[] = [...baseTags];

      // If mappedTags provided (from TagMappingModal review), use those
      if (mappedTags && mappedTags[index]) {
        mappedTags[index].forEach((tag) => {
          if (!allTags.some((t) => t.type === tag.type && t.value === tag.value)) {
            allTags.push(tag);
            // Track tag usage (assume existing for review flow)
            if (!tagsByType[tag.type]) {
              tagsByType[tag.type] = { existingUsed: new Set(), newCreated: new Set() };
            }
            tagsByType[tag.type].existingUsed.add(tag.value);
          }
        });
      } else {
        // Otherwise, process tag type column mappings
        Object.entries(tagTypeColumnMapping).forEach(([tagTypeName, columnName]) => {
          const analysis = tagAnalyses[tagTypeName];
          if (!analysis) return;

          const cellValue = row[columnName];
          if (!cellValue) return;

          // Parse comma-separated values
          const parsedValues = parseCommaSeparatedValues(String(cellValue));
          parsedValues.forEach((sourceValue) => {
            const trimmed = sourceValue.trim();
            if (!trimmed) return;

            // Find the mapping for this value
            const mapping = analysis.mappings.find(m => m.sourceValue === trimmed);
            if (!mapping) return;

            // Determine the tag value to use
            const tagValue = mapping.mappedTagName || trimmed;

            // Add tag if not duplicate
            if (!allTags.some((t) => t.type === tagTypeName && t.value === tagValue)) {
              if (!tagsByType[tagTypeName]) {
                tagsByType[tagTypeName] = { existingUsed: new Set(), newCreated: new Set() };
              }
              
              if (mapping.status === 'matched') {
                // Use existing tag
                tagsByType[tagTypeName].existingUsed.add(tagValue);
                allTags.push({
                  type: tagTypeName,
                  value: tagValue,
                });
              } else {
                // Create new tag
                const success = addTagTypeValue(tagTypeName, tagValue);
                if (success) {
                  tagsByType[tagTypeName].newCreated.add(tagValue);
                  createdTagValues.push({ tagType: tagTypeName, value: tagValue });
                  allTags.push({
                    type: tagTypeName,
                    value: tagValue,
                  });
                }
              }
            }
          });
        });
      }

      const newItem: QuestionItem = {
        id: `excel-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        type: "Questionnaires",
        ...(strategy && { strategy }),
        tags: allTags,
        question: question.trim(),
        answer: answer.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: profile.fullName || "Current User",
        documentTitle: uploadedFile?.name || "Excel Import",
      };

      itemsToSave.push([newItem.id, newItem]);
      importedItemIds.push(newItem.id);
    });

    if (itemsToSave.length === 0) {
      toast({
        title: "No items to save",
        description: "No valid rows found with question and answer data.",
        variant: "destructive",
      });
      return;
    }

    // Save all items
    saveManyEdits(itemsToSave);
    
    // Verify which items were actually saved after state updates
    // Use setTimeout to allow state to update, then verify
    setTimeout(() => {
      const actuallyImportedItemIds: string[] = [];
      itemsToSave.forEach(([itemId]) => {
        const existingItem = getEdit(itemId);
        if (existingItem) {
          actuallyImportedItemIds.push(itemId);
        }
      });
      
      const actuallyImportedCount = actuallyImportedItemIds.length;
      
      // Create import summary with actual imported count
      const summary: ImportSummary = {
        rowsImported: actuallyImportedCount,
        tagsByType: Object.fromEntries(
          Object.entries(tagsByType).map(([type, stats]) => [
            type,
            {
              existingUsed: stats.existingUsed.size,
              newCreated: stats.newCreated.size,
            },
          ])
        ),
        importedItemIds: actuallyImportedItemIds.length > 0 ? actuallyImportedItemIds : importedItemIds,
        createdTagValues,
      };

      // Create mock import session
      const sessionId = `excel-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const session: ImportSession = {
        id: sessionId,
        strategy: strategy || undefined,
        fileMetadata: {
          filename: uploadedFile?.name || "Excel Import",
          size: uploadedFile?.size || 0,
          uploadedBy: profile.fullName || "Current User",
          uploadedAt: new Date().toISOString(),
        },
        columnGuesses: {
          section: sectionColumn || null,
          question: questionColumn || null,
          answer: answerColumn || null,
          subQuestion: subQuestionColumn || null,
          tagColumns: Object.values(tagTypeColumnMapping),
        },
        tagAnalysis: tagAnalyses,
        status: 'imported',
        summary,
      };

      setImportSummary(summary);
      setImportSession(session);
      setShowResultScreen(true);

      toast({
        title: "Import complete ✓",
        description: `Successfully imported ${summary.rowsImported} Q&A pair${summary.rowsImported !== 1 ? 's' : ''}.`,
      });
    }, 100); // Small delay to allow state to update
  };

  // Get available columns for tag type dropdowns (exclude already mapped columns)
  // currentTagTypeName: if provided, include the currently selected column for that tag type
  const getAvailableColumnsForTagTypes = (currentTagTypeName?: string): string[] => {
    if (!parseResult) return [];
    const mappedColumns = [
      sectionColumn,
      questionColumn,
      answerColumn,
      subQuestionColumn,
      ...Object.entries(tagTypeColumnMapping)
        .filter(([tagTypeName]) => tagTypeName !== currentTagTypeName)
        .map(([_, columnName]) => columnName)
    ].filter(Boolean);
    return parseResult.headers
      .filter(h => h && h.trim())
      .filter((h) => !mappedColumns.includes(h));
  };

  // Calculate total unmatched count across all tag types
  const getTotalUnmatchedCount = (): number => {
    return Object.values(tagAnalyses).reduce((sum, analysis) => {
      return sum + analysis.stats.unmatchedCount;
    }, 0);
  };

  // Get tag columns for review modal (only columns with unmatched values)
  const getTagColumnsForReview = (): string[] => {
    return Object.entries(tagAnalyses)
      .filter(([_, analysis]) => analysis.stats.unmatchedCount > 0)
      .map(([tagTypeName, _]) => tagTypeColumnMapping[tagTypeName])
      .filter(Boolean);
  };

  // Show result screen if import was successful
  if (showResultScreen && importSession && importSummary) {
    return (
      <ImportResultScreen
        session={importSession}
        summary={importSummary}
        onUndo={handleUndoImport}
      />
    );
  }

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        {/* <div className="space-y-2">
          <Label htmlFor="strategy">
            Strategy
          </Label>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger id="strategy">
              <SelectValue placeholder="Select a strategy" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}

        {!uploadedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-sidebar-primary bg-sidebar-primary/10'
                : 'border-foreground/20 hover:border-foreground/40'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
            <p className="text-sm text-foreground/70 mb-2">
              Drag and drop your Excel file here, or
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
            >
              {isParsing ? "Parsing..." : "Select File"}
            </Button>
            <p className="text-xs text-foreground/50 mt-2">
              CSV, XLSX, or XLS files only
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-foreground/10 rounded-lg">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-foreground/70" />
                <span className="text-sm">{uploadedFile.name}</span>
                <span className="text-xs text-foreground/50">
                  ({(uploadedFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {parseResult && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Map Excel Columns</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Section Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={sectionColumn} onValueChange={setSectionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Question Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={questionColumn} onValueChange={setQuestionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Answer Column <span className="text-destructive">*</span>
                      </Label>
                      <Select value={answerColumn} onValueChange={setAnswerColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sub-question Column (Optional)</Label>
                      <Select value={subQuestionColumn} onValueChange={setSubQuestionColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {parseResult.headers.filter(h => h && h.trim()).map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tag Columns (Optional) */}
                    {sectionColumn && questionColumn && answerColumn && (
                      <div className="space-y-4 pt-4 border-t col-span-full">
                        <div>
                          <Label className="text-sm font-medium">
                            Tag Columns (Optional)
                          </Label>
                          <p className="text-xs text-foreground/70 mt-1 mb-3">
                            Map Excel columns to the tags (found in Firm Settings)
                          </p>
                          <div className="space-y-3">
                            {tagTypes.map((tagType) => {
                              const selectedColumn = tagTypeColumnMapping[tagType.name] || "";
                              const analysis = tagAnalyses[tagType.name];
                              const isAnalyzing = analyzingTagType === tagType.name;
                              const availableColumns = getAvailableColumnsForTagTypes(tagType.name);
                              
                              return (
                                <div key={tagType.id} className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Label className="text-sm font-medium min-w-[120px]">
                                      {tagType.name}
                                    </Label>
                                    <Select
                                      value={selectedColumn || undefined}
                                      onValueChange={(columnName) => handleTagTypeColumnChange(tagType.name, columnName)}
                                      disabled={isAnalyzing}
                                    >
                                      <SelectTrigger className="flex-1 max-w-[360px]">
                                        <SelectValue placeholder="Select column" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__clear__">None</SelectItem>
                                        {availableColumns.map((header) => (
                                          <SelectItem key={header} value={header}>
                                            {header}
                                          </SelectItem>
                                        ))}
                                        {selectedColumn && !availableColumns.includes(selectedColumn) && (
                                          <SelectItem value={selectedColumn}>
                                            {selectedColumn}
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {isAnalyzing && (
                                      <Loader2 className="h-4 w-4 animate-spin text-foreground/60" />
                                    )}
                                    {analysis && !isAnalyzing && (
                                      <div className="px-2 py-1 bg-sidebar-background rounded-md border border-foreground/10 flex-1">
                                        <p className="text-xs text-foreground/70">
                                          • <strong>{analysis.stats.matchedCount}</strong> match existing {tagType.name} labels
                                        </p>
                                        <p className="text-xs text-foreground/70">
                                          • <strong>{analysis.stats.unmatchedCount}</strong> will be created as new {tagType.name} labels
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {tagTypes.length === 0 && (
                              <p className="text-sm text-foreground/50 italic">
                                No tag types found in Firm Settings.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {sectionColumn && questionColumn && answerColumn && (
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      {/* <Button
                        onClick={() => handleSaveTags()}
                        className="bg-sidebar-primary hover:bg-sidebar-primary/80 w-full"
                        size="lg"
                        disabled={analyzingTagType !== null}
                      >
                        Import now (fastest)
                      </Button>
                      <p className="text-xs text-foreground/60 text-center">
                        Use these mappings and create new labels where needed
                      </p> */}
                      
                      {getTotalUnmatchedCount() > 0 && (
                        <Button
                          onClick={() => setShowTagMapping(true)}
                          className="w-full bg-sidebar-primary hover:bg-sidebar-primary/80"
                          size="lg"
                        >
                          Review unmatched tags ({getTotalUnmatchedCount()})
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          setTagTypeColumnMapping({});
                          setTagAnalyses({});
                          handleSaveTags();
                        }}
                        variant="ghost"
                        className="w-full"
                      >
                        Skip tags for now
                      </Button>
                    </div>
                  )}

                  {/* Preview Cards */}
                  {sectionColumn && questionColumn && answerColumn && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Preview (first 5 rows)</h3>
                      <div className="space-y-4">
                        {parseResult.rows.slice(0, 5).map((row, index) => {
                          const section = String(row[sectionColumn] || "");
                          const question = String(row[questionColumn] || "");
                          const answer = String(row[answerColumn] || "");
                          const subQuestion = subQuestionColumn ? String(row[subQuestionColumn] || "") : null;
                          
                          return (
                            <div
                              key={index}
                              className="border border-foreground/20 rounded-lg bg-background"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between pb-4 border-b border-foreground/20 px-6 py-4">
                                <div className="flex items-center min-w-0 gap-3 flex-1">
                                  <FileText className="h-4 w-4 flex-shrink-0 text-foreground/60" />
                                  <div className="font-bold break-words min-w-0 text-sm" style={{ 
                                    wordBreak: 'break-word',
                                    hyphens: 'auto',
                                    lineHeight: '1.4' 
                                  }}>
                                    {section || uploadedFile?.name || 'Preview Item'}
                                  </div>
                                  <div className="flex items-center gap-1 whitespace-nowrap text-sm">
                                    <Calendar className="h-4 w-4 text-foreground/60" />
                                    <span className="text-foreground/60">Row {index + 1}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Answer Section */}
                              {answer && (
                                <div className="space-y-2 px-6 py-4">
                                  <h4 className="text-xs font-bold leading-5 tracking-tight">Answer</h4>
                                  <div className="bg-foreground/5 rounded-md p-4">
                                    <p className="text-sm leading-relaxed">
                                      {answer.length > 300 ? `${answer.substring(0, 300)}...` : answer}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Question Section */}
                              {question && (
                                <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
                                  <div className="flex items-start gap-2">
                                    <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0 text-foreground/60" />
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold leading-5 tracking-tight">Question</h4>
                                      <p className="text-base font-bold leading-6 tracking-tight">
                                        {question}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Sub-question Section */}
                              {subQuestion && (
                                <div className="space-y-2 px-6 pb-4 ml-6 border-t border-foreground/10 pt-4">
                                  <div className="flex items-start gap-2">
                                    <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0 text-foreground/60" />
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold leading-5 tracking-tight">Sub-question</h4>
                                      <p className="text-sm leading-relaxed">
                                        {subQuestion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TagMappingModal
        open={showTagMapping}
        onClose={() => setShowTagMapping(false)}
        rows={parseResult?.rows || []}
        tagColumns={getTagColumnsForReview()}
        onSave={handleSaveTags}
        tagTypeColumnMapping={tagTypeColumnMapping}
        tagAnalyses={tagAnalyses}
      />
    </div>
  );
}


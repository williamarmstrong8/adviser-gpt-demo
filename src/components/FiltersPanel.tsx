import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  File,
  Image,
  FileSpreadsheet,
  FileType,
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelectFilter } from './MultiSelectFilter';
import { STRATEGIES, TAGS_INFO } from '@/types/vault';
import { MOCK_CONTENT_ITEMS } from '@/data/mockVaultData';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PriorSample {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

interface FiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedStrategies: string[];
  onStrategiesChange: (strategies: string[]) => void;
  selectedDocuments: string[];
  onDocumentsChange: (documents: string[]) => void;
  selectedPriorSamples: string[];
  onPriorSamplesChange: (samples: string[]) => void;
  priorSamples: PriorSample[];
  onClearAll: () => void;
  includeQAPairs?: boolean; // Configurable flag for future use
}

export function FiltersPanel({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  selectedStrategies,
  onStrategiesChange,
  selectedDocuments,
  onDocumentsChange,
  selectedPriorSamples,
  onPriorSamplesChange,
  priorSamples,
  onClearAll,
  includeQAPairs = true // Default to including Q&A pairs
}: FiltersPanelProps) {
  const [priorSamplesSearch, setPriorSamplesSearch] = useState('');
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [isDocumentDropdownOpen, setIsDocumentDropdownOpen] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isDocumentDropdownOpen && documentInputRef.current && isOpen) {
      // Small delay to ensure the popover is rendered
      setTimeout(() => {
        documentInputRef.current?.focus();
      }, 100);
    }
  }, [isDocumentDropdownOpen, isOpen]);

  if (!isOpen) return null;

  // Get unique document names from MOCK_CONTENT_ITEMS
  const documentNames = MOCK_CONTENT_ITEMS.map(doc => doc.title);
  // Future: if includeQAPairs is false, filter logic here

  // Filter documents based on search query (after 2+ characters)
  const filteredDocuments = documentSearchQuery.length >= 2
    ? documentNames.filter(name =>
        name.toLowerCase().includes(documentSearchQuery.toLowerCase())
      )
    : [];

  const filteredPriorSamples = priorSamples.filter(sample =>
    sample.name.toLowerCase().includes(priorSamplesSearch.toLowerCase())
  );

  // Handle document selection toggle
  const handleDocumentToggle = (documentName: string) => {
    const newSelection = selectedDocuments.includes(documentName)
      ? selectedDocuments.filter(name => name !== documentName)
      : [...selectedDocuments, documentName];
    
    onDocumentsChange(newSelection);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileType;
    if (type.includes('image')) return Image;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    if (type.includes('text') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePriorSampleToggle = (sampleId: string) => {
    const newSelection = selectedPriorSamples.includes(sampleId)
      ? selectedPriorSamples.filter(id => id !== sampleId)
      : [...selectedPriorSamples, sampleId];
    
    onPriorSamplesChange(newSelection);
  };

  const totalFiltersCount = selectedTags.length + selectedStrategies.length + 
                           selectedDocuments.length + selectedPriorSamples.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 transition duration-200" onClick={onClose}>
      <div 
        className={`fixed right-4 top-4 h-[calc(100%-32px)] flex flex-col w-96 bg-background rounded-2xl shadow-xl transition-all duration-300 transform
          ${
            isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Search Filters</h2>
            <p className="text-sm text-foreground/70">
              Scope your search with filters
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Tags Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              <MultiSelectFilter
                title="Tags"
                options={TAGS_INFO.map(tag => tag.name)}
                selectedValues={selectedTags}
                onSelectionChange={onTagsChange}
                placeholder="Select tags"
                size="sm"
              />
            </div>

            {/* Strategies Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Strategies</h3>
              <MultiSelectFilter
                title="Strategies"
                options={STRATEGIES}
                selectedValues={selectedStrategies}
                onSelectionChange={onStrategiesChange}
                placeholder="Select strategies"
                size="sm"
              />
            </div>

            {/* Document Names Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Document Names</h3>
              <div className="relative">
                <Popover open={isDocumentDropdownOpen} onOpenChange={setIsDocumentDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">
                          {selectedDocuments.length === 0
                            ? 'Search document names...'
                            : 'Document Names'}
                        </span>
                        {selectedDocuments.length > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                            {selectedDocuments.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="p-0 bg-popover border z-50 w-[var(--radix-popover-trigger-width)] max-w-[300px]" 
                    align="start"
                  >
                    <div className="flex flex-col">
                      {/* Search bar */}
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground/70" />
                          <Input
                            ref={documentInputRef}
                            placeholder="Type to search documents..."
                            value={documentSearchQuery}
                            onChange={(e) => {
                              setDocumentSearchQuery(e.target.value);
                              if (e.target.value.length >= 2) {
                                setIsDocumentDropdownOpen(true);
                              }
                            }}
                            onFocus={() => {
                              if (documentSearchQuery.length >= 2) {
                                setIsDocumentDropdownOpen(true);
                              }
                            }}
                            className="pl-8"
                          />
                        </div>
                        {documentSearchQuery.length > 0 && documentSearchQuery.length < 2 && (
                          <p className="text-xs text-foreground/60 mt-2">
                            Type at least 2 characters to search
                          </p>
                        )}
                      </div>

                      {/* Options list */}
                      {documentSearchQuery.length >= 2 && (
                        <div className="max-h-60 overflow-y-auto p-1">
                          {filteredDocuments.length === 0 ? (
                            <div className="py-6 text-center text-sm text-foreground/70">
                              No documents found.
                            </div>
                          ) : (
                            filteredDocuments.slice(0, 15).map((docName) => (
                              <div
                                key={docName}
                                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-foreground/10 cursor-pointer"
                                onClick={() => handleDocumentToggle(docName)}
                              >
                                <Checkbox
                                  checked={selectedDocuments.includes(docName)}
                                  onCheckedChange={() => handleDocumentToggle(docName)}
                                />
                                <label className="text-sm font-normal cursor-pointer flex-1">
                                  {docName}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Selected documents display */}
                      {selectedDocuments.length > 0 && (
                        <div className="border-t p-2">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {selectedDocuments.map((docName) => (
                              <Badge
                                key={docName}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <span className="truncate max-w-[150px]">{docName}</span>
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDocumentToggle(docName);
                                  }}
                                />
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onDocumentsChange([]);
                              setDocumentSearchQuery('');
                            }}
                            className="h-7 w-full text-xs"
                          >
                            Clear all
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Prior Samples Section */}
            <div>
              <h3 className="text-sm font-medium mb-3">Prior Samples</h3>
              {priorSamples.length === 0 ? (
                <div className="text-center py-6 text-sm text-foreground/60">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-foreground/30" />
                  <p>No files uploaded yet</p>
                  <p className="text-xs">Upload files to use them as search filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search bar for prior samples */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground/70" />
                    <Input
                      placeholder="Search files..."
                      value={priorSamplesSearch}
                      onChange={(e) => setPriorSamplesSearch(e.target.value)}
                      className="pl-8 text-sm"
                    />
                  </div>

                  {/* Prior samples list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredPriorSamples.length === 0 ? (
                      <div className="text-center py-4 text-sm text-foreground/60">
                        No files found
                      </div>
                    ) : (
                      filteredPriorSamples.map((sample) => {
                        const FileIcon = getFileIcon(sample.type);
                        const isSelected = selectedPriorSamples.includes(sample.id);
                        
                        return (
                          <div
                            key={sample.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-sidebar-primary/10 border-sidebar-primary/20' 
                                : 'hover:bg-foreground/5 border-foreground/10'
                            }`}
                            onClick={() => handlePriorSampleToggle(sample.id)}
                          >
                            <div className="flex-shrink-0">
                              <FileIcon className="h-4 w-4 text-foreground/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{sample.name}</p>
                              <p className="text-xs text-foreground/60">
                                {formatFileSize(sample.size)} • {formatDate(sample.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {isSelected && (
                                <Check className="h-4 w-4 text-sidebar-primary" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {selectedPriorSamples.length > 0 && (
                    <p className="text-xs text-foreground/60">
                      {selectedPriorSamples.length} file{selectedPriorSamples.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-foreground/70">
              {totalFiltersCount > 0 ? (
                <span>{totalFiltersCount} filter{totalFiltersCount !== 1 ? 's' : ''} active</span>
              ) : (
                <span>No filters selected</span>
              )}
            </div>
            {totalFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          <Button
            onClick={onClose}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/80"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

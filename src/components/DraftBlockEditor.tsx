import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Plus, GripVertical, Type, Heading1, Heading2, List, Quote, Minus, Link, Image, Table } from 'lucide-react';
import type { DraftBlock, DraftBlockType } from '@/types/drafts';
import { parseContentToBlocks, serializeBlocksToContent, createEmptyBlock } from '@/utils/draftBlocks';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ADD_OPTIONS: { type: DraftBlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'paragraph', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { type: 'heading1', label: 'Heading 1', icon: <Heading1 className="h-4 w-4" /> },
  { type: 'heading2', label: 'Heading 2', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading3', label: 'Heading 3', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading4', label: 'Heading 4', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading5', label: 'Heading 5', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'heading6', label: 'Heading 6', icon: <Heading2 className="h-4 w-4" /> },
  { type: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
  { type: 'quote', label: 'Quote', icon: <Quote className="h-4 w-4" /> },
  { type: 'delimiter', label: 'Delimiter', icon: <Minus className="h-4 w-4" /> },
  { type: 'link', label: 'Link', icon: <Link className="h-4 w-4" /> },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'table', label: 'Table', icon: <Table className="h-4 w-4" /> },
];

const CONVERT_OPTIONS: { type: DraftBlockType; label: string }[] = [
  { type: 'paragraph', label: 'Text' },
  { type: 'heading1', label: 'Heading 1' },
  { type: 'heading2', label: 'Heading 2' },
  { type: 'heading3', label: 'Heading 3' },
  { type: 'heading4', label: 'Heading 4' },
  { type: 'heading5', label: 'Heading 5' },
  { type: 'heading6', label: 'Heading 6' },
  { type: 'list', label: 'List' },
  { type: 'quote', label: 'Quote' },
  { type: 'delimiter', label: 'Delimiter' },
  { type: 'link', label: 'Link' },
  { type: 'image', label: 'Image' },
  { type: 'table', label: 'Table' },
];

function filterOptions<T extends { label: string }>(options: T[], query: string): T[] {
  if (!query.trim()) return options;
  const q = query.trim().toLowerCase();
  return options.filter((o) => o.label.toLowerCase().includes(q));
}

// ----- Block content render (typography) -----
function BlockContent({ block, disabled, onContentChange }: { block: DraftBlock; disabled?: boolean; onContentChange: (id: string, content: string) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onContentChange(block.id, e.target.value);
  };

  const commonInputClass = 'w-full bg-transparent border-0 outline-none resize-none focus:ring-0 p-0';

  switch (block.type) {
    case 'heading1':
      return (
        <input
          className={cn(commonInputClass, 'text-2xl font-bold')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 1"
        />
      );
    case 'heading2':
      return (
        <input
          className={cn(commonInputClass, 'text-xl font-bold')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 2"
        />
      );
    case 'heading3':
      return (
        <input
          className={cn(commonInputClass, 'text-lg font-semibold')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 3"
        />
      );
    case 'heading4':
      return (
        <input
          className={cn(commonInputClass, 'text-base font-semibold')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 4"
        />
      );
    case 'heading5':
      return (
        <input
          className={cn(commonInputClass, 'text-sm font-semibold')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 5"
        />
      );
    case 'heading6':
      return (
        <input
          className={cn(commonInputClass, 'text-sm font-semibold text-foreground/90')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Heading 6"
        />
      );
    case 'quote':
      return (
        <textarea
          className={cn(commonInputClass, 'border-l-4 border-foreground/30 pl-3 italic text-foreground/90 min-h-[2.5rem]')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Quote"
          rows={2}
        />
      );
    case 'list':
      return (
        <textarea
          className={cn(commonInputClass, 'pl-6 list-disc list-inside min-h-[2rem]')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="List items (one per line)"
          rows={Math.max(2, block.content.split('\n').length)}
        />
      );
    case 'delimiter':
      return <hr className="border-t border-foreground/20 my-2 w-full" />;
    case 'link':
      return (
        <input
          className={cn(commonInputClass, 'text-primary underline')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="https://..."
        />
      );
    case 'image':
      return (
        <input
          className={cn(commonInputClass, 'text-sm')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Image URL or placeholder"
        />
      );
    case 'table':
      return (
        <textarea
          className={cn(commonInputClass, 'text-sm font-mono')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Table (placeholder)"
          rows={2}
        />
      );
    case 'paragraph':
    default:
      return (
        <textarea
          className={cn(commonInputClass, 'text-[15px] leading-6 min-h-[1.5rem]')}
          value={block.content}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Paragraph"
          rows={Math.max(1, Math.min(6, block.content.split('\n').length)) || 1}
        />
      );
  }
}

// ----- Single block row with hover toolbar -----
function DraftBlockRow({
  block,
  index,
  total,
  disabled,
  onContentChange,
  onInsertBelow,
  onConvert,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  block: DraftBlock;
  index: number;
  total: number;
  disabled?: boolean;
  onContentChange: (id: string, content: string) => void;
  onInsertBelow: (index: number, type: DraftBlockType) => void;
  onConvert: (id: string, type: DraftBlockType) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [addFilter, setAddFilter] = useState('');
  const [tuneFilter, setTuneFilter] = useState('');
  const [toolbarTop, setToolbarTop] = useState(0);
  const blockRef = useRef<HTMLDivElement>(null);

  const filteredAdd = filterOptions(ADD_OPTIONS, addFilter);
  const filteredTune = filterOptions(CONVERT_OPTIONS, tuneFilter);

  // Calculate top offset when hovering - relative to the positioned parent (response bubble)
  useLayoutEffect(() => {
    if ((hover || addOpen || tuneOpen) && blockRef.current) {
      // Get offsetTop relative to the nearest positioned ancestor (response bubble container)
      const offsetTop = blockRef.current.offsetTop;
      setToolbarTop(offsetTop);
    }
  }, [hover, addOpen, tuneOpen]);

  return (
    <div
      ref={blockRef}
      className="group flex items-start"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Hover toolbar right - positioned absolutely relative to response bubble container */}
      {!disabled && (hover || addOpen || tuneOpen) && (
        <div 
          className="absolute right-2 flex flex-row items-center gap-1 shrink-0 z-10 transform translate-y-[-4px]"
          style={{ top: `${toolbarTop}px` }}
        >
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                aria-label="Add block"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search..."
                  value={addFilter}
                  onChange={(e) => setAddFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredAdd.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/10"
                    onClick={() => {
                      onInsertBelow(index, opt.type);
                      setAddOpen(false);
                      setAddFilter('');
                    }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
                {filteredAdd.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={tuneOpen} onOpenChange={setTuneOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                aria-label="Tune block"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0">
              <div className="p-2 border-b">
                <Input
                  placeholder="Search..."
                  value={tuneFilter}
                  onChange={(e) => setTuneFilter(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Convert to</div>
                {filteredTune.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/10',
                      block.type === opt.type && 'bg-foreground/10'
                    )}
                    onClick={() => {
                      onConvert(block.id, opt.type);
                      setTuneOpen(false);
                      setTuneFilter('');
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="border-t my-1" />
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/10 disabled:opacity-50"
                  onClick={() => { onMoveUp(index); setTuneOpen(false); }}
                  disabled={index === 0}
                >
                  Move up
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-foreground/10 disabled:opacity-50"
                  onClick={() => { onMoveDown(index); setTuneOpen(false); }}
                  disabled={index === total - 1}
                >
                  Move down
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive"
                  onClick={() => { onDelete(index); setTuneOpen(false); }}
                >
                  Delete
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      <div className="flex-1 min-w-0 w-full mr-[50px]">
        <BlockContent block={block} disabled={disabled} onContentChange={onContentChange} />
      </div>
    </div>
  );
}

export interface DraftBlockEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  streamingText?: string;
}

export function DraftBlockEditor({
  content,
  onContentChange,
  disabled = false,
  placeholder = 'Your draft will appear here...',
  isLoading = false,
  streamingText = '',
}: DraftBlockEditorProps) {
  const [blocks, setBlocks] = useState<DraftBlock[]>(() => parseContentToBlocks(content));
  const lastContentRef = useRef(content);

  // Sync blocks from parent content when it changes externally (e.g. Accept/Reject)
  useEffect(() => {
    if (content === lastContentRef.current) return;
    lastContentRef.current = content;
    const parsed = parseContentToBlocks(content);
    setBlocks(parsed.length > 0 ? parsed : [createEmptyBlock('paragraph')]);
  }, [content]);

  // When content is empty, ensure we have one empty block so user can type and see Add/Tune
  useEffect(() => {
    if (content === '' && blocks.length === 0) {
      setBlocks([createEmptyBlock('paragraph')]);
    }
  }, [content, blocks.length]);

  const emit = useCallback(
    (newBlocks: DraftBlock[]) => {
      setBlocks(newBlocks);
      const out = serializeBlocksToContent(newBlocks);
      lastContentRef.current = out;
      onContentChange(out);
    },
    [onContentChange]
  );

  const handleContentChange = useCallback(
    (id: string, newContent: string) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, content: newContent } : b));
        emit(next);
        return next;
      });
    },
    [emit]
  );

  const handleInsertBelow = useCallback(
    (index: number, type: DraftBlockType) => {
      const newBlock = createEmptyBlock(type);
      setBlocks((prev) => {
        const next = [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
        emit(next);
        return next;
      });
    },
    [emit]
  );

  const handleConvert = useCallback(
    (id: string, type: DraftBlockType) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, type } : b));
        emit(next);
        return next;
      });
    },
    [emit]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setBlocks((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        emit(next);
        return next;
      });
    },
    [emit]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= blocks.length - 1) return;
      setBlocks((prev) => {
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        emit(next);
        return next;
      });
    },
    [emit, blocks.length]
  );

  const handleDelete = useCallback(
    (index: number) => {
      setBlocks((prev) => {
        const next = prev.filter((_, i) => i !== index);
        emit(next.length ? next : [createEmptyBlock('paragraph')]);
        return next.length ? next : [createEmptyBlock('paragraph')];
      });
    },
    [emit]
  );

  // Streaming view
  if (isLoading && streamingText && blocks.length <= 1 && !content.trim()) {
    return (
      <div className="text-[15px] leading-6 text-foreground/90 whitespace-pre-wrap min-h-[120px]">
        {streamingText}
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
      </div>
    );
  }

  const showBlocks = blocks.length > 0 ? blocks : [];

  return (
    <div className="space-y-1">
      {showBlocks.length === 0 && !isLoading && (
        <p className="text-muted-foreground text-sm py-2">{placeholder}</p>
      )}
      {showBlocks.map((block, index) => (
        <DraftBlockRow
          key={block.id}
          block={block}
          index={index}
          total={showBlocks.length}
          disabled={disabled}
          onContentChange={handleContentChange}
          onInsertBelow={handleInsertBelow}
          onConvert={handleConvert}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

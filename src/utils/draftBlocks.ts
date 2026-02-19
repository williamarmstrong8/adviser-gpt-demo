import type { DraftBlock, DraftBlockType } from '@/types/drafts';

let idCounter = 0;
export function nextBlockId(): string {
  return `block-${Date.now()}-${++idCounter}`;
}
function stableId(index: number, type: string, contentSlice: string): string {
  const slug = `${index}-${type}-${contentSlice.slice(0, 20)}`.replace(/\s/g, '_');
  return `block-${slug}-${index}`;
}

/**
 * Parse markdown string into an array of DraftBlock.
 * Supports: # ## ### headings, - list, > quote, --- delimiter, paragraphs.
 */
export function parseContentToBlocks(content: string): DraftBlock[] {
  if (!content || !content.trim()) {
    return [];
  }
  const lines = content.split(/\n/);
  const blocks: DraftBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Delimiter (---)
    if (/^---+$/.test(trimmed)) {
      blocks.push({ id: stableId(blocks.length, 'delimiter', ''), type: 'delimiter', content: '' });
      i++;
      continue;
    }

    // Headings (# to ######)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headingMatch[2].trim();
      blocks.push({
        id: stableId(blocks.length, `heading${level}`, text),
        type: `heading${level}` as DraftBlockType,
        content: text,
      });
      i++;
      continue;
    }

    // Quote (>
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const quoteContent = quoteLines.join('\n');
      blocks.push({ id: stableId(blocks.length, 'quote', quoteContent), type: 'quote', content: quoteContent });
      continue;
    }

    // Unordered list (- or * )
    if (trimmed.match(/^[-*]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      const listContent = listItems.join('\n');
      blocks.push({ id: stableId(blocks.length, 'list', listContent), type: 'list', content: listContent });
      continue;
    }

    // Paragraph: collect until blank line or start of another block type
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (t === '') break;
      if (/^---+$/.test(t)) break;
      if (/^#{1,6}\s/.test(t)) break;
      if (t.startsWith('>')) break;
      if (/^[-*]\s+/.test(t)) break;
      paraLines.push(l);
      i++;
    }
    const paraText = paraLines.join('\n').trim();
    if (paraText) {
      blocks.push({ id: stableId(blocks.length, 'paragraph', paraText), type: 'paragraph', content: paraText });
    }
    if (i < lines.length && lines[i].trim() === '') {
      i++;
    }
  }

  return blocks;
}

/**
 * Serialize DraftBlock[] back to markdown string.
 */
export function serializeBlocksToContent(blocks: DraftBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'delimiter':
        parts.push('---');
        break;
      case 'heading1':
        parts.push(`# ${block.content}`);
        break;
      case 'heading2':
        parts.push(`## ${block.content}`);
        break;
      case 'heading3':
        parts.push(`### ${block.content}`);
        break;
      case 'heading4':
        parts.push(`#### ${block.content}`);
        break;
      case 'heading5':
        parts.push(`##### ${block.content}`);
        break;
      case 'heading6':
        parts.push(`###### ${block.content}`);
        break;
      case 'quote':
        block.content.split('\n').forEach((ln) => parts.push(`> ${ln}`));
        break;
      case 'list':
        block.content.split('\n').forEach((ln) => {
          if (ln.trim()) parts.push(`- ${ln.trim()}`);
        });
        break;
      case 'paragraph':
      case 'link':
      case 'image':
      case 'table':
      default:
        if (block.content) parts.push(block.content);
        break;
    }
    parts.push(''); // blank between blocks
  }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function createEmptyBlock(type: DraftBlockType): DraftBlock {
  const defaults: Record<DraftBlockType, string> = {
    paragraph: '',
    heading1: 'New heading',
    heading2: 'New heading',
    heading3: 'New heading',
    heading4: 'New heading',
    heading5: 'New heading',
    heading6: 'New heading',
    list: '',
    quote: '',
    delimiter: '',
    link: '',
    image: '',
    table: '',
  };
  return {
    id: nextBlockId(),
    type,
    content: defaults[type] ?? '',
  };
}

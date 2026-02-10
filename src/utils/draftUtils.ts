// Utility functions for drafts feature

/**
 * Generate a title from a prompt by extracting the first 10-15 words
 */
export function generatePromptTitle(prompt: string): string {
  if (!prompt || !prompt.trim()) {
    return 'Untitled Prompt';
  }

  const words = prompt.trim().split(/\s+/);
  const maxWords = 15;
  const minWords = 10;

  // If prompt is shorter than minWords, use all words
  if (words.length <= minWords) {
    return words.join(' ');
  }

  // Extract first maxWords words
  const titleWords = words.slice(0, maxWords);
  let title = titleWords.join(' ');

  // If we cut off mid-sentence, try to end at a complete word
  // Check if the last word is complete (not cut off)
  if (words.length > maxWords) {
    // Remove trailing punctuation that might be incomplete
    title = title.replace(/[.,;:!?]+$/, '');
  }

  // Add ellipsis if we truncated
  if (words.length > maxWords) {
    title += '...';
  }

  return title;
}

/**
 * Generate a title from draft content by extracting the first 10-15 words
 */
export function generateDraftTitle(content: string): string {
  if (!content || !content.trim()) {
    return 'Untitled Draft';
  }

  // Remove markdown headers, lists, etc. for cleaner title extraction
  const cleanContent = content
    .replace(/^#+\s+/gm, '') // Remove markdown headers
    .replace(/^\*\s+/gm, '') // Remove markdown list items
    .replace(/^-\s+/gm, '') // Remove markdown list items
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list items
    .trim();

  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  const maxWords = 15;
  const minWords = 10;

  // If content is shorter than minWords, use all words
  if (words.length <= minWords) {
    return words.join(' ');
  }

  // Extract first maxWords words
  const titleWords = words.slice(0, maxWords);
  let title = titleWords.join(' ');

  // Remove trailing punctuation that might be incomplete
  title = title.replace(/[.,;:!?]+$/, '');

  // Add ellipsis if we truncated
  if (words.length > maxWords) {
    title += '...';
  }

  return title;
}

/**
 * Generate a firm ID from company name (simple hash)
 */
export function generateFirmId(companyName: string): string {
  if (!companyName || !companyName.trim()) {
    return `firm-${Date.now()}`;
  }

  // Simple hash function
  let hash = 0;
  const normalized = companyName.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `firm-${Math.abs(hash)}`;
}

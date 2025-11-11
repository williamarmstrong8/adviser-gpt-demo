import { QuestionItem, Tag } from '@/types/vault';

/**
 * Convert legacy strategy field to tags with type "Strategy"
 */
export function migrateStrategyToTags(strategy: string | string[] | undefined): Tag[] {
  if (!strategy) {
    return [];
  }

  const strategies = Array.isArray(strategy) ? strategy : [strategy];
  return strategies.map(s => ({
    type: 'Strategy',
    value: s,
  }));
}

/**
 * Convert legacy tags array to tags with type "Category"
 */
export function migrateTagsToCategoryTags(tags: string[] | undefined): Tag[] {
  if (!tags || !Array.isArray(tags)) {
    return [];
  }

  return tags.map(tag => ({
    type: 'Category',
    value: tag,
  }));
}

/**
 * Migrate a QuestionItem from legacy format to new tag format
 * This combines strategy and tags into the new tags array
 */
export function migrateQuestionItem(item: any): QuestionItem {
  // If item already has new format tags, return as is
  if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
    const firstTag = item.tags[0];
    if (typeof firstTag === 'object' && 'type' in firstTag && 'value' in firstTag) {
      // Already migrated
      return item as QuestionItem;
    }
  }

  // Migrate from legacy format
  const strategyTags = migrateStrategyToTags(item.strategy);
  const categoryTags = migrateTagsToCategoryTags(
    Array.isArray(item.tags) && typeof item.tags[0] === 'string' ? item.tags : []
  );

  // Combine all tags
  const newTags: Tag[] = [...strategyTags, ...categoryTags];

  return {
    ...item,
    tags: newTags,
    // Keep strategy field for backward compatibility during transition
    strategy: item.strategy,
  };
}

/**
 * Migrate an array of QuestionItems
 */
export function migrateQuestionItems(items: any[]): QuestionItem[] {
  return items.map(item => {
    const migrated = migrateQuestionItem(item);
    // Also migrate children if they exist
    if (migrated.children && Array.isArray(migrated.children)) {
      return {
        ...migrated,
        children: migrated.children.map(child => migrateQuestionItem(child)),
      };
    }
    return migrated;
  });
}


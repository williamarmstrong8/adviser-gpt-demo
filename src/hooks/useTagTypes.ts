import { useState, useEffect, useCallback } from 'react';
import { TagType, TagTypeConfig, STRATEGIES, TAGS_INFO } from '@/types/vault';

const STORAGE_KEY = 'advisergpt_tag_types_config';

// Initialize default tag types from existing data
const getDefaultTagTypes = (): TagType[] => {
  return [
    {
      id: 'strategy',
      name: 'Strategy',
      values: STRATEGIES,
    },
    {
      id: 'category',
      name: 'Category',
      values: TAGS_INFO.map(tag => tag.name),
    },
  ];
};

// Load tag types from localStorage or return defaults
const loadTagTypes = (): TagType[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config: TagTypeConfig = JSON.parse(stored);
      return config.tagTypes;
    }
  } catch (error) {
    console.error('Error loading tag types from localStorage:', error);
  }
  return getDefaultTagTypes();
};

// Save tag types to localStorage
const saveTagTypes = (tagTypes: TagType[]): void => {
  try {
    const config: TagTypeConfig = { tagTypes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving tag types to localStorage:', error);
  }
};

export function useTagTypes() {
  const [tagTypes, setTagTypes] = useState<TagType[]>(loadTagTypes);

  // Save to localStorage whenever tagTypes change
  useEffect(() => {
    saveTagTypes(tagTypes);
  }, [tagTypes]);

  // Get all tag types
  const getAllTagTypes = useCallback((): TagType[] => {
    return tagTypes;
  }, [tagTypes]);

  // Get a specific tag type by name
  const getTagType = useCallback(
    (name: string): TagType | undefined => {
      return tagTypes.find(tt => tt.name === name);
    },
    [tagTypes]
  );

  // Get allowed values for a tag type
  const getTagTypeValues = useCallback(
    (tagTypeName: string): string[] => {
      const tagType = tagTypes.find(tt => tt.name === tagTypeName);
      return tagType?.values || [];
    },
    [tagTypes]
  );

  // Create a new tag type
  const createTagType = useCallback(
    (name: string): boolean => {
      // Check if tag type name already exists
      if (tagTypes.some(tt => tt.name === name)) {
        return false; // Duplicate name
      }

      const newTagType: TagType = {
        id: `tag-type-${Date.now()}`,
        name,
        values: [],
      };

      setTagTypes(prev => [...prev, newTagType]);
      return true;
    },
    [tagTypes]
  );

  // Add a value to a tag type
  const addTagTypeValue = useCallback(
    (tagTypeName: string, value: string): boolean => {
      // Check if value already exists in this tag type
      const tagType = tagTypes.find(tt => tt.name === tagTypeName);
      if (!tagType) {
        return false; // Tag type doesn't exist
      }

      if (tagType.values.includes(value)) {
        return false; // Value already exists
      }

      setTagTypes(prev =>
        prev.map(tt =>
          tt.name === tagTypeName
            ? { ...tt, values: [...tt.values, value] }
            : tt
        )
      );
      return true;
    },
    [tagTypes]
  );

  // Remove a value from a tag type
  const removeTagTypeValue = useCallback(
    (tagTypeName: string, value: string): void => {
      setTagTypes(prev =>
        prev.map(tt =>
          tt.name === tagTypeName
            ? { ...tt, values: tt.values.filter(v => v !== value) }
            : tt
        )
      );
    },
    []
  );

  // Delete a tag type
  const deleteTagType = useCallback((tagTypeName: string): void => {
    setTagTypes(prev => prev.filter(tt => tt.name !== tagTypeName));
  }, []);

  // Check if a tag value is in use (used by vault items)
  // This will need to check all vault items - for now, we'll pass items as parameter
  const isTagValueInUse = useCallback(
    (tagTypeName: string, value: string, allItems: any[]): boolean => {
      return allItems.some(item => {
        if (!item.tags || !Array.isArray(item.tags)) {
          return false;
        }
        return item.tags.some(
          (tag: { type: string; value: string }) =>
            tag.type === tagTypeName && tag.value === value
        );
      });
    },
    []
  );

  return {
    tagTypes,
    getAllTagTypes,
    getTagType,
    getTagTypeValues,
    createTagType,
    addTagTypeValue,
    removeTagTypeValue,
    deleteTagType,
    isTagValueInUse,
  };
}


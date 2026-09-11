'use client';

import { useCallback } from 'react';
import { db, categoryOps } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useCategories() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []);

  const addCategory = useCallback(async (name) => {
    return categoryOps.add(name);
  }, []);

  const renameCategory = useCallback(async (id, name) => {
    return categoryOps.rename(id, name);
  }, []);

  const deleteCategory = useCallback(async (id, replacement) => {
    return categoryOps.delete(id, replacement);
  }, []);

  return {
    categories: categories || [],
    loading: categories === undefined,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}

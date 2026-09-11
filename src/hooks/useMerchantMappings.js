'use client';

import { useCallback } from 'react';
import { db, merchantMappingOps } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export function useMerchantMappings() {
  const mappings = useLiveQuery(() => db.merchantMappings.orderBy('merchant').toArray(), []);

  const getCategory = useCallback(async (merchant) => {
    return merchantMappingOps.getCategory(merchant);
  }, []);

  const setMapping = useCallback(async (merchant, category) => {
    return merchantMappingOps.setMapping(merchant, category);
  }, []);

  const deleteMapping = useCallback(async (id) => {
    return merchantMappingOps.delete(id);
  }, []);

  return {
    mappings: mappings || [],
    loading: mappings === undefined,
    getCategory,
    setMapping,
    deleteMapping,
  };
}

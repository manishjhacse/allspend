'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, expenseOps } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Hook for expense CRUD operations
 */
export function useExpenses() {
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []);

  const addExpense = useCallback(async (expense) => {
    return expenseOps.add(expense);
  }, []);

  const updateExpense = useCallback(async (id, changes) => {
    return expenseOps.update(id, changes);
  }, []);

  const deleteExpense = useCallback(async (id) => {
    return expenseOps.delete(id);
  }, []);

  const getExpense = useCallback(async (id) => {
    return expenseOps.getById(id);
  }, []);

  const checkDuplicate = useCallback(async (expense) => {
    return expenseOps.checkDuplicate(expense);
  }, []);

  return {
    expenses: expenses || [],
    loading: expenses === undefined,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    checkDuplicate,
  };
}

/**
 * Hook for monthly expense summary
 */
export function useMonthlyExpenses(year, month) {
  const expenses = useLiveQuery(
    () => expenseOps.getByMonth(year, month),
    [year, month]
  );

  return {
    expenses: expenses || [],
    loading: expenses === undefined,
    total: (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0),
    count: (expenses || []).length,
  };
}

/**
 * Hook for yearly expense summary
 */
export function useYearlyExpenses(year) {
  const expenses = useLiveQuery(
    () => expenseOps.getByYear(year),
    [year]
  );

  return {
    expenses: expenses || [],
    loading: expenses === undefined,
  };
}

/**
 * Hook for a single expense
 */
export function useExpense(id) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    expenseOps.getById(id).then((e) => {
      setExpense(e || null);
      setLoading(false);
    });
  }, [id]);

  return { expense, loading };
}

import Dexie from 'dexie';

export const db = new Dexie('AllSpendDB');

// v1 — original schema
db.version(1).stores({
  expenses: '++id, date, category, merchant, transactionId, paymentMethod, source, createdAt',
  merchantMappings: '++id, &merchant, category',
  categories: '++id, &name',
  settings: '&key',
});

// v2 — added transactionType, status, paymentApp indexes
db.version(2).stores({
  expenses: '++id, date, category, merchant, transactionId, paymentMethod, paymentApp, transactionType, status, source, createdAt',
  merchantMappings: '++id, &merchant, category',
  categories: '++id, &name',
  settings: '&key',
});

// Default categories matching Gemini Vision output + reference UI
const DEFAULT_CATEGORIES = [
  'Food', 'Groceries', 'Shopping', 'Travel', 'Rent',
  'Investments', 'Health', 'EMI/Bill', 'Subscriptions',
  'Entertainment', 'Education', 'Personal', 'Others',
];

const DEFAULT_MERCHANT_MAPPINGS = [
  // Food
  { merchant: 'zomato', category: 'Food' },
  { merchant: 'swiggy', category: 'Food' },
  { merchant: 'dominos', category: 'Food' },
  { merchant: 'domino\'s', category: 'Food' },
  { merchant: 'mcdonalds', category: 'Food' },
  { merchant: 'kfc', category: 'Food' },
  { merchant: 'starbucks', category: 'Food' },
  { merchant: 'pizza hut', category: 'Food' },
  // Groceries
  { merchant: 'blinkit', category: 'Groceries' },
  { merchant: 'zepto', category: 'Groceries' },
  { merchant: 'bigbasket', category: 'Groceries' },
  { merchant: 'dunzo', category: 'Groceries' },
  { merchant: 'jiomart', category: 'Groceries' },
  // Shopping
  { merchant: 'amazon', category: 'Shopping' },
  { merchant: 'flipkart', category: 'Shopping' },
  { merchant: 'myntra', category: 'Shopping' },
  { merchant: 'meesho', category: 'Shopping' },
  { merchant: 'nykaa', category: 'Shopping' },
  { merchant: 'ajio', category: 'Shopping' },
  // Travel
  { merchant: 'uber', category: 'Travel' },
  { merchant: 'ola', category: 'Travel' },
  { merchant: 'rapido', category: 'Travel' },
  { merchant: 'redbus', category: 'Travel' },
  { merchant: 'irctc', category: 'Travel' },
  { merchant: 'makemytrip', category: 'Travel' },
  { merchant: 'goibibo', category: 'Travel' },
  { merchant: 'indigo', category: 'Travel' },
  // Subscriptions
  { merchant: 'netflix', category: 'Subscriptions' },
  { merchant: 'spotify', category: 'Subscriptions' },
  { merchant: 'youtube', category: 'Subscriptions' },
  { merchant: 'hotstar', category: 'Subscriptions' },
  { merchant: 'disney', category: 'Subscriptions' },
  { merchant: 'sony liv', category: 'Subscriptions' },
  { merchant: 'prime video', category: 'Subscriptions' },
  { merchant: 'jio cinema', category: 'Subscriptions' },
  // EMI/Bill
  { merchant: 'airtel', category: 'EMI/Bill' },
  { merchant: 'jio', category: 'EMI/Bill' },
  { merchant: 'vodafone', category: 'EMI/Bill' },
  { merchant: 'bsnl', category: 'EMI/Bill' },
  { merchant: 'electricity', category: 'EMI/Bill' },
  { merchant: 'water bill', category: 'EMI/Bill' },
  { merchant: 'gas', category: 'EMI/Bill' },
  // Health
  { merchant: 'apollo', category: 'Health' },
  { merchant: 'practo', category: 'Health' },
  { merchant: 'medplus', category: 'Health' },
  { merchant: 'netmeds', category: 'Health' },
  { merchant: 'pharmeasy', category: 'Health' },
  // Education
  { merchant: 'udemy', category: 'Education' },
  { merchant: 'coursera', category: 'Education' },
  { merchant: 'unacademy', category: 'Education' },
  { merchant: 'byju', category: 'Education' },
];

// Seed default categories (idempotent)
export async function seedDefaultCategories() {
  const existing = await db.categories.toArray();
  const existingNames = new Set(existing.map((c) => c.name));
  const toAdd = DEFAULT_CATEGORIES
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ name }));
  if (toAdd.length > 0) {
    await db.categories.bulkAdd(toAdd);
  }
}

// Seed default merchant mappings (idempotent)
export async function seedDefaultMerchantMappings() {
  const count = await db.merchantMappings.count();
  if (count > 0) return;
  await db.merchantMappings.bulkAdd(DEFAULT_MERCHANT_MAPPINGS);
}

export async function initDB() {
  await seedDefaultCategories();
  await seedDefaultMerchantMappings();
}

// ─── Expense Operations ──────────────────────────────────────────────────────

export const expenseOps = {
  async add(expense) {
    const now = new Date().toISOString();
    return db.expenses.add({
      ...expense,
      createdAt: now,
      updatedAt: now,
    });
  },

  async update(id, changes) {
    return db.expenses.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id) {
    return db.expenses.delete(id);
  },

  async getById(id) {
    return db.expenses.get(Number(id));
  },

  async getByMonth(year, month) {
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    return db.expenses.where('date').between(start, end, true, true).sortBy('date');
  },

  async getByYear(year) {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    return db.expenses.where('date').between(start, end, true, true).sortBy('date');
  },

  async getAll() {
    return db.expenses.orderBy('date').reverse().toArray();
  },

  async checkDuplicate(expense) {
    // Check by transactionId
    if (expense.transactionId) {
      const existing = await db.expenses
        .where('transactionId')
        .equals(expense.transactionId)
        .first();
      if (existing) return { type: 'exact', expense: existing };
    }

    // Check by amount + merchant + date
    if (expense.amount && expense.merchant && expense.date) {
      const candidates = await db.expenses.where('date').equals(expense.date).toArray();
      const match = candidates.find(
        (e) =>
          e.amount === expense.amount &&
          e.merchant?.toLowerCase() === expense.merchant?.toLowerCase()
      );
      if (match) return { type: 'likely', expense: match };
    }

    return null;
  },
};

// ─── Category Operations ─────────────────────────────────────────────────────

export const categoryOps = {
  async getAll() {
    return db.categories.orderBy('name').toArray();
  },
  async add(name) {
    return db.categories.add({ name, createdAt: new Date().toISOString() });
  },
  async rename(id, name) {
    return db.categories.update(id, { name });
  },
  async delete(id, replacementName = 'Others') {
    const cat = await db.categories.get(id);
    if (cat) {
      await db.expenses.where('category').equals(cat.name).modify({ category: replacementName });
    }
    return db.categories.delete(id);
  },
};

// ─── Merchant Mapping Operations ─────────────────────────────────────────────

export const merchantMappingOps = {
  async getCategory(merchantName) {
    const key = merchantName.toLowerCase().trim();
    const exact = await db.merchantMappings.where('merchant').equals(key).first();
    if (exact) return exact.category;
    const all = await db.merchantMappings.toArray();
    const partial = all.find((m) => key.includes(m.merchant) || m.merchant.includes(key));
    return partial ? partial.category : null;
  },

  async setMapping(merchant, category) {
    const key = merchant.toLowerCase().trim();
    const existing = await db.merchantMappings.where('merchant').equals(key).first();
    if (existing) {
      return db.merchantMappings.update(existing.id, {
        category,
        updatedAt: new Date().toISOString(),
      });
    }
    return db.merchantMappings.add({ merchant: key, category, createdAt: new Date().toISOString() });
  },

  async getAll() {
    return db.merchantMappings.orderBy('merchant').toArray();
  },

  async delete(id) {
    return db.merchantMappings.delete(id);
  },
};

// ─── Settings Operations ─────────────────────────────────────────────────────

export const settingsOps = {
  async get(key, defaultValue = null) {
    const record = await db.settings.get(key);
    return record ? record.value : defaultValue;
  },
  async set(key, value) {
    return db.settings.put({ key, value });
  },
};

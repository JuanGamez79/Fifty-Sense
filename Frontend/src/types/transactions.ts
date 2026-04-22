export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  account_id: string;
  account_name: string;
  balance: number;
}

export interface Category {
  _id: string;
  category_id?: string;
  category_name: string;
  icon?: string;
}

export interface Transaction {
  _id: string;
  transaction_id: string;
  account_id: string;
  to_account_id?: string;
  category_id: string;
  description?: string;
  amount: number;
  type: TransactionType;
  date: string;
}

export interface EditState {
  description: string;
  category_id: string;
  amount: string;
  type: TransactionType;
  account_id: string;
  to_account_id: string;
}

export interface FieldErrors {
  description?: string;
  amount?: string;
}

export interface CreateTransactionPayload {
  account_id: string;
  to_account_id?: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
}

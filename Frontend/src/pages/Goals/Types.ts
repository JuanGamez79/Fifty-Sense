export interface Goal {
  _id: string;
  goal_id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  date_created: string;
  is_active: boolean;
}

export type FilterTab = "All Goals" | "In Progress" | "Completed";
export type SortKey   = "Progress" | "Deadline" | "Amount";
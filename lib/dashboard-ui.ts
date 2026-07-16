export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "جدید",
  review: "بررسی",
  in_progress: "در حال انجام",
  completed: "تکمیل",
  cancelled: "لغو",
};

export const ORDER_STATUS_CLIENT: Record<string, string> = {
  new: "جدید",
  review: "در حال بررسی",
  in_progress: "در حال انجام",
  completed: "تکمیل‌شده",
  cancelled: "لغو شده",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "باز",
  answered: "پاسخ‌داده‌شده",
  closed: "بسته",
};

export const ORDER_FLOW = ["new", "review", "in_progress", "completed"] as const;

export function orderBadgeClass(status: string) {
  return `dash-badge order-${status}`;
}

export function ticketBadgeClass(status: string) {
  return `dash-badge ticket-${status}`;
}

export function orderProgressIndex(status: string) {
  const idx = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  return idx >= 0 ? idx : 0;
}

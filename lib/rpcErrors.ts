/**
 * Map Supabase/Postgres errors from create_order to user-facing copy.
 */
export function messageForCreateOrderError(err: {
  message?: string;
  code?: string;
  details?: string;
}): string {
  const msg = (err.message || "").toLowerCase();
  const details = (err.details || "").toLowerCase();

  if (msg.includes("not_authenticated") || details.includes("not_authenticated")) {
    return "You need to sign in to place an order.";
  }
  if (msg.includes("product_not_found") || details.includes("product_not_found")) {
    return "One of the products is no longer available.";
  }
  if (msg.includes("product_unavailable") || details.includes("product_unavailable")) {
    return "One of the products is inactive or unavailable.";
  }
  if (msg.includes("insufficient_stock") || details.includes("insufficient_stock")) {
    return "Not enough stock for one or more items. Reduce quantities and try again.";
  }
  if (msg.includes("duplicate") || msg.includes("unique")) {
    return "This order could not be created. Please try again.";
  }
  return err.message || "Something went wrong. Please try again.";
}

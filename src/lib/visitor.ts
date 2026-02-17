export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("contractear_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("contractear_visitor_id", id);
  }
  return id;
}

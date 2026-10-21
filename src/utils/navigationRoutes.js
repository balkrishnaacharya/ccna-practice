export const ROUTE_ORDER = {
  "/": 0,
  "/quiz": 1,
  "/practical-exam": 2,
  "/notes": 3,
  "/review": 4,
  "/history": 5,
  "/settings": 6,
  "/exam": 7,
};

export function getRouteRank(pathname) {
  if (ROUTE_ORDER[pathname] !== undefined) return ROUTE_ORDER[pathname];
  if (pathname.startsWith("/history/")) return 5.5;
  return 3;
}

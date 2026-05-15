export const ROLES = {
  RETAILER: "retailer",
  STAFF: "staff",
  CUSTOMER: "customer",
};

export const ROUTE_ROLES = {
  "/dashboard": [ROLES.RETAILER, ROLES.STAFF],
  "/listing": [ROLES.RETAILER, ROLES.STAFF],
  "/procurement": [ROLES.RETAILER, ROLES.STAFF],
  "/inventory": [ROLES.RETAILER, ROLES.STAFF],
  "/buy": [ROLES.RETAILER, ROLES.STAFF],
  "/coupons": [ROLES.RETAILER],
  "/broadcast": [ROLES.RETAILER],
  "/members": [ROLES.RETAILER, ROLES.STAFF],
  "/documents": [ROLES.RETAILER, ROLES.STAFF],
  "/ledger": [ROLES.RETAILER],
  "/advertisement": [ROLES.RETAILER],
  "/reports": [ROLES.RETAILER, ROLES.STAFF],
  "/inquiry": [ROLES.RETAILER, ROLES.STAFF],
  "/attendance": [ROLES.RETAILER],
  "/tasks": [ROLES.RETAILER],
  "/settings": [ROLES.RETAILER, ROLES.STAFF, ROLES.CUSTOMER],
};

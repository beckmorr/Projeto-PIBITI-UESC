export const ROUTES = {
  root: "/",
  home: "/home",
  preditor: "/preditor",
  contrafactual: "/contrafactual",
  visualizar: "/visualizar",
  legacySobre: "/sobre",
} as const;

export const NAVBAR_ITEMS = [
  { label: "Home", to: ROUTES.home },
  { label: "Preditor", to: ROUTES.preditor },
  { label: "Visualizar", to: ROUTES.visualizar },
  { label: "Contrafactual", to: ROUTES.contrafactual },
] as const;

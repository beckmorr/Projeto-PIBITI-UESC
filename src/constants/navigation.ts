export const ROUTES = {
  root: "/",
  home: "/home",
  preditor: "/preditor",
  simulador: "/simulador",
  contrafactual: "/contrafactual",
  witOficial: "/wit-oficial",
  visualizar: "/visualizar",
  legacySobre: "/sobre",
} as const;

export const NAVBAR_ITEMS = [
  { label: "Home", to: ROUTES.home },
  { label: "Preditor", to: ROUTES.preditor },
  { label: "Visualizar", to: ROUTES.visualizar },
  { label: "Simulador", to: ROUTES.simulador },
] as const;

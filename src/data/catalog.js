const groups = [
  [
    "Motores",
    [
      ["Motor 4 cilindros hasta 1.6", 450],
      ["Motor 4 cilindros 2.0 a 2.6", 500],
      ["Motor 6 cilindros Explorer", 1000],
      ["Motor 6 cilindros otros", 800],
      ["Motor 8 cilindros full inyección", 1000],
      ["Motor 8 cilindros carburado", 800],
    ],
  ],
  [
    "Entonaciones",
    [
      ["Entonación menor 4 cilindros", 40],
      ["Entonación mayor 4 cilindros", 60],
      ["Entonación menor 6 cilindros", 60],
      ["Entonación mayor 6 cilindros", 120],
      ["Entonación menor 8 cilindros", 80],
      ["Entonación mayor 8 cilindros", 140],
    ],
  ],
  [
    "Escáner",
    [
      ["Escáner original", 30],
      ["Escáner Ford Scan", 20],
      ["Escáner básico", 15],
      ["Escáner HP Tuners", 80, "from"],
    ],
  ],
  [
    "Empacaduras de cámara",
    [
      ["Empacadura de cámara 4 cilindros", 120],
      ["Empacadura de cámara 6 cilindros", 250],
      ["Empacadura de cámara 8 cilindros", 300],
    ],
  ],
  [
    "Tren delantero",
    [
      ["Tren delantero · carros pequeños", 40],
      ["Tren delantero · carros medianos", 50],
      ["Tren delantero · camionetas", 70],
      ["Tren delantero · camiones", 90],
    ],
  ],
  [
    "Resellados",
    [
      ["Resellado 4 cilindros", 200],
      ["Resellado 6 cilindros", 400],
      ["Resellado 8 cilindros", 600],
    ],
  ],
  [
    "Aire acondicionado",
    [
      ["Aire acondicionado · carga de gas", 20],
      ["Aire acondicionado · mantenimiento", 60],
      ["Aire acondicionado completo", 250],
    ],
  ],
  [
    "Problemas eléctricos",
    [
      ["Ramales 4 cilindros", 100],
      ["Ramales 6 cilindros", 150],
      ["Ramales 8 cilindros", 250],
    ],
  ],
  [
    "Kits de tiempo",
    [
      ["Kit de tiempo 4 cilindros de correa", 60],
      ["Kit de tiempo 4 cilindros de cadena", 150, "range", 200],
      ["Kit de tiempo 6 cilindros de correa", 150],
      ["Kit de tiempo 6 cilindros de cadena", 450],
      ["Kit de tiempo 8 cilindros", 300],
    ],
  ],
  [
    "Croché",
    [
      ["Croché 4 cilindros", 120],
      ["Croché 6 cilindros 4x2", 180],
      ["Croché 6 cilindros 4x4", 200],
      ["Croché 8 cilindros 4x2", 200],
      ["Croché 8 cilindros 4x4", 230],
    ],
  ],
  [
    "Diagnóstico",
    [
      ["Diagnóstico básico", 30],
      ["Diagnóstico completo", 60],
    ],
  ],
];
export function realServices() {
  return groups
    .flatMap(([category, items]) =>
      items.map(([name, price, priceMode = "fixed", priceMax]) => ({
        name,
        price,
        priceMode,
        priceMax,
        category,
      })),
    )
    .map((s, i) => ({
      ...s,
      id: `ft-service-${i + 1}`,
      code: `FT-${String(i + 1).padStart(3, "0")}`,
      active: true,
      description:
        s.priceMode === "from"
          ? "Precio a partir del monto indicado; confirmar alcance del trabajo."
          : s.priceMode === "range"
            ? "Precio entre $150 y $200 según el vehículo; confirmar antes de completar."
            : "Precio de trabajo suministrado por FORDTECH.",
    }));
}

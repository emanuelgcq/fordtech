import { snapshot, totals } from "../utils/domain.js";
// Historial ficticio: varias estancias independientes por cliente y vehículo.
const cases = [
  [
    "v1",
    "2026-07-12",
    24500,
    "Motor irregular en ralentí.",
    "Entonación menor 4 cilindros",
    [["Bujías", 4]],
    "Encendido revisado y bujías sustituidas.",
    "Revisar el encendido en el próximo mantenimiento.",
  ],
  [
    "v1",
    "2026-08-22",
    28200,
    "Revisión de niveles y mantenimiento.",
    "Escáner original",
    [
      ["Aceite de motor 5W-30", 4],
      ["Filtro de aceite", 1],
    ],
    "Aceite y filtro sustituidos; sin códigos de falla.",
    "Próximo cambio de aceite a los 33.200 km.",
  ],
  [
    "v1",
    "2026-09-18",
    31500,
    "El aire acondicionado enfría poco.",
    "Aire acondicionado · mantenimiento",
    [["Refrigerante", 1]],
    "Sistema revisado, mantenimiento realizado y niveles verificados.",
    "Comprobar temperatura y niveles semanalmente.",
  ],
  [
    "v9",
    "2026-09-03",
    63000,
    "Revisión preventiva antes de un viaje.",
    "Diagnóstico básico",
    [],
    "Inspección completada; funcionamiento general correcto.",
    "Revisar presión de neumáticos antes del viaje.",
  ],
  [
    "v2",
    "2026-07-09",
    26000,
    "Reparación de motor solicitada.",
    "Motor 6 cilindros Explorer",
    [["Refrigerante", 2]],
    "Trabajo de motor completado y prueba de ruta satisfactoria.",
    "Control de niveles y revisión posterior a 1.000 km.",
  ],
  [
    "v2",
    "2026-08-13",
    31000,
    "Testigo de motor encendido.",
    "Diagnóstico completo",
    [],
    "Sistema evaluado; conexiones revisadas y prueba satisfactoria.",
    "Regresar si el testigo vuelve a encenderse.",
  ],
  [
    "v2",
    "2026-09-25",
    35500,
    "Ruido en el sistema de distribución.",
    "Kit de tiempo 6 cilindros de cadena",
    [["Refrigerante", 1]],
    "Kit de tiempo atendido y sincronización comprobada.",
    "Verificar niveles y ruidos en la próxima revisión.",
  ],
  [
    "v10",
    "2026-08-04",
    65500,
    "Revisión del aire acondicionado.",
    "Aire acondicionado · carga de gas",
    [],
    "Carga de gas realizada y temperatura de salida comprobada.",
    "Mantener limpio el filtro de habitáculo.",
  ],
  [
    "v5",
    "2026-06-20",
    37000,
    "Mantenimiento del sistema de encendido.",
    "Entonación menor 8 cilindros",
    [["Bujías", 8]],
    "Entonación realizada y respuesta del motor comprobada.",
    "Próxima revisión de encendido en 10.000 km.",
  ],
  [
    "v5",
    "2026-08-10",
    42500,
    "Golpes en la suspensión delantera.",
    "Tren delantero · camionetas",
    [["Amortiguador delantero", 2]],
    "Tren delantero revisado; amortiguadores sustituidos.",
    "Realizar control de alineación y desgaste de neumáticos.",
  ],
  [
    "v5",
    "2026-09-22",
    48000,
    "Falla intermitente de señal eléctrica.",
    "Ramales 8 cilindros",
    [["Sensor de oxígeno", 1]],
    "Ramales revisados y sensor sustituido; prueba de ruta correcta.",
    "Evitar humedad en conectores y revisar si reaparece la falla.",
  ],
  [
    "v3",
    "2026-07-03",
    35200,
    "Motor con respuesta irregular.",
    "Entonación menor 4 cilindros",
    [["Bujías", 4]],
    "Entonación completada y encendido comprobado.",
    "Revisar nuevamente en el siguiente mantenimiento.",
  ],
  [
    "v3",
    "2026-08-19",
    37400,
    "Consulta por consumo de combustible.",
    "Diagnóstico básico",
    [],
    "Diagnóstico realizado y recomendaciones explicadas al cliente.",
    "Controlar consumo durante la siguiente semana.",
  ],
  [
    "v3",
    "2026-09-15",
    39900,
    "Reposición de batería del vehículo.",
    null,
    [["Batería 12V", 1]],
    "Batería entregada y recepción confirmada por el propietario.",
    "Revisar bornes y sistema de carga periódicamente.",
  ],
  [
    "v7",
    "2026-07-30",
    52000,
    "Aire acondicionado con bajo rendimiento.",
    "Aire acondicionado · carga de gas",
    [],
    "Carga de gas completada y funcionamiento verificado.",
    "Consultar si disminuye nuevamente el rendimiento.",
  ],
  [
    "v7",
    "2026-09-06",
    54800,
    "Mantenimiento del sistema de distribución.",
    "Kit de tiempo 4 cilindros de cadena",
    [],
    "Trabajo realizado y sincronización comprobada.",
    "Realizar revisión de control en el siguiente mantenimiento.",
  ],
  [
    "v7",
    "2026-09-28",
    56500,
    "Revisión de motor y filtro de admisión.",
    "Diagnóstico completo",
    [["Filtro de aire", 1]],
    "Diagnóstico finalizado y filtro sustituido.",
    "Revisar el filtro con mayor frecuencia en zonas de polvo.",
  ],
  [
    "v6",
    "2026-09-05",
    51600,
    "Mantenimiento programado de encendido.",
    "Entonación mayor 4 cilindros",
    [["Bujías", 4]],
    "Entonación mayor completada y vehículo probado.",
    "Programar una revisión preventiva en 10.000 km.",
  ],
];
export function addHistorySeed(db) {
  const quotes = [...db.quotes],
    visits = [...db.visits],
    deliveries = [...db.deliveries];
  const products = db.products.map((p) => ({ ...p }));
  cases.forEach(
    (
      [
        vehicleId,
        date,
        mileage,
        reason,
        serviceName,
        items,
        observations,
        recommendations,
      ],
      i,
    ) => {
      const vehicle = db.vehicles.find((v) => v.id === vehicleId),
        client = db.clients.find((c) => c.id === vehicle.clientId);
      const service = serviceName
        ? db.services.find((s) => s.name === serviceName)
        : null;
      if (serviceName && !service)
        throw Error(`Servicio de demostración no encontrado: ${serviceName}`);
      const lines = [
        ...(service
          ? [
              {
                type: "service",
                itemId: service.id,
                name: service.name,
                quantity: 1,
                price: service.priceMode === "range" ? 180 : service.price,
              },
            ]
          : []),
        ...items.map(([name, quantity]) => {
          const p = products.find((p) => p.name === name);
          if (!p)
            throw Error(`Producto de demostración no encontrado: ${name}`);
          if (p.stock < quantity)
            throw Error(`Stock insuficiente en seed: ${name}`);
          p.stock -= quantity;
          return {
            type: "product",
            itemId: p.id,
            name: p.name,
            quantity,
            price: p.price,
          };
        }),
      ];
      const q = {
        id: `history-q${i + 1}`,
        number: `PRE-${String(quotes.length + 1).padStart(4, "0")}`,
        clientId: client.id,
        vehicleId,
        userId: "u2",
        author: "Luis Martínez",
        date,
        expiry: date,
        mileage,
        diagnosis: observations,
        status: "Completado",
        inventoryApplied: true,
        discount: i === 1 ? 5 : i === 9 ? 10 : 0,
        tax: 0,
        lines,
        ...snapshot(client, { ...vehicle, mileage }),
      };
      const deliveryDate = date;
      const note = {
        id: `history-n${i + 1}`,
        number: `NE-${String(deliveries.length + 1).padStart(4, "0")}`,
        quoteId: q.id,
        quoteNumber: q.number,
        relatedQuoteNumbers: [q.number],
        clientId: client.id,
        vehicleId,
        date,
        deliveryDate,
        mileage: mileage + 5,
        lines: lines.map((l) => ({ ...l })),
        client: { ...q.client },
        vehicle: { ...q.vehicle },
        discount: q.discount,
        tax: q.tax,
        amounts: totals(q),
        status: "Entregado",
        observations,
        recommendations,
        condition:
          "Vehículo revisado y entregado en las condiciones acordadas.",
        responsible: "Luis Martínez",
        receiver: client.name,
      };
      quotes.push(q);
      deliveries.push(note);
      visits.push({
        id: `history-visit${i + 1}`,
        number: `ING-${String(visits.length + 1).padStart(4, "0")}`,
        quoteId: q.id,
        clientId: client.id,
        vehicleId,
        date,
        mileage,
        reason,
        diagnosis: observations,
        recommendations,
        condition: "Recepción revisada con el propietario.",
        responsible: "Luis Martínez",
        status: "Entregado",
        exitDate: deliveryDate,
        exitMileage: mileage + 5,
      });
    },
  );
  return { ...db, quotes, visits, deliveries, products, demoHistoryVersion: 1 };
}

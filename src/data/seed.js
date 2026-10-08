import { realServices } from "./catalog.js";
import { snapshot } from "../utils/domain.js";
export function seed() {
  const clients = [
    "María González",
    "Carlos Mendoza",
    "Ana Rodríguez",
    "José Fernández",
    "Luisa Pérez",
    "Daniel Romero",
    "Patricia Torres",
    "Andrés Castillo",
  ].map((name, i) => ({
    id: `c${i + 1}`,
    name,
    document: `V-${18000321 + i * 2371}`,
    phone: `0412${5501000 + i}`,
    whatsapp: `58412${5501000 + i}`,
    email: `cliente${i + 1}@example.com`,
    address: [
      "Valencia, Carabobo",
      "San Diego, Carabobo",
      "Naguanagua, Carabobo",
    ][i % 3],
    date: `2026-09-${String(i + 10).padStart(2, "0")}`,
    notes: "Cliente de demostración · datos ficticios",
    active: true,
  }));
  const models = [
    ["Ford", "Fiesta"],
    ["Ford", "Explorer"],
    ["Toyota", "Corolla"],
    ["Chevrolet", "Aveo"],
    ["Ford", "F-150"],
    ["Hyundai", "Accent"],
    ["Ford", "Focus"],
    ["Toyota", "Hilux"],
    ["Ford", "EcoSport"],
    ["Chevrolet", "Cruze"],
    ["Ford", "Escape"],
    ["Kia", "Rio"],
  ];
  const vehicles = models.map(([brand, model], i) => ({
    id: `v${i + 1}`,
    clientId: `c${(i % 8) + 1}`,
    brand,
    model,
    year: 2015 + (i % 9),
    plate: `AB${120 + i}CD`,
    vin: `DEMOCHASIS0000${String(i + 1).padStart(4, "0")}`,
    color: ["Blanco", "Azul", "Gris"][i % 3],
    mileage: 32000 + i * 4200,
    fuel: "Gasolina",
    notes: "Vehículo de demostración",
    active: true,
  }));
  const services = realServices();
  const products = [
    "Aceite de motor 5W-30",
    "Filtro de aceite",
    "Filtro de aire",
    "Pastillas de freno",
    "Batería 12V",
    "Bujías",
    "Refrigerante",
    "Correa de accesorios",
    "Amortiguador delantero",
    "Disco de freno",
    "Líquido de frenos",
    "Filtro de combustible",
    "Limpiaparabrisas",
    "Termostato",
    "Sensor de oxígeno",
  ].map((name, i) => ({
    id: `p${i + 1}`,
    code: `REP-${String(i + 1).padStart(3, "0")}`,
    name,
    category: ["Lubricantes", "Filtros", "Repuestos"][i % 3],
    brand: ["Motorcraft", "Bosch", "ACDelco"][i % 3],
    description: name,
    price: [12, 8, 15, 45, 110, 8, 18, 32, 65, 48, 10, 16, 14, 25, 55][i],
    stock: 20 + i * 2,
    active: true,
  }));
  const users = [
    {
      id: "u1",
      name: "Administrador",
      email: "admin@fordtech.com",
      password: "admin123",
      role: "Administrador",
      active: true,
    },
    {
      id: "u2",
      name: "Luis Martínez",
      email: "empleado@fordtech.com",
      password: "empleado123",
      role: "Empleado",
      active: true,
    },
  ];
  const quotes = Array.from({ length: 8 }, (_, i) => {
    const v = vehicles[i];
    return {
      id: `q${i + 1}`,
      number: `PRE-${String(i + 1).padStart(4, "0")}`,
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      expiry: "2026-11-08",
      clientId: v.clientId,
      vehicleId: v.id,
      userId: i % 2 ? "u2" : "u1",
      author: users[i % 2].name,
      mileage: v.mileage,
      diagnosis: [
        "Mantenimiento programado. Revisar niveles y filtros.",
        "Inspección preventiva del sistema de frenos.",
      ][i % 2],
      status: [
        "Completado",
        "Aprobado",
        "Enviado",
        "Borrador",
        "Completado",
        "Rechazado",
        "Aprobado",
        "Enviado",
      ][i],
      discount: 0,
      tax: 0,
      lines: [
        {
          type: "service",
          itemId: services[i].id,
          name: services[i].name,
          quantity: 1,
          price: services[i].price,
        },
        {
          type: "product",
          itemId: products[i].id,
          name: products[i].name,
          quantity: i === 0 ? 4 : 1,
          price: products[i].price,
        },
      ],
      inventoryApplied: i === 0 || i === 4,
      ...snapshot(
        clients.find((c) => c.id === v.clientId),
        v,
      ),
    };
  });
  quotes
    .filter((q) => q.inventoryApplied)
    .forEach((q) =>
      q.lines
        .filter((l) => l.type === "product")
        .forEach(
          (l) => (products.find((p) => p.id === l.itemId).stock -= l.quantity),
        ),
    );
  const deliveries = [quotes[0], quotes[1]].map((q, i) => ({
    id: `n${i + 1}`,
    number: `NE-000${i + 1}`,
    date: q.date,
    deliveryDate: q.date,
    quoteId: q.id,
    quoteNumber: q.number,
    clientId: q.clientId,
    vehicleId: q.vehicleId,
    client: { ...q.client },
    vehicle: { ...q.vehicle },
    lines: q.lines.map((l) => ({ ...l })),
    discount: q.discount,
    tax: q.tax,
    mileage: q.mileage + 5,
    observations: "Trabajo revisado y prueba de funcionamiento realizada.",
    recommendations:
      "Revisar niveles semanalmente y realizar mantenimiento en 5.000 km.",
    condition:
      "Carrocería y habitáculo en condiciones acordadas; niveles verificados.",
    responsible: "Luis Martínez",
    receiver: q.client.name,
    status: i ? "Pendiente" : "Entregado",
  }));
  const visits = [quotes[1], quotes[2], quotes[4], quotes[6]].map((q, i) => ({
    id: `visit${i + 1}`,
    number: `ING-000${i + 1}`,
    quoteId: q.id,
    clientId: q.clientId,
    vehicleId: q.vehicleId,
    date: q.date,
    mileage: q.mileage,
    reason: q.diagnosis,
    diagnosis: q.diagnosis,
    condition:
      "Recepción: carrocería revisada, sin daños adicionales reportados.",
    recommendations: "",
    responsible: "Luis Martínez",
    status: "En el taller",
  }));
  return {
    schemaVersion: 2,
    receiptVersion: 1,
    visits,
    clients,
    vehicles,
    services,
    products,
    users,
    quotes,
    deliveries,
  };
}

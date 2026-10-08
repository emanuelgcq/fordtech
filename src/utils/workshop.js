import {
  uid,
  today,
  nextNumber,
  snapshot,
  saveQuote,
  saveDelivery,
} from "./domain.js";
import { realServices } from "../data/catalog.js";
export function migrate(db) {
  if (db.schemaVersion === 2 && db.receiptVersion === 1) return db;
  const deliveries = db.deliveries.map((n) => {
    const quote = db.quotes.find((q) => q.id === n.quoteId);
    return {
      ...n,
      discount: n.discount ?? Number(quote?.discount || 0),
      tax: n.tax ?? Number(quote?.tax || 0),
    };
  });
  if (db.schemaVersion === 2) return { ...db, receiptVersion: 1, deliveries };
  const legacyIds = new Set(Array.from({ length: 10 }, (_, i) => `s${i + 1}`));
  return {
    ...db,
    schemaVersion: 2,
    receiptVersion: 1,
    deliveries,
    visits: db.visits || [],
    services: [
      ...db.services.filter((s) => !legacyIds.has(s.id)),
      ...realServices(),
    ],
  };
}
export function admit(db, input, user) {
  const c = db.clients.find((c) => c.id === input.clientId && c.active);
  const v = db.vehicles.find((v) => v.id === input.vehicleId && v.active);
  if (!c || !v || v.clientId !== c.id)
    throw Error("Selecciona un cliente activo y uno de sus vehículos.");
  if (
    (db.visits || []).some(
      (x) => x.vehicleId === v.id && x.status === "En el taller",
    )
  )
    throw Error("Este vehículo ya tiene un ingreso activo.");
  if (
    !input.reason?.trim() ||
    !input.date ||
    !Number.isFinite(Number(input.mileage)) ||
    input.mileage === "" ||
    Number(input.mileage) < Number(v.mileage)
  )
    throw Error(
      "Completa el motivo y la fecha. El kilometraje no debe ser menor al registrado.",
    );
  const visit = {
    ...input,
    id: input.id || uid(),
    number: nextNumber(db.visits || [], "ING"),
    status: "En el taller",
    responsible: user.name,
    clientId: c.id,
    vehicleId: v.id,
  };
  let quote;
  if (input.quoteId) {
    quote = db.quotes.find((q) => q.id === input.quoteId);
    if (
      !quote ||
      quote.vehicleId !== v.id ||
      quote.clientId !== c.id ||
      quote.status === "Rechazado" ||
      (db.visits || []).some((x) => x.quoteId === quote.id) ||
      db.deliveries.some(
        (n) => n.quoteId === quote.id && n.status === "Entregado",
      )
    )
      throw Error("Ese presupuesto no está disponible para este ingreso.");
  } else {
    quote = {
      id: uid(),
      number: nextNumber(db.quotes, "PRE"),
      date: input.date,
      expiry: input.date,
      clientId: c.id,
      vehicleId: v.id,
      userId: user.id,
      author: user.name,
      mileage: Number(input.mileage),
      diagnosis: input.reason,
      status: "Borrador",
      lines: [],
      discount: 0,
      tax: 0,
      inventoryApplied: false,
      ...snapshot(c, v),
    };
  }
  visit.quoteId = quote.id;
  return {
    ...db,
    quotes: input.quoteId ? db.quotes : [...db.quotes, quote],
    visits: [...(db.visits || []), visit],
    vehicles: db.vehicles.map((x) =>
      x.id === v.id ? { ...x, mileage: Number(input.mileage) } : x,
    ),
  };
}
export function saveVisit(db, input, quote) {
  const old = db.visits.find((v) => v.id === input.id);
  if (!old || old.status !== "En el taller")
    throw Error("El ingreso está cerrado o no existe.");
  if (
    !input.reason?.trim() ||
    !input.date ||
    !Number.isFinite(Number(input.mileage)) ||
    Number(input.mileage) < 0
  )
    throw Error("Revisa los datos de ingreso.");
  if (
    quote.id !== old.quoteId ||
    quote.vehicleId !== old.vehicleId ||
    quote.clientId !== old.clientId
  )
    throw Error("El documento no corresponde al ingreso.");
  let next = db;
  if (
    !db.quotes.find((q) => q.id === quote.id)?.inventoryApplied &&
    !db.deliveries.some(
      (n) => n.quoteId === quote.id && n.status === "Entregado",
    )
  ) {
    if (!quote.lines.length)
      throw Error("Agrega al menos un servicio o repuesto.");
    next = saveQuote(db, { ...quote, mileage: Number(input.mileage) });
  }
  return {
    ...next,
    vehicles: next.vehicles.map((v) =>
      v.id === old.vehicleId
        ? { ...v, mileage: Math.max(Number(v.mileage), Number(input.mileage)) }
        : v,
    ),
    visits: next.visits.map((v) =>
      v.id === old.id
        ? {
            ...old,
            date: input.date,
            reason: input.reason,
            diagnosis: input.diagnosis,
            condition: input.condition,
            recommendations: input.recommendations,
            mileage: Number(input.mileage),
          }
        : v,
    ),
  };
}
export function closeVisit(db, visitId, input) {
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit || visit.status !== "En el taller")
    throw Error("Este ingreso ya fue cerrado.");
  if (!input.deliveryDate || input.deliveryDate < visit.date)
    throw Error("La fecha de entrega no puede ser anterior al ingreso.");
  let q = db.quotes.find((q) => q.id === visit.quoteId);
  if (Number(input.mileage) < Number(visit.mileage))
    throw Error("El kilometraje de entrega no puede ser menor al de ingreso.");
  if (!q?.lines.length)
    throw Error("Registra los servicios o repuestos antes de entregar.");
  if (!q.inventoryApplied) {
    if (
      db.deliveries.some(
        (n) =>
          n.quoteId === q.id &&
          JSON.stringify(n.lines) !== JSON.stringify(q.lines),
      )
    )
      throw Error(
        "La nota pendiente no coincide con el detalle actual. Revisa el presupuesto antes de entregar.",
      );
    db = saveQuote(db, { ...q, status: "Completado" });
    q = db.quotes.find((x) => x.id === q.id);
  }
  const existing = db.deliveries.find((n) => n.quoteId === q.id);
  db = saveDelivery(db, {
    ...input,
    id: existing?.id || input.id || uid(),
    quoteId: q.id,
    date: existing?.date || today(),
    status: "Entregado",
  });
  return {
    ...db,
    visits: db.visits.map((v) =>
      v.id === visit.id
        ? {
            ...v,
            status: "Entregado",
            exitDate: input.deliveryDate,
            exitMileage: Number(input.mileage),
          }
        : v,
    ),
    vehicles: db.vehicles.map((v) =>
      v.id === visit.vehicleId
        ? { ...v, mileage: Math.max(Number(v.mileage), Number(input.mileage)) }
        : v,
    ),
  };
}

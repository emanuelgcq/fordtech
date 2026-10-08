export const uid = () => crypto.randomUUID();
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const money = (n) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "USD" }).format(
    Number(n) || 0,
  );
export const statuses = [
  "Borrador",
  "Enviado",
  "Aprobado",
  "Rechazado",
  "Completado",
];
export function totals(q) {
  const subtotal = q.lines.reduce(
    (a, l) => a + Number(l.quantity) * Number(l.price),
    0,
  );
  const discount = Math.min(subtotal, Math.max(0, Number(q.discount) || 0));
  const tax = ((subtotal - discount) * (Number(q.tax) || 0)) / 100;
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}
export function nextNumber(rows, prefix) {
  return `${prefix}-${String(Math.max(0, ...rows.map((r) => Number(r.number.split("-").at(-1)) || 0)) + 1).padStart(4, "0")}`;
}
export function snapshot(client, vehicle) {
  return { client: { ...client }, vehicle: { ...vehicle } };
}
export function validateQuote(db, q) {
  const c = db.clients.find((c) => c.id === q.clientId);
  const v = db.vehicles.find((v) => v.id === q.vehicleId);
  if (!c || !v || v.clientId !== c.id)
    throw Error("Selecciona un cliente y uno de sus vehículos.");
  if (!q.lines.length) throw Error("Agrega al menos un producto o servicio.");
  if (
    q.lines.some(
      (l) =>
        !Number.isFinite(Number(l.quantity)) ||
        Number(l.quantity) <= 0 ||
        !Number.isFinite(Number(l.price)) ||
        Number(l.price) < 0,
    )
  )
    throw Error(
      "Las cantidades deben ser mayores que cero y los precios no negativos.",
    );
  if (
    Number(q.discount) < 0 ||
    Number(q.discount) > totals({ ...q, discount: 0 }).subtotal ||
    Number(q.tax) < 0 ||
    Number(q.tax) > 100
  )
    throw Error("Revisa el descuento y el impuesto (0–100%).");
  if (!statuses.includes(q.status))
    throw Error("Estado de presupuesto inválido.");
  if (!q.date || !q.expiry || q.expiry < q.date)
    throw Error("Revisa las fechas del presupuesto.");
  if (!Number.isFinite(Number(q.mileage)) || Number(q.mileage) < 0)
    throw Error("El kilometraje no puede ser negativo.");
  return { c, v };
}
export function saveQuote(db, input) {
  const old = db.quotes.find((q) => q.id === input.id);
  if (old?.inventoryApplied)
    throw Error("Un trabajo completado conserva su detalle histórico.");
  if (
    db.deliveries.some(
      (n) => n.quoteId === input.id && n.status === "Entregado",
    ) &&
    old &&
    (JSON.stringify(input.lines) !== JSON.stringify(old.lines) ||
      Number(input.discount) !== Number(old.discount) ||
      Number(input.tax) !== Number(old.tax))
  )
    throw Error(
      "El detalle tiene una nota de entrega vinculada y está protegido.",
    );
  if (
    (db.visits || []).some(
      (v) =>
        v.quoteId === input.id &&
        (v.clientId !== input.clientId || v.vehicleId !== input.vehicleId),
    )
  )
    throw Error(
      "No puedes cambiar el cliente o vehículo de un presupuesto vinculado a un ingreso.",
    );
  const { c, v } = validateQuote(db, input);
  const q = {
    ...input,
    id: input.id || uid(),
    number: old?.number || nextNumber(db.quotes, "PRE"),
    ...snapshot(c, v),
    inventoryApplied: false,
  };
  let products = db.products;
  if (q.status === "Completado") {
    const used = new Map();
    q.lines
      .filter((l) => l.type === "product")
      .forEach((l) =>
        used.set(l.itemId, (used.get(l.itemId) || 0) + Number(l.quantity)),
      );
    for (const [id, qty] of used) {
      const p = products.find((p) => p.id === id);
      if (!p || Number(p.stock) < qty)
        throw Error(
          `Existencias insuficientes: ${p?.name || "producto eliminado"}.`,
        );
    }
    products = products.map((p) => ({
      ...p,
      stock: Number(p.stock) - (used.get(p.id) || 0),
    }));
    q.inventoryApplied = true;
  }
  return {
    ...db,
    products,
    deliveries: db.deliveries.map((n) =>
      n.quoteId === q.id && n.status === "Pendiente"
        ? {
            ...n,
            lines: q.lines.map((l) => ({ ...l })),
            discount: Number(q.discount || 0),
            tax: Number(q.tax || 0),
            client: { ...q.client },
            vehicle: { ...q.vehicle },
          }
        : n,
    ),
    quotes: old
      ? db.quotes.map((x) => (x.id === q.id ? q : x))
      : [...db.quotes, q],
  };
}
export function saveDelivery(db, input) {
  const q = db.quotes.find((q) => q.id === input.quoteId);
  if (!q || !["Aprobado", "Completado"].includes(q.status))
    throw Error("Selecciona un presupuesto aprobado o completado.");
  if (
    input.status === "Entregado" &&
    (db.visits || []).some(
      (v) => v.quoteId === q.id && v.status === "En el taller",
    ) &&
    !q.inventoryApplied
  )
    throw Error(
      "Finaliza el trabajo desde Taller para completar el presupuesto y descontar los repuestos.",
    );
  const old = db.deliveries.find((n) => n.id === input.id);
  if (old?.status === "Entregado")
    throw Error("Una nota entregada conserva su documento.");
  if (db.deliveries.some((n) => n.quoteId === q.id && n.id !== input.id))
    throw Error("Este presupuesto ya tiene una nota de entrega.");
  if (
    !input.receiver?.trim() ||
    !input.responsible?.trim() ||
    !input.deliveryDate
  )
    throw Error("Completa responsable, receptor y fecha de entrega.");
  if (!["Pendiente", "Entregado"].includes(input.status))
    throw Error("Estado de nota inválido.");
  if (!input.date || input.deliveryDate < input.date)
    throw Error("La fecha de entrega debe ser igual o posterior a la emisión.");
  if (
    !Number.isFinite(Number(input.mileage)) ||
    Number(input.mileage) < 0 ||
    input.mileage === ""
  )
    throw Error("Introduce un kilometraje válido.");
  if (
    (db.visits || []).some(
      (v) => v.quoteId === q.id && Number(input.mileage) < Number(v.mileage),
    )
  )
    throw Error("El kilometraje de entrega no puede ser menor al de ingreso.");
  const n = {
    ...input,
    id: old?.id || input.id || uid(),
    number: old?.number || nextNumber(db.deliveries, "NE"),
    clientId: q.clientId,
    vehicleId: q.vehicleId,
    quoteNumber: q.number,
    client: old?.client || { ...q.client },
    vehicle: old?.vehicle || { ...q.vehicle },
    lines: old?.lines || q.lines.map((l) => ({ ...l })),
    discount: old?.discount ?? Number(q.discount || 0),
    tax: old?.tax ?? Number(q.tax || 0),
  };
  return {
    ...db,
    deliveries: old
      ? db.deliveries.map((x) => (x.id === n.id ? n : x))
      : [...db.deliveries, n],
    ...(db.visits
      ? {
          vehicles:
            n.status === "Entregado"
              ? db.vehicles.map((v) =>
                  v.id === q.vehicleId
                    ? {
                        ...v,
                        mileage: Math.max(Number(v.mileage), Number(n.mileage)),
                      }
                    : v,
                )
              : db.vehicles,
          visits: db.visits.map((v) =>
            v.quoteId === q.id && n.status === "Entregado"
              ? {
                  ...v,
                  status: "Entregado",
                  exitDate: n.deliveryDate,
                  exitMileage: Number(n.mileage),
                }
              : v,
          ),
        }
      : {}),
  };
}
export function removeRecord(db, type, id) {
  let referenced = false;
  if (type === "clients")
    referenced =
      (db.visits || []).some((v) => v.clientId === id) ||
      db.vehicles.some((v) => v.clientId === id) ||
      db.quotes.some((q) => q.clientId === id) ||
      db.deliveries.some((n) => n.clientId === id);
  if (type === "vehicles")
    referenced =
      (db.visits || []).some((v) => v.vehicleId === id) ||
      db.quotes.some((q) => q.vehicleId === id) ||
      db.deliveries.some((n) => n.vehicleId === id);
  if (["products", "services"].includes(type))
    referenced = db.quotes.some((q) => q.lines.some((l) => l.itemId === id));
  if (type === "users") referenced = db.quotes.some((q) => q.userId === id);
  if (referenced)
    throw Error(
      "Este registro tiene relaciones o historial. Desactívalo en lugar de eliminarlo.",
    );
  return { ...db, [type]: db[type].filter((r) => r.id !== id) };
}

import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "../data/seed.js";
import {
  saveQuote,
  saveDelivery,
  totals,
  removeRecord,
  nextNumber,
} from "./domain.js";
test("Los datos iniciales y sus relaciones están completos", () => {
  const d = seed();
  assert.deepEqual(
    ["clients", "vehicles", "services", "products", "quotes", "users"].map(
      (k) => d[k].length,
    ),
    [8, 12, 44, 15, 8, 2],
  );
  assert.equal(d.deliveries.length, 2);
  for (const q of d.quotes) {
    assert.equal(
      d.vehicles.find((v) => v.id === q.vehicleId).clientId,
      q.clientId,
    );
    assert.ok(q.lines.length);
  }
});
test("Cálculos independientes: subtotal, descuento e impuesto", () =>
  assert.deepEqual(
    totals({
      lines: [
        { quantity: 2, price: 25 },
        { quantity: 1, price: 10 },
      ],
      discount: 5,
      tax: 16,
    }),
    { subtotal: 60, discount: 5, tax: 8.8, total: 63.8 },
  ));
test("Crear y aprobar no descuenta inventario; completar descuenta una sola vez", () => {
  const d = seed(),
    q = {
      ...d.quotes[2],
      id: "new",
      status: "Borrador",
      lines: [
        {
          type: "product",
          itemId: "p1",
          name: "Aceite",
          price: 12,
          quantity: 3,
        },
        {
          type: "product",
          itemId: "p1",
          name: "Aceite",
          price: 12,
          quantity: 2,
        },
      ],
    };
  const a = saveQuote(d, q);
  assert.equal(a.products[0].stock, d.products[0].stock);
  const b = saveQuote(a, { ...a.quotes.at(-1), status: "Aprobado" });
  assert.equal(b.products[0].stock, d.products[0].stock);
  const c = saveQuote(b, { ...b.quotes.at(-1), status: "Completado" });
  assert.equal(c.products[0].stock, d.products[0].stock - 5);
  assert.throws(
    () => saveQuote(c, { ...c.quotes.at(-1), status: "Aprobado" }),
    /histórico/,
  );
  assert.equal(d.products[0].stock, 16);
});
test("Stock insuficiente bloquea la operación sin mutar datos", () => {
  const d = seed();
  assert.throws(
    () =>
      saveQuote(d, {
        ...d.quotes[2],
        status: "Completado",
        lines: [{ type: "product", itemId: "p1", quantity: 999, price: 12 }],
      }),
    /insuficientes/,
  );
  assert.equal(d.quotes[2].status, "Enviado");
  assert.equal(d.products[0].stock, 16);
});
test("Cliente/vehículo, líneas, cantidades y fechas se validan", () => {
  const d = seed(),
    q = d.quotes[2];
  assert.throws(() => saveQuote(d, { ...q, clientId: "c8" }), /vehículo/);
  assert.throws(() => saveQuote(d, { ...q, lines: [] }), /al menos/);
  assert.throws(
    () => saveQuote(d, { ...q, lines: [{ ...q.lines[0], quantity: 0 }] }),
    /cantidades/,
  );
  assert.throws(() => saveQuote(d, { ...q, expiry: "2020-01-01" }), /fechas/);
});
test("Una nota copia el presupuesto sin generar ventas o inventario", () => {
  const d = { ...seed(), visits: [] };
  const q = d.quotes[6];
  const n = {
    id: "new-note",
    quoteId: q.id,
    date: "2026-10-08",
    deliveryDate: "2026-10-09",
    mileage: 58000,
    responsible: "Mecánico",
    receiver: q.client.name,
    status: "Pendiente",
  };
  const a = saveDelivery(d, n);
  const note = a.deliveries.at(-1);
  assert.equal(note.id, "new-note");
  assert.equal(note.number, "NE-0003");
  assert.deepEqual(note.lines, q.lines);
  assert.notEqual(note.lines, q.lines);
  assert.deepEqual(a.products, d.products);
  assert.deepEqual(a.quotes, d.quotes);
  assert.equal(saveDelivery(a, n).deliveries.length, a.deliveries.length);
  assert.throws(
    () => saveDelivery(a, { ...n, id: "different-id" }),
    /ya tiene/,
  );
  const b = saveDelivery(a, { ...note, status: "Entregado" });
  assert.deepEqual(b.products, d.products);
  assert.equal(b.deliveries.at(-1).status, "Entregado");
  assert.throws(
    () => saveDelivery(b, { ...note, status: "Pendiente" }),
    /conserva/,
  );
});
test("Notas solo para presupuestos aprobados/completados", () => {
  const d = seed();
  assert.throws(() => saveDelivery(d, { quoteId: "q3" }), /aprobado/);
});
test("El catálogo y su historial conservan precios y descripciones", () => {
  const d = seed();
  const name = d.quotes[0].lines[0].name;
  d.services[0].name = "Renombrado";
  d.services[0].price = 999;
  assert.equal(d.quotes[0].lines[0].name, name);
  assert.equal(d.quotes[0].lines[0].price, 450);
  d.quotes[0].lines[0].name = "Cambio posterior";
  assert.notEqual(d.deliveries[0].lines[0].name, "Cambio posterior");
});
test("No se eliminan registros con relaciones históricas", () => {
  const d = seed();
  assert.throws(() => removeRecord(d, "clients", "c1"), /historial/);
  assert.throws(() => removeRecord(d, "vehicles", "v1"), /historial/);
  assert.throws(
    () => removeRecord(d, "services", d.services[0].id),
    /historial/,
  );
  assert.equal(removeRecord(d, "products", "p15").products.length, 14);
});
test("Numeración secuencial sin colisiones", () =>
  assert.equal(
    nextNumber([{ number: "PRE-0002" }, { number: "PRE-0030" }], "PRE"),
    "PRE-0031",
  ));

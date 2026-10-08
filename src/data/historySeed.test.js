import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "./seed.js";
import { totals } from "../utils/domain.js";
test("Historial completo para seis clientes, ocho vehículos y dieciocho entregas adicionales", () => {
  const d = seed(),
    base = seed({ history: false });
  assert.equal(d.clients.length, 8);
  assert.equal(d.vehicles.length, 12);
  assert.equal(d.quotes.length, 26);
  assert.equal(d.visits.length, 22);
  assert.equal(d.deliveries.length, 20);
  const history = d.visits.filter((v) => v.id.startsWith("history-"));
  assert.equal(history.length, 18);
  assert.equal(new Set(history.map((v) => v.clientId)).size, 6);
  assert.equal(new Set(history.map((v) => v.vehicleId)).size, 8);
  assert.equal(d.visits.filter((v) => v.status === "En el taller").length, 4);
  for (const v of history) {
    const q = d.quotes.find((q) => q.id === v.quoteId),
      n = d.deliveries.find((n) => n.quoteId === q.id);
    assert.equal(v.status, "Entregado");
    assert.equal(q.status, "Completado");
    assert.equal(n.status, "Entregado");
    assert.deepEqual(n.lines, q.lines);
    assert.deepEqual(n.amounts, totals(q));
    assert.equal(
      d.vehicles.find((x) => x.id === v.vehicleId).clientId,
      v.clientId,
    );
    assert.ok(
      v.mileage <= d.vehicles.find((x) => x.id === v.vehicleId).mileage,
    );
  }
  for (const p of base.products) {
    const used = d.quotes
      .filter((q) => q.id.startsWith("history-"))
      .flatMap((q) => q.lines)
      .filter((l) => l.type === "product" && l.itemId === p.id)
      .reduce((a, l) => a + l.quantity, 0);
    assert.equal(d.products.find((x) => x.id === p.id).stock, p.stock - used);
    assert.ok(p.stock - used >= 0);
  }
  assert.ok(
    d.quotes.some(
      (q) =>
        q.id.startsWith("history-") &&
        q.lines.every((l) => l.type === "product"),
    ),
  );
  assert.ok(
    d.quotes.some(
      (q) =>
        q.id.startsWith("history-") &&
        q.lines.every((l) => l.type === "service"),
    ),
  );
  for (const key of ["quotes", "visits", "deliveries"]) {
    assert.equal(new Set(d[key].map((x) => x.id)).size, d[key].length);
    assert.equal(new Set(d[key].map((x) => x.number)).size, d[key].length);
  }
  assert.deepEqual(seed(), d);
});

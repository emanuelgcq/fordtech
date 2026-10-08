import test from "node:test";
import assert from "node:assert/strict";
import { seed as seedWithHistory } from "../data/seed.js";
const seed = () => seedWithHistory({ history: false });
import {
  admit,
  saveVisit,
  closeVisit,
  migrate,
  addAdditionalWork,
  issueDelivery,
} from "./workshop.js";
import { saveDelivery, saveQuote } from "./domain.js";
import { realServices } from "../data/catalog.js";
function newVisit() {
  const d = seed();
  return admit(
    d,
    {
      id: "stay-test",
      clientId: "c1",
      vehicleId: "v1",
      date: "2026-10-08",
      reason: "Perdida de potencia",
      mileage: 33000,
    },
    d.users[0],
  );
}
function withLines(d) {
  const v = d.visits.at(-1),
    q = d.quotes.find((q) => q.id === v.quoteId);
  return saveVisit(
    d,
    { ...v, diagnosis: "Revisar encendido" },
    {
      ...q,
      lines: [
        {
          type: "service",
          itemId: "ft-service-44",
          name: "Diagnóstico completo",
          quantity: 1,
          price: 60,
        },
        {
          type: "product",
          itemId: "p1",
          name: "Aceite",
          quantity: 2,
          price: 12,
        },
      ],
    },
  );
}
const delivery = {
  deliveryDate: "2026-10-08",
  mileage: 33005,
  receiver: "María González",
  responsible: "Luis Martínez",
  observations: "Prueba de ruta",
  condition: "Buen estado",
  recommendations: "Revisar en 5.000 km",
};
test("Catálogo completo: 44 trabajos, precios por categoría y excepciones", () => {
  const s = realServices();
  assert.equal(s.length, 44);
  assert.equal(
    s.find((x) => x.name === "Motor 6 cilindros Explorer").price,
    1000,
  );
  assert.equal(
    s.find((x) => x.name === "Entonación mayor 8 cilindros").price,
    140,
  );
  const hp = s.find((x) => x.name === "Escáner HP Tuners");
  assert.equal(hp.price, 80);
  assert.equal(hp.priceMode, "from");
  const chain = s.find((x) => x.name === "Kit de tiempo 4 cilindros de cadena");
  assert.equal(chain.price, 150);
  assert.equal(chain.priceMax, 200);
  assert.equal(s.at(-1).price, 60);
});
test("Migración reemplaza solo catálogo antiguo y conserva clientes, stock e historial", () => {
  const d = seed();
  delete d.schemaVersion;
  delete d.visits;
  d.services = [
    { id: "s1", name: "Servicio ficticio" },
    { id: "custom", name: "Trabajo propio", price: 99 },
  ];
  const q = structuredClone(d.quotes);
  const n = structuredClone(d.deliveries);
  const next = migrate(d);
  assert.equal(next.services.length, 45);
  assert.equal(next.services[0].id, "custom");
  assert.deepEqual(next.quotes, q);
  assert.deepEqual(next.deliveries, n);
  assert.deepEqual(next.products, d.products);
  assert.deepEqual(next.clients, d.clients);
  assert.deepEqual(next.visits, []);
  assert.equal(migrate(next), next);
});
test("Ingreso vincula propietario/vehículo y crea un único presupuesto sin descontar stock", () => {
  const d = seed(),
    n = newVisit();
  assert.equal(n.visits.at(-1).status, "En el taller");
  assert.equal(n.visits.at(-1).number, "ING-0005");
  assert.equal(n.quotes.at(-1).number, "PRE-0009");
  assert.deepEqual(n.quotes.at(-1).lines, []);
  assert.deepEqual(n.products, d.products);
  assert.equal(n.vehicles[0].mileage, 33000);
  assert.throws(
    () =>
      admit(
        n,
        {
          clientId: "c1",
          vehicleId: "v1",
          date: "2026-10-08",
          reason: "Duplicado",
          mileage: 33000,
        },
        n.users[0],
      ),
    /ya tiene/,
  );
  assert.throws(
    () => admit(d, { clientId: "c2", vehicleId: "v1" }, d.users[0]),
    /vehículos/,
  );
});
test("Añadir trabajos mantiene inventario y catálogo; entrega cierra y descuenta una sola vez", () => {
  const base = newVisit(),
    d = withLines(base);
  assert.equal(d.products[0].stock, 16);
  assert.equal(d.quotes.at(-1).lines.length, 2);
  const result = closeVisit(d, "stay-test", delivery);
  assert.equal(result.visits.at(-1).status, "Entregado");
  assert.equal(result.products[0].stock, 14);
  assert.equal(result.quotes.at(-1).status, "Completado");
  assert.equal(result.quotes.at(-1).inventoryApplied, true);
  assert.equal(result.deliveries.at(-1).status, "Entregado");
  assert.deepEqual(result.deliveries.at(-1).lines, result.quotes.at(-1).lines);
  assert.equal(result.vehicles[0].mileage, 33005);
  assert.throws(() => closeVisit(result, "stay-test", delivery), /cerrado/);
  assert.throws(
    () => saveVisit(result, result.visits.at(-1), result.quotes.at(-1)),
    /cerrado/,
  );
});
test("Fallo de entrega o stock revierte toda la transacción", () => {
  const d = withLines(newVisit());
  assert.throws(
    () => closeVisit(d, "stay-test", { ...delivery, receiver: "" }),
    /Completa/,
  );
  assert.equal(d.quotes.at(-1).status, "Borrador");
  assert.equal(d.products[0].stock, 16);
  assert.equal(d.deliveries.length, 2);
  assert.equal(d.visits.at(-1).status, "En el taller");
  const q = d.quotes.at(-1);
  q.lines[1].quantity = 999;
  assert.throws(() => closeVisit(d, "stay-test", delivery), /insuficientes/);
  assert.equal(d.products[0].stock, 16);
});
test("Entregar trabajo ya completado no descuenta otra vez", () => {
  const d = seed(),
    stock = d.products[4].stock;
  const result = closeVisit(d, "visit3", {
    ...delivery,
    mileage: 49000,
    receiver: "Luisa Pérez",
  });
  assert.equal(result.products[4].stock, stock);
  assert.equal(
    result.visits.find((v) => v.id === "visit3").status,
    "Entregado",
  );
});
test("Nota pendiente existente se entrega sin duplicación y completa su trabajo", () => {
  const d = seed();
  const result = closeVisit(d, "visit1", {
    ...delivery,
    mileage: 36205,
    receiver: "Carlos Mendoza",
  });
  assert.equal(result.deliveries.length, 2);
  assert.equal(result.deliveries[1].status, "Entregado");
  assert.equal(result.quotes[1].status, "Completado");
  assert.equal(result.products[1].stock, d.products[1].stock - 1);
});
test("Entrega directa no permite saltar inventario; completa antes de cerrar", () => {
  const d = seed();
  assert.throws(
    () => saveDelivery(d, { ...d.deliveries[1], status: "Entregado" }),
    /Finaliza/,
  );
  const completed = saveQuote(d, { ...d.quotes[1], status: "Completado" });
  const result = saveDelivery(completed, {
    ...d.deliveries[1],
    status: "Entregado",
  });
  assert.equal(result.visits[0].status, "Entregado");
  assert.equal(result.products[1].stock, d.products[1].stock - 1);
});
test("El vehículo puede reingresar después de la entrega con historial independiente", () => {
  const d = closeVisit(withLines(newVisit()), "stay-test", delivery);
  const n = admit(
    d,
    {
      clientId: "c1",
      vehicleId: "v1",
      date: "2026-10-09",
      reason: "Nueva revisión",
      mileage: 34000,
    },
    d.users[0],
  );
  assert.equal(n.visits.filter((v) => v.vehicleId === "v1").length, 2);
  assert.equal(
    n.visits.filter((v) => v.vehicleId === "v1" && v.status === "En el taller")
      .length,
    1,
  );
  assert.notEqual(n.visits.at(-1).quoteId, d.visits.at(-1).quoteId);
});

test("El recibo pendiente se actualiza con los importes del presupuesto", () => {
  const d = { ...seed(), visits: [] };
  const q = d.quotes[6];
  q.discount = 10;
  q.tax = 16;
  const a = saveDelivery(d, {
    ...delivery,
    quoteId: q.id,
    date: "2026-10-08",
    status: "Pendiente",
  });
  const note = a.deliveries.at(-1);
  assert.equal(note.discount, 10);
  assert.equal(note.tax, 16);
  const updated = saveQuote(a, { ...q, discount: 0, tax: 0 });
  assert.equal(updated.deliveries.at(-1).discount, 0);
  assert.equal(updated.deliveries.at(-1).tax, 0);
});
test("Notas anteriores reciben sus importes sin borrar documentos al actualizar", () => {
  const d = seed();
  delete d.receiptVersion;
  delete d.deliveries[0].discount;
  delete d.deliveries[0].tax;
  d.quotes[0].discount = 5;
  d.quotes[0].tax = 10;
  const next = migrate(d);
  assert.equal(next.deliveries[0].discount, 5);
  assert.equal(next.deliveries[0].tax, 10);
  assert.equal(next.deliveries[0].id, d.deliveries[0].id);
  assert.equal(migrate(next), next);
});

test("Explorer de Carlos admite trabajos con nota pendiente sin duplicar documentos ni stock", () => {
  const d = seed(),
    v = d.visits[0],
    q = d.quotes[1];
  const n = saveVisit(d, v, {
    ...q,
    lines: [
      ...q.lines,
      {
        type: "service",
        itemId: "ft-service-44",
        name: "Diagnóstico completo",
        quantity: 1,
        price: 60,
      },
      { type: "product", itemId: "p1", name: "Aceite", quantity: 2, price: 12 },
    ],
  });
  assert.equal(n.quotes[1].lines.length, 4);
  assert.equal(n.deliveries[1].lines.length, 4);
  assert.equal(n.deliveries.length, 2);
  assert.deepEqual(n.products, d.products);
  const closed = closeVisit(n, v.id, {
    ...delivery,
    mileage: 36205,
    receiver: "Carlos Mendoza",
  });
  assert.equal(closed.deliveries[1].lines.length, 4);
  assert.equal(closed.products[0].stock, d.products[0].stock - 2);
  assert.equal(closed.deliveries.length, 2);
  assert.throws(
    () => saveQuote(closed, { ...closed.quotes[1], discount: 1 }),
    /histórico/,
  );
});

test("F-150 permite trabajos adicionales conservando el presupuesto completado y su inventario", () => {
  const d = seed(),
    original = structuredClone(d.quotes[4]);
  const a = addAdditionalWork(
    d,
    "visit3",
    { type: "product", itemId: "p1", name: "Aceite", quantity: 2, price: 12 },
    d.users[0],
  );
  assert.deepEqual(a.quotes[4], original);
  assert.deepEqual(a.products, d.products);
  assert.deepEqual(a.visits[2].completedQuoteIds, ["q5"]);
  const result = issueDelivery(a, {
    ...delivery,
    quoteId: a.visits[2].quoteId,
    mileage: 48805,
    receiver: "Luisa Pérez",
  });
  assert.deepEqual(result.quotes[4], original);
  assert.equal(result.products[4].stock, d.products[4].stock);
  assert.equal(result.products[0].stock, d.products[0].stock - 2);
  assert.equal(result.visits[2].status, "Entregado");
  const note = result.deliveries.at(-1);
  assert.equal(note.lines.length, 3);
  assert.equal(note.amounts.total, 1110 + 24);
  assert.deepEqual(note.relatedQuoteNumbers, ["PRE-0005", "PRE-0009"]);
  assert.throws(
    () =>
      addAdditionalWork(
        result,
        "visit3",
        {
          type: "service",
          itemId: "ft-service-44",
          name: "Diagnóstico",
          quantity: 1,
          price: 60,
        },
        d.users[0],
      ),
    /entregado/,
  );
});
test("Emitir desde Notas cierra el ingreso y completa el trabajo en una sola operación", () => {
  const d = seed();
  const result = issueDelivery(d, {
    ...d.deliveries[1],
    deliveryDate: "2026-10-08",
    mileage: 36205,
  });
  assert.equal(result.deliveries[1].status, "Entregado");
  assert.equal(result.visits[0].status, "Entregado");
  assert.equal(result.quotes[1].status, "Completado");
  assert.equal(result.products[1].stock, d.products[1].stock - 1);
  assert.equal(result.deliveries.length, 2);
  assert.throws(() => issueDelivery(result, result.deliveries[1]), /conserva/);
});

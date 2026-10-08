import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Table, Badge, Empty, SearchBox } from "./UI";
import { deliveryDetails, totals, money } from "../utils/domain";

export default function HistoryTable({ clientId, vehicleId }) {
  const { db } = useApp();
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const match = (r) =>
    vehicleId ? r.vehicleId === vehicleId : r.clientId === clientId;
  const visits = db.visits.filter(match);
  const grouped = new Set(
    visits.flatMap((v) => [v.quoteId, ...(v.completedQuoteIds || [])]),
  );
  const rows = [
    ...visits.map((v) => {
      const quote = db.quotes.find((q) => q.id === v.quoteId);
      const detail = quote
        ? deliveryDetails(db, quote)
        : { lines: [], amounts: { total: 0 } };
      const ids = [v.quoteId, ...(v.completedQuoteIds || [])];
      return {
        id: v.id,
        vehicleId: v.vehicleId,
        date: v.date,
        mileage: v.mileage,
        status: v.status,
        lines: detail.lines,
        total: detail.amounts.total,
        visit: v,
        quotes: db.quotes.filter((q) => ids.includes(q.id)),
        notes: db.deliveries.filter((n) => ids.includes(n.quoteId)),
      };
    }),
    ...db.quotes
      .filter((q) => match(q) && !grouped.has(q.id))
      .map((q) => ({
        id: q.id,
        vehicleId: q.vehicleId,
        date: q.date,
        mileage: q.mileage,
        status: q.status,
        lines: q.lines,
        total: totals(q).total,
        quotes: [q],
        notes: db.deliveries.filter((n) => n.quoteId === q.id),
      })),
    ...db.deliveries
      .filter((n) => match(n) && !db.quotes.some((q) => q.id === n.quoteId))
      .map((n) => ({
        id: n.id,
        vehicleId: n.vehicleId,
        date: n.deliveryDate || n.date,
        mileage: n.mileage,
        status: n.status,
        lines: n.lines,
        total: n.amounts?.total ?? totals(n).total,
        quotes: [],
        notes: [n],
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const cars = db.vehicles.filter((v) => v.clientId === clientId);
  const filtered = rows.filter((r) => {
    const car = db.vehicles.find((v) => v.id === r.vehicleId);
    return (
      (!selectedVehicle || r.vehicleId === selectedVehicle) &&
      `${r.date} ${car?.brand} ${car?.model} ${car?.plate} ${r.status} ${r.lines.map((l) => l.name).join(" ")} ${r.quotes.map((q) => q.number).join(" ")} ${r.notes.map((n) => `${n.number} ${n.deliveryDate}`).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <h2>{vehicleId ? "Historial del vehículo" : "Historial"}</h2>
      </div>
      <div className="toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Buscar servicio, producto, placa o recibo…"
        />
        {clientId && cars.length > 1 && (
          <select
            aria-label="Filtrar por vehículo"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
          >
            <option value="">Todos los vehículos</option>
            {cars.map((v) => (
              <option key={v.id} value={v.id}>
                {v.model} · {v.plate}
              </option>
            ))}
          </select>
        )}
      </div>
      {filtered.length ? (
        <Table
          heads={[
            "Fecha",
            ...(clientId ? ["Vehículo"] : []),
            "Servicios",
            "Productos",
            "Total",
            "Entrega",
          ]}
        >
          {filtered.map((r) => {
            const car = db.vehicles.find((v) => v.id === r.vehicleId);
            const delivered = r.notes.some((n) => n.status === "Entregado");
            return (
              <tr key={r.id}>
                <td className="history-date" data-label="Fecha">
                  {r.date}
                  <small>{Number(r.mileage || 0).toLocaleString()} km</small>
                  {r.quotes.map((q) => (
                    <small key={q.id}>
                      <Link className="text-link" to={`/quotes/${q.id}`}>
                        {q.number}
                      </Link>
                    </small>
                  ))}
                </td>
                {clientId && (
                  <td data-label="Vehículo">
                    <Link className="text-link" to={`/vehicles/${r.vehicleId}`}>
                      {car?.brand} {car?.model}
                    </Link>
                    <small>{car?.plate}</small>
                  </td>
                )}
                {["service", "product"].map((type) => (
                  <td
                    key={type}
                    className="history-items"
                    data-label={type === "service" ? "Servicios" : "Productos"}
                  >
                    {r.lines.some((l) => l.type === type) ? (
                      <ul>
                        {r.lines
                          .filter((l) => l.type === type)
                          .map((l, i) => (
                            <li key={i}>
                              {l.name} <span>× {l.quantity}</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                ))}
                <td className="history-total" data-label="Total">
                  <strong>{money(r.total)}</strong>
                </td>
                <td className="history-delivery" data-label="Entrega">
                  <Badge value={delivered ? "Entregado" : r.status} />
                  {r.notes.map((n) => (
                    <div key={n.id}>
                      {n.status === "Entregado" && (
                        <small>{n.deliveryDate}</small>
                      )}
                      <Link className="text-link" to={`/deliveries/${n.id}`}>
                        {n.status === "Entregado" ? "Recibo" : "Borrador"}{" "}
                        {n.number}
                      </Link>
                    </div>
                  ))}
                  {r.visit?.status === "En el taller" && (
                    <Link className="text-link" to={`/workshop/${r.visit.id}`}>
                      Continuar trabajo →
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty
          text={
            rows.length
              ? "No hay resultados para esta búsqueda."
              : "Aún no hay servicios, productos ni entregas."
          }
        />
      )}
    </section>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Heading, Badge, Empty, SearchBox } from "../components/UI";
import { money, totals, deliveryDetails } from "../utils/domain";
export default function VehicleDetail() {
  const { id } = useParams();
  const { db } = useApp();
  const [search, setSearch] = useState("");
  const vehicle = db.vehicles.find((v) => v.id === id);
  if (!vehicle) return <Empty text="Vehículo no encontrado." />;
  const owner = db.clients.find((c) => c.id === vehicle.clientId);
  const visits = db.visits.filter((v) => v.vehicleId === id);
  const active = visits.find((v) => v.status === "En el taller");
  const grouped = new Set(
    visits.flatMap((v) => [v.quoteId, ...(v.completedQuoteIds || [])]),
  );
  const rows = [
    ...visits.map((v) => {
      const q = db.quotes.find((q) => q.id === v.quoteId);
      const detail = q
        ? deliveryDetails(db, q)
        : { lines: [], amounts: { total: 0 } };
      const ids = [v.quoteId, ...(v.completedQuoteIds || [])];
      return {
        id: v.id,
        date: v.date,
        mileage: v.mileage,
        status: v.status,
        lines: detail.lines,
        total: detail.amounts.total,
        reason: v.reason,
        diagnosis: v.diagnosis || q?.diagnosis,
        recommendations: v.recommendations,
        condition: v.condition,
        visit: v,
        quotes: db.quotes.filter((q) => ids.includes(q.id)),
        notes: db.deliveries.filter((n) => ids.includes(n.quoteId)),
      };
    }),
    ...db.quotes
      .filter((q) => q.vehicleId === id && !grouped.has(q.id))
      .map((q) => ({
        id: q.id,
        date: q.date,
        mileage: q.mileage,
        status: q.status,
        lines: q.lines,
        total: totals(q).total,
        reason: q.diagnosis,
        quotes: [q],
        notes: db.deliveries.filter((n) => n.quoteId === q.id),
      })),
    ...db.deliveries
      .filter(
        (n) => n.vehicleId === id && !db.quotes.some((q) => q.id === n.quoteId),
      )
      .map((n) => ({
        id: n.id,
        date: n.deliveryDate,
        mileage: n.mileage,
        status: n.status,
        lines: n.lines,
        total: n.amounts?.total ?? totals(n).total,
        reason: n.observations,
        recommendations: n.recommendations,
        quotes: [],
        notes: [n],
      })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = rows.filter((r) =>
    `${r.date} ${r.reason || ""} ${r.lines.map((l) => l.name).join(" ")} ${r.quotes.map((q) => q.number).join(" ")} ${r.notes.map((n) => n.number).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Link className="back-link" to="/vehicles">
        <ArrowLeft size={16} />
        Volver al taller
      </Link>
      <Heading
        eyebrow="FICHA DEL VEHÍCULO"
        title={`${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`}
        description={`${vehicle.year} · ${vehicle.color} · ${Number(vehicle.mileage).toLocaleString()} km`}
        action={
          active ? (
            <Link className="btn primary" to={`/workshop/${active.id}`}>
              Abrir trabajo actual
            </Link>
          ) : vehicle.active && owner?.active ? (
            <Link
              className="btn primary"
              to={`/vehicles?client=${owner.id}&vehicle=${id}`}
            >
              Ingresar al taller
            </Link>
          ) : null
        }
      />
      <section className="panel vehicle-info-simple">
        <div>
          <span>Propietario</span>
          <Link className="text-link" to={`/clients/${owner?.id}`}>
            {owner?.name || "No registrado"}
          </Link>
          <p>{owner?.phone}</p>
        </div>
        <div>
          <span>Estado actual</span>
          <Badge value={active ? "En el taller" : "Fuera del taller"} />
        </div>
        <details>
          <summary>Otros datos del vehículo</summary>
          <p>VIN: {vehicle.vin || "No registrado"}</p>
          <p>Combustible: {vehicle.fuel || "No registrado"}</p>
          <p>{vehicle.notes || "Sin observaciones."}</p>
        </details>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Historial del vehículo</h2>
            <p className="muted">
              Una visita por registro, con sus trabajos y productos.
            </p>
          </div>
        </div>
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar trabajo, producto, fecha o documento…"
          />
        </div>
        <div className="simple-vehicle-history">
          {filtered.map((r) => (
            <article key={r.id}>
              <header>
                <div>
                  <strong>{r.date}</strong>
                  <span>{Number(r.mileage).toLocaleString()} km</span>
                </div>
                <Badge value={r.status} />
              </header>
              <div className="simple-history-lines">
                {[
                  ["service", "Servicios"],
                  ["product", "Productos y repuestos"],
                ].map(([type, title]) => (
                  <section key={type}>
                    <h3>{title}</h3>
                    {r.lines.filter((l) => l.type === type).length ? (
                      <ul>
                        {r.lines
                          .filter((l) => l.type === type)
                          .map((l, i) => (
                            <li key={i}>
                              <span>{l.name}</span>
                              <b>× {l.quantity}</b>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="muted">
                        Sin {type === "service" ? "servicios" : "productos"}{" "}
                        registrados
                      </p>
                    )}
                  </section>
                ))}
              </div>
              <footer>
                <strong>Total: {money(r.total)}</strong>
                <div>
                  {r.visit?.status === "En el taller" && (
                    <Link className="btn" to={`/workshop/${r.visit.id}`}>
                      Continuar trabajo
                    </Link>
                  )}
                  {r.notes.map((n) => (
                    <Link className="btn" key={n.id} to={`/deliveries/${n.id}`}>
                      {n.status === "Entregado" ? "Ver recibo" : "Ver borrador"}
                    </Link>
                  ))}
                </div>
              </footer>
              <details className="simple-history-details">
                <summary>Más detalles y presupuestos</summary>
                {r.reason && (
                  <p>
                    <b>Motivo:</b> {r.reason}
                  </p>
                )}
                {r.diagnosis && r.diagnosis !== r.reason && (
                  <p>
                    <b>Diagnóstico:</b> {r.diagnosis}
                  </p>
                )}
                {r.condition && (
                  <p>
                    <b>Condiciones:</b> {r.condition}
                  </p>
                )}
                {r.recommendations && (
                  <p>
                    <b>Recomendaciones:</b> {r.recommendations}
                  </p>
                )}
                {r.notes
                  .filter((n) => n.status === "Entregado")
                  .map((n) => (
                    <p key={n.id}>
                      Entrega: {n.deliveryDate} · Recibido por {n.receiver}
                      {n.recommendations && ` · ${n.recommendations}`}
                    </p>
                  ))}
                <div className="patient-links">
                  {r.quotes.map((q) => (
                    <Link
                      className="text-link"
                      key={q.id}
                      to={`/quotes/${q.id}`}
                    >
                      Ver {q.number} →
                    </Link>
                  ))}
                </div>
              </details>
            </article>
          ))}
          {!filtered.length && (
            <Empty
              text={
                rows.length
                  ? "No hay resultados para esta búsqueda."
                  : "Este vehículo aún no tiene historial."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

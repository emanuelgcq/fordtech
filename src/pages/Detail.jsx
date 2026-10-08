import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Car,
  ClipboardList,
  Wrench,
  Package,
  Clock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Heading, Table, Badge, Empty, Field } from "../components/UI";
import { money, totals } from "../utils/domain";
export default function Detail({ type }) {
  const { id } = useParams();
  const { db } = useApp();
  const [vehicle, setVehicle] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [tab, setTab] = useState("Expediente");
  const record = db[type].find((r) => r.id === id);
  if (!record) return <Empty text="Registro no encontrado." />;
  const isClient = type === "clients";
  const owner = isClient
    ? record
    : db.clients.find((c) => c.id === record.clientId);
  const vehicles = isClient
    ? db.vehicles.filter((v) => v.clientId === id)
    : [record];
  const match = (r) =>
    (isClient ? r.clientId === id : r.vehicleId === id) &&
    (!vehicle || r.vehicleId === vehicle) &&
    (!from || r.date >= from) &&
    (!until || r.date <= until);
  const quotes = db.quotes.filter(match);
  const completed = quotes.filter((q) => q.status === "Completado");
  const notes = db.deliveries.filter(match);
  const visits = db.visits.filter(match);
  const active = db.visits.filter(
    (v) =>
      v.status === "En el taller" &&
      (isClient ? v.clientId === id : v.vehicleId === id),
  );
  const lines = (kind) =>
    completed.flatMap((q) =>
      q.lines
        .filter((l) => l.type === kind)
        .map((l, i) => ({ ...l, q, key: `${q.id}-${i}` })),
    );
  const events = [
    ...visits.map((v) => ({
      kind: "Ingreso al taller",
      date: v.date,
      id: v.id,
      visit: v,
    })),
    ...quotes
      .filter((q) => !visits.some((v) => v.quoteId === q.id))
      .map((q) => ({
        kind: "Presupuesto / trabajo",
        date: q.date,
        id: q.id,
        quote: q,
      })),
    ...notes.map((n) => ({
      kind: "Entrega del vehículo",
      date: n.deliveryDate,
      id: n.id,
      note: n,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Link className="back-link" to={isClient ? "/clients" : "/vehicles"}>
        <ArrowLeft size={16} />
        Volver a {isClient ? "clientes" : "taller"}
      </Link>
      <Heading
        eyebrow={
          isClient ? "EXPEDIENTE INTEGRAL DEL CLIENTE" : "EXPEDIENTE AUTOMOTRIZ"
        }
        title={isClient ? record.name : `${record.brand} ${record.model}`}
        description={
          isClient
            ? `${record.document} · Cliente desde ${record.date}`
            : `${record.plate} · ${record.year} · Propietario: ${owner.name}`
        }
        action={
          <Link
            className="btn primary"
            to={`/vehicles?client=${owner.id}${isClient ? "" : `&vehicle=${id}`}`}
          >
            <Plus size={17} />
            Nuevo ingreso al taller
          </Link>
        }
      />
      <div className="record-metrics">
        {[
          [Car, "Vehículos", vehicles.length],
          [Clock, "Ingresos", visits.length],
          [Wrench, "Trabajos completados", completed.length],
          [
            Package,
            "Productos utilizados",
            lines("product").reduce((a, l) => a + Number(l.quantity), 0),
          ],
        ].map(([Icon, title, value]) => (
          <div key={title}>
            <Icon size={20} />
            <span>{title}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="clinical-grid">
        <aside className="panel patient-summary">
          <span className="patient-avatar">
            {owner.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </span>
          <h2>{owner.name}</h2>
          <p>{owner.document}</p>
          <Badge value={owner.active ? "Activo" : "Inactivo"} />
          <hr />
          <h3>Contacto del propietario</h3>
          {[
            ["Teléfono", owner.phone],
            ["WhatsApp", owner.whatsapp],
            ["Correo", owner.email],
            ["Dirección", owner.address],
          ].map(([label, value]) => (
            <div className="patient-data" key={label}>
              <small>{label}</small>
              <strong>{value || "No registrado"}</strong>
            </div>
          ))}
          <hr />
          <h3>Observaciones del cliente</h3>
          <p>{owner.notes || "Sin observaciones."}</p>
          {!isClient && (
            <>
              <hr />
              <h3>Identificación del vehículo</h3>
              {[
                ["Marca / modelo", `${record.brand} ${record.model}`],
                ["Año", record.year],
                ["Placa", record.plate],
                ["VIN / chasis", record.vin],
                ["Color", record.color],
                ["Combustible", record.fuel],
                ["Kilometraje actual", `${record.mileage.toLocaleString()} km`],
              ].map(([label, value]) => (
                <div className="patient-data" key={label}>
                  <small>{label}</small>
                  <strong>{value || "No registrado"}</strong>
                </div>
              ))}
              <p>{record.notes}</p>
              <Link className="text-link" to={`/clients/${owner.id}`}>
                Ver expediente del propietario →
              </Link>
            </>
          )}
        </aside>
        <div>
          {isClient && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Vehículos que posee</h2>
                  <p className="muted">
                    Cada vehículo mantiene un expediente independiente.
                  </p>
                </div>
                <Link
                  className="btn"
                  to={`/vehicles/register?new=1&client=${id}`}
                >
                  <Plus size={16} />
                  Registrar vehículo
                </Link>
              </div>
              <div className="patient-vehicles">
                {vehicles.map((v) => {
                  const stay = active.find((x) => x.vehicleId === v.id);
                  return (
                    <article key={v.id}>
                      <div className="vehicle-record-title">
                        <Car size={26} />
                        <div>
                          <h3>
                            {v.brand} {v.model}
                          </h3>
                          <p>
                            {v.plate} · {v.year} · {v.color}
                          </p>
                        </div>
                        <Badge
                          value={stay ? "En el taller" : "Fuera del taller"}
                        />
                      </div>
                      <p className="muted">
                        {v.mileage.toLocaleString()} km · {v.fuel} · VIN:{" "}
                        {v.vin || "—"}
                      </p>
                      <div className="patient-links">
                        <Link className="btn" to={`/vehicles/${v.id}`}>
                          Expediente e historial
                        </Link>
                        {stay ? (
                          <Link
                            className="btn primary"
                            to={`/workshop/${stay.id}`}
                          >
                            Gestionar ingreso actual
                          </Link>
                        ) : (
                          <Link
                            className="btn"
                            to={`/vehicles?client=${id}&vehicle=${v.id}`}
                          >
                            Ingresar al taller
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!vehicles.length && (
                  <Empty text="Este cliente aún no tiene vehículos." />
                )}
              </div>
            </section>
          )}
          {active.length > 0 && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Atención en curso</h2>
                <Badge value="En el taller" />
              </div>
              <div className="active-entries">
                {active.map((v) => (
                  <Link
                    className="active-entry"
                    key={v.id}
                    to={`/workshop/${v.id}`}
                  >
                    <strong>
                      {v.number} ·{" "}
                      {db.vehicles.find((x) => x.id === v.vehicleId)?.plate}
                    </strong>
                    <p>{v.reason}</p>
                    <span>Ingreso {v.date} · Continuar seguimiento →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Historial integral</h2>
                <p className="muted">
                  Recepción, diagnóstico, intervenciones, repuestos y entrega de
                  cada visita.
                </p>
              </div>
            </div>
            <div className="toolbar history-filters">
              {isClient && (
                <Field label="Vehículo">
                  <select
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                  >
                    <option value="">Todos los vehículos</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} · {v.model}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field
                label="Desde"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Field
                label="Hasta"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  setVehicle("");
                  setFrom("");
                  setUntil("");
                }}
              >
                Limpiar
              </button>
            </div>
            <div className="record-tabs">
              {[
                "Expediente",
                "Servicios",
                "Productos",
                "Presupuestos",
                "Entregas",
              ].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "selected" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === "Expediente" && (
              <div className="medical-timeline">
                {events.map((e) => {
                  const q = e.visit
                    ? db.quotes.find((q) => q.id === e.visit.quoteId)
                    : e.quote;
                  const n = e.note;
                  const car = db.vehicles.find(
                    (v) =>
                      v.id ===
                      (e.visit?.vehicleId || q?.vehicleId || n?.vehicleId),
                  );
                  return (
                    <article key={`${e.kind}-${e.id}`}>
                      <div className="event-marker">
                        <ClipboardList size={16} />
                      </div>
                      <div className="event-card">
                        <div className="event-header">
                          <span className="eyebrow">
                            {e.kind.toUpperCase()} · {e.date}
                          </span>
                          <Badge
                            value={e.visit?.status || q?.status || n.status}
                          />
                        </div>
                        <h3>
                          {car.brand} {car.model} · {car.plate}
                        </h3>
                        <p className="muted">
                          {e.visit?.number || q?.number || n.number} ·{" "}
                          {e.visit?.mileage ?? q?.mileage ?? n.mileage} km
                        </p>
                        {e.visit && (
                          <>
                            <div className="clinical-note">
                              <strong>Motivo de consulta</strong>
                              <p>{e.visit.reason}</p>
                            </div>
                            <div className="clinical-note">
                              <strong>Diagnóstico / evolución</strong>
                              <p>
                                {e.visit.diagnosis ||
                                  q.diagnosis ||
                                  "Diagnóstico pendiente."}
                              </p>
                            </div>
                            <div className="clinical-note">
                              <strong>Condiciones y recomendaciones</strong>
                              <p>
                                {e.visit.condition ||
                                  "Sin condiciones registradas."}
                              </p>
                              <p>
                                {e.visit.recommendations ||
                                  "Sin recomendaciones adicionales."}
                              </p>
                            </div>
                          </>
                        )}
                        {q && (
                          <>
                            <div className="stay-lines">
                              <div>
                                <h3>
                                  Servicios{" "}
                                  {q.status === "Completado"
                                    ? "realizados"
                                    : "registrados"}
                                </h3>
                                {q.lines
                                  .filter((l) => l.type === "service")
                                  .map((l, i) => (
                                    <p key={i}>
                                      {l.name} × {l.quantity}{" "}
                                      <b>{money(l.price * l.quantity)}</b>
                                    </p>
                                  ))}
                                {!q.lines.some((l) => l.type === "service") && (
                                  <p className="muted">Sin servicios</p>
                                )}
                              </div>
                              <div>
                                <h3>Productos / repuestos</h3>
                                {q.lines
                                  .filter((l) => l.type === "product")
                                  .map((l, i) => (
                                    <p key={i}>
                                      {l.name} × {l.quantity}{" "}
                                      <b>{money(l.price * l.quantity)}</b>
                                    </p>
                                  ))}
                                {!q.lines.some((l) => l.type === "product") && (
                                  <p className="muted">Sin productos</p>
                                )}
                              </div>
                            </div>
                            <div className="event-total">
                              <span>
                                {q.author} · {q.number}
                              </span>
                              <strong>Total {money(totals(q).total)}</strong>
                            </div>
                          </>
                        )}
                        {n && (
                          <>
                            <p>
                              Recibido por: <b>{n.receiver}</b> · Responsable:{" "}
                              {n.responsible}
                            </p>
                            <p>{n.observations}</p>
                            <p>Recomendaciones: {n.recommendations || "—"}</p>
                          </>
                        )}
                        <div className="patient-links">
                          {e.visit && (
                            <Link
                              className="btn"
                              to={`/workshop/${e.visit.id}`}
                            >
                              Ver estancia completa
                            </Link>
                          )}
                          {q && (
                            <Link className="text-link" to={`/quotes/${q.id}`}>
                              Ver presupuesto →
                            </Link>
                          )}
                          {n && (
                            <Link className="btn" to={`/deliveries/${n.id}`}>
                              Consultar / imprimir nota
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!events.length && (
                  <Empty text="No hay registros para estos filtros." />
                )}
              </div>
            )}
            {["Servicios", "Productos"].includes(tab) &&
              (lines(tab === "Servicios" ? "service" : "product").length ? (
                <Table
                  heads={[
                    "Fecha / presupuesto",
                    "Vehículo / kilometraje",
                    "Detalle",
                    "Cantidad",
                    "Importe",
                  ]}
                >
                  {lines(tab === "Servicios" ? "service" : "product").map(
                    (l) => (
                      <tr key={l.key}>
                        <td>
                          {l.q.date}
                          <small>
                            <Link
                              className="text-link"
                              to={`/quotes/${l.q.id}`}
                            >
                              {l.q.number}
                            </Link>
                          </small>
                        </td>
                        <td>
                          {l.q.vehicle.plate}
                          <small>{l.q.mileage} km</small>
                        </td>
                        <td>{l.name}</td>
                        <td>{l.quantity}</td>
                        <td>{money(l.price * l.quantity)}</td>
                      </tr>
                    ),
                  )}
                </Table>
              ) : (
                <Empty text="No hay trabajos completados para este filtro." />
              ))}
            {tab === "Presupuestos" &&
              (quotes.length ? (
                <Table
                  heads={["Número", "Fecha", "Vehículo", "Estado", "Total"]}
                >
                  {quotes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <Link className="text-link" to={`/quotes/${q.id}`}>
                          {q.number}
                        </Link>
                      </td>
                      <td>{q.date}</td>
                      <td>{q.vehicle.plate}</td>
                      <td>
                        <Badge value={q.status} />
                      </td>
                      <td>{money(totals(q).total)}</td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty text="No hay presupuestos." />
              ))}
            {tab === "Entregas" &&
              (notes.length ? (
                <Table
                  heads={["Nota", "Fecha", "Vehículo", "Estado", "Documento"]}
                >
                  {notes.map((n) => (
                    <tr key={n.id}>
                      <td>{n.number}</td>
                      <td>{n.deliveryDate}</td>
                      <td>{n.vehicle.plate}</td>
                      <td>
                        <Badge value={n.status} />
                      </td>
                      <td>
                        <Link className="text-link" to={`/deliveries/${n.id}`}>
                          Consultar →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty text="No hay notas de entrega." />
              ))}
          </section>
        </div>
      </div>
    </>
  );
}

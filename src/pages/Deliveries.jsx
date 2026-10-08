import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Plus, ArrowLeft, Printer, Pencil, CheckCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Heading,
  SearchBox,
  Table,
  Badge,
  Empty,
  Field,
} from "../components/UI";
import { today, uid, saveDelivery } from "../utils/domain";
import { DeliveryDocument } from "../components/Documents";
export function Deliveries() {
  const { db } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = [...db.deliveries]
    .reverse()
    .filter(
      (n) =>
        (!status || n.status === status) &&
        `${n.number} ${n.client.name} ${n.vehicle.plate}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  return (
    <>
      <Heading
        title="Notas de Entrega"
        description="El cierre de cada trabajo, documentado con confianza."
        action={
          <Link className="btn primary" to="/deliveries/new">
            <Plus size={18} />
            Nueva nota de entrega
          </Link>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente, placa o número…"
          />
          <select
            aria-label="Estado de entrega"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option>Pendiente</option>
            <option>Entregado</option>
          </select>
        </div>
        {rows.length ? (
          <Table
            heads={[
              "Documento",
              "Cliente",
              "Vehículo",
              "Presupuesto",
              "Fecha de entrega",
              "Estado",
              "",
            ]}
          >
            {rows.map((n) => (
              <tr key={n.id}>
                <td>
                  <strong>{n.number}</strong>
                </td>
                <td>{n.client.name}</td>
                <td>
                  {n.vehicle.plate}
                  <small>
                    {n.vehicle.brand} {n.vehicle.model}
                  </small>
                </td>
                <td>{n.quoteNumber}</td>
                <td>{n.deliveryDate}</td>
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
          <Empty text="No se encontraron notas de entrega." />
        )}
      </section>
    </>
  );
}
export function DeliveryForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { db, user, commit, notify } = useApp();
  const nav = useNavigate();
  const original = db.deliveries.find((n) => n.id === id);
  const quoteParam = db.quotes.find((q) => q.id === params.get("quote"));
  const [form, setForm] = useState(() =>
    original
      ? { ...original }
      : {
          quoteId: quoteParam?.id || "",
          date: today(),
          deliveryDate: today(),
          mileage: quoteParam?.mileage ?? "",
          observations: quoteParam?.diagnosis || "",
          recommendations: "",
          condition: "",
          responsible: user.name,
          receiver: quoteParam?.client.name || "",
          status: "Pendiente",
        },
  );
  const [saving, setSaving] = useState(false);
  const q = db.quotes.find((q) => q.id === form.quoteId);
  const existing = db.deliveries.find(
    (n) => n.quoteId === form.quoteId && n.id !== id,
  );
  const eligible = db.quotes.filter(
    (q) =>
      ["Aprobado", "Completado"].includes(q.status) &&
      !db.deliveries.some((n) => n.quoteId === q.id && n.id !== id),
  );
  if (id && !original) return <Empty text="Nota no encontrada." />;
  if (original?.status === "Entregado")
    return (
      <Empty
        text="Esta nota ya fue entregada y no admite cambios."
        action={
          <Link className="btn" to={`/deliveries/${id}`}>
            Consultar documento
          </Link>
        }
      />
    );
  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function choose(quoteId) {
    const selected = db.quotes.find((q) => q.id === quoteId);
    setForm((f) => ({
      ...f,
      quoteId,
      mileage: selected?.mileage ?? "",
      observations: selected?.diagnosis || "",
      receiver: selected?.client.name || "",
    }));
  }
  function save(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const noteId = form.id || uid();
    if (commit((d) => saveDelivery(d, { ...form, id: noteId }))) {
      notify("Nota de entrega guardada.");
      nav(`/deliveries/${noteId}`);
    } else setSaving(false);
  }
  return (
    <>
      <Link className="back-link" to="/deliveries">
        <ArrowLeft size={16} />
        Notas de entrega
      </Link>
      <Heading
        title={original ? `Editar ${original.number}` : "Nueva nota de entrega"}
        description="Los productos y servicios se copian del presupuesto, sin modificarlo."
      />
      <form onSubmit={save}>
        <section className="panel form-panel">
          <h2>Documento relacionado</h2>
          <Field label="Presupuesto aprobado o completado *">
            <select
              required
              disabled={!!original}
              value={form.quoteId}
              onChange={(e) => choose(e.target.value)}
            >
              <option value="">Seleccionar presupuesto…</option>
              {eligible.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.number} · {q.client.name} · {q.vehicle.plate} · {q.status}
                </option>
              ))}
              {q && !eligible.some((x) => x.id === q.id) && (
                <option value={q.id}>
                  {q.number} · {q.status}
                </option>
              )}
            </select>
          </Field>
          {existing && (
            <p className="info">
              Este presupuesto ya tiene una nota.{" "}
              <Link className="text-link" to={`/deliveries/${existing.id}`}>
                Consultar {existing.number}
              </Link>
            </p>
          )}
          {q && (
            <>
              <div className="detail-grid delivery-preview">
                <div>
                  <span className="muted">Cliente</span>
                  <strong>{q.client.name}</strong>
                  <p>
                    {q.client.document} · {q.client.phone}
                  </p>
                </div>
                <div>
                  <span className="muted">Vehículo</span>
                  <strong>
                    {q.vehicle.brand} {q.vehicle.model} · {q.vehicle.year}
                  </strong>
                  <p>{q.vehicle.plate}</p>
                </div>
              </div>
              <Table heads={["Tipo", "Trabajo / repuesto", "Cantidad"]}>
                {(original?.lines || q.lines).map((l, i) => (
                  <tr key={i}>
                    <td>{l.type === "service" ? "Servicio" : "Repuesto"}</td>
                    <td>{l.name}</td>
                    <td>{l.quantity}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
          {!eligible.length && !q && (
            <p className="info">
              No hay presupuestos disponibles. Aprueba o completa un presupuesto
              que aún no tenga nota de entrega.
            </p>
          )}
        </section>
        <section className="panel form-panel">
          <h2>Información de entrega</h2>
          <div className="form-grid three">
            <Field
              label="Fecha de emisión *"
              required
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
            <Field
              label="Fecha de entrega *"
              required
              type="date"
              min={form.date}
              value={form.deliveryDate}
              onChange={(e) => set("deliveryDate", e.target.value)}
            />
            <Field
              label="Kilometraje de entrega *"
              required
              type="number"
              min="0"
              step="1"
              value={form.mileage}
              onChange={(e) => set("mileage", e.target.value)}
            />
            <Field
              label="Empleado responsable *"
              required
              value={form.responsible}
              onChange={(e) => set("responsible", e.target.value)}
            />
            <Field
              label="Nombre de quien recibe *"
              required
              value={form.receiver}
              onChange={(e) => set("receiver", e.target.value)}
            />
            <Field label="Estado">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option>Pendiente</option>
                <option>Entregado</option>
              </select>
            </Field>
          </div>
          {[
            ["observations", "Observaciones del trabajo"],
            ["recommendations", "Recomendaciones del mecánico"],
            ["condition", "Condiciones generales del vehículo al entregarlo"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <textarea
                value={form[k]}
                onChange={(e) => set(k, e.target.value)}
              />
            </Field>
          ))}
          <p className="info">
            Una nota por presupuesto. Esta operación no descuenta existencias ni
            genera otra venta.
          </p>
        </section>
        <div className="form-actions">
          <Link className="btn" to="/deliveries">
            Cancelar
          </Link>
          <button disabled={saving || !!existing} className="btn primary">
            Guardar nota de entrega
          </button>
        </div>
      </form>
    </>
  );
}
export function DeliveryDetail() {
  const { id } = useParams();
  const { db, commit, notify } = useApp();
  const n = db.deliveries.find((n) => n.id === id);
  const visit = db.visits.find(
    (v) => v.quoteId === n?.quoteId && v.status === "En el taller",
  );
  if (!n) return <Empty text="Nota de entrega no encontrada." />;
  function deliver() {
    if (
      !confirm(
        "¿Confirmar que el vehículo fue entregado? La nota quedará protegida contra cambios.",
      )
    )
      return;
    if (commit((d) => saveDelivery(d, { ...n, status: "Entregado" })))
      notify("Vehículo marcado como entregado.");
  }
  return (
    <>
      <div className="no-print">
        <Link className="back-link" to="/deliveries">
          <ArrowLeft size={16} />
          Notas de entrega
        </Link>
        <Heading
          title={n.number}
          description={`${n.client.name} · ${n.vehicle.plate}`}
          action={<Badge value={n.status} />}
        />
        <div className="document-actions">
          <button className="btn primary" onClick={() => window.print()}>
            <Printer size={17} />
            Imprimir / Guardar PDF
          </button>
          {n.status === "Pendiente" && (
            <>
              <Link className="btn" to={`/deliveries/${id}/edit`}>
                <Pencil size={17} />
                Editar nota
              </Link>
              {visit ? (
                <Link className="btn" to={`/workshop/${visit.id}`}>
                  Finalizar estancia en Taller
                </Link>
              ) : (
                <button className="btn" onClick={deliver}>
                  <CheckCircle size={17} />
                  Marcar como entregado
                </button>
              )}
            </>
          )}
          <Link className="btn" to={`/quotes/${n.quoteId}`}>
            Ver presupuesto
          </Link>
          <Link className="btn" to={`/clients/${n.clientId}`}>
            Ficha del cliente
          </Link>
          <Link className="btn" to={`/vehicles/${n.vehicleId}`}>
            Ficha del vehículo
          </Link>
        </div>
      </div>
      <DeliveryDocument note={n} />
    </>
  );
}

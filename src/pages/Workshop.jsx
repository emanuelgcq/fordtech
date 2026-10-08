import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Plus,
  Car,
  ArrowLeft,
  Trash2,
  ClipboardCheck,
  Save,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Heading,
  Modal,
  Field,
  SearchBox,
  Badge,
  Empty,
  Table,
} from "../components/UI";
import { money, today, totals, uid } from "../utils/domain";
import { admit, saveVisit, closeVisit } from "../utils/workshop";
export function Workshop() {
  const { db, user, commit, notify } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const active = db.visits.filter((v) => v.status === "En el taller");
  const rows = active.filter((v) => {
    const c = db.clients.find((c) => c.id === v.clientId),
      car = db.vehicles.find((x) => x.id === v.vehicleId);
    return `${v.number} ${c?.name} ${car?.plate} ${car?.brand} ${car?.model}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });
  function open() {
    const car = db.vehicles.find((v) => v.id === params.get("vehicle"));
    setForm({
      clientId: params.get("client") || car?.clientId || "",
      vehicleId: car?.id || "",
      mileage: car?.mileage ?? "",
      date: today(),
      reason: "",
      condition: "",
      quoteId: "",
    });
  }
  function submit(e) {
    e.preventDefault();
    const id = uid();
    if (commit((d) => admit(d, { ...form, id }, user))) {
      notify("Vehículo ingresado al taller.");
      nav(`/workshop/${id}`);
    }
  }
  return (
    <>
      <Heading
        title="Taller"
        description="Solo vehículos en el taller. Lleva el control de cada ingreso hasta su entrega."
        action={
          <button className="btn primary" onClick={open}>
            <Plus size={18} />
            Ingresar vehículo
          </button>
        }
      />
      <div className="workshop-summary">
        <Car size={22} />
        <strong>{active.length}</strong>
        <span>vehículos en el taller</span>
        <Link className="text-link" to="/clients">
          Buscar cliente y sus vehículos →
        </Link>
      </div>
      <section className="panel">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Buscar cliente, placa o ingreso…"
          />
        </div>
        <div className="stay-list">
          {rows.map((v) => {
            const q = db.quotes.find((q) => q.id === v.quoteId),
              c = db.clients.find((c) => c.id === v.clientId),
              car = db.vehicles.find((x) => x.id === v.vehicleId);
            return (
              <article className="stay-card" key={v.id}>
                <div className="stay-title">
                  <div>
                    <span className="eyebrow">
                      {v.number} · INGRESO {v.date}
                    </span>
                    <h2>
                      {car.brand} {car.model}{" "}
                      <span className="plate">{car.plate}</span>
                    </h2>
                    <p>
                      <Link to={`/clients/${c.id}`} className="text-link">
                        {c.name}
                      </Link>{" "}
                      · {v.mileage.toLocaleString()} km
                    </p>
                  </div>
                  <Badge value="En el taller" />
                </div>
                <p className="stay-reason">{v.reason}</p>
                <div className="stay-lines">
                  <div>
                    <h3>Servicios de este ingreso</h3>
                    {q.lines
                      .filter((l) => l.type === "service")
                      .map((l, i) => (
                        <p key={i}>
                          {l.name} <b>× {l.quantity}</b>
                        </p>
                      ))}
                    {!q.lines.some((l) => l.type === "service") && (
                      <p className="muted">Sin servicios registrados</p>
                    )}
                  </div>
                  <div>
                    <h3>Productos y repuestos</h3>
                    {q.lines
                      .filter((l) => l.type === "product")
                      .map((l, i) => (
                        <p key={i}>
                          {l.name} <b>× {l.quantity}</b>
                        </p>
                      ))}
                    {!q.lines.some((l) => l.type === "product") && (
                      <p className="muted">Sin productos registrados</p>
                    )}
                  </div>
                </div>
                <footer>
                  <strong>{money(totals(q).total)}</strong>
                  <Link className="btn" to={`/vehicles/${car.id}`}>
                    Ficha e historial
                  </Link>
                  <Link className="btn primary" to={`/workshop/${v.id}`}>
                    Gestionar ingreso / añadir trabajos →
                  </Link>
                </footer>
              </article>
            );
          })}
          {!rows.length && (
            <Empty
              text={
                active.length
                  ? "No hay ingresos que coincidan."
                  : "No hay vehículos en el taller."
              }
              action={
                <button className="btn primary" onClick={open}>
                  Ingresar vehículo
                </button>
              }
            />
          )}
        </div>
      </section>
      {form && (
        <Modal
          title="Ingresar vehículo al taller"
          onClose={() => setForm(null)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Cliente registrado *">
                <select
                  required
                  value={form.clientId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientId: e.target.value,
                      vehicleId: "",
                      mileage: "",
                      quoteId: "",
                    })
                  }
                >
                  <option value="">Seleccionar cliente</option>
                  {db.clients
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Vehículo del cliente *">
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      vehicleId: e.target.value,
                      mileage:
                        db.vehicles.find((v) => v.id === e.target.value)
                          ?.mileage ?? "",
                      quoteId: "",
                    })
                  }
                >
                  <option value="">Seleccionar vehículo</option>
                  {db.vehicles
                    .filter(
                      (v) =>
                        v.clientId === form.clientId &&
                        v.active &&
                        !active.some((x) => x.vehicleId === v.id),
                    )
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} · {v.brand} {v.model}
                      </option>
                    ))}
                </select>
              </Field>
              <Field
                label="Fecha de ingreso *"
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <Field
                label="Kilometraje de ingreso *"
                required
                type="number"
                min="0"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              />
            </div>
            <Field label="Presupuesto existente (opcional)">
              <select
                value={form.quoteId}
                onChange={(e) => setForm({ ...form, quoteId: e.target.value })}
              >
                <option value="">Crear un presupuesto para este ingreso</option>
                {db.quotes
                  .filter(
                    (q) =>
                      q.vehicleId === form.vehicleId &&
                      q.status !== "Rechazado" &&
                      !db.visits.some((v) => v.quoteId === q.id) &&
                      !db.deliveries.some(
                        (n) => n.quoteId === q.id && n.status === "Entregado",
                      ),
                  )
                  .map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.number} · {q.status}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Motivo de ingreso / síntomas *">
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </Field>
            <Field label="Condiciones al recibir el vehículo">
              <textarea
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
              />
            </Field>
            <p className="info">
              Si el cliente no tiene vehículos, regístralo desde su ficha. No se
              permiten dos ingresos activos del mismo vehículo.
            </p>
            <div className="form-actions">
              <button
                className="btn"
                type="button"
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              <button className="btn primary">Registrar ingreso</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function WorkshopDetail() {
  const { id } = useParams();
  const { db, user, commit, notify } = useApp();
  const visit = db.visits.find((v) => v.id === id);
  const saved = db.quotes.find((q) => q.id === visit?.quoteId);
  const [form, setForm] = useState(() => ({ ...visit }));
  const [quote, setQuote] = useState(() =>
    saved ? { ...saved, lines: saved.lines.map((l) => ({ ...l })) } : null,
  );
  const [kind, setKind] = useState("service");
  const [search, setSearch] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [dirty, setDirty] = useState(false);
  if (!visit || !quote) return <Empty text="Ingreso no encontrado." />;
  const car = db.vehicles.find((v) => v.id === visit.vehicleId),
    client = db.clients.find((c) => c.id === visit.clientId);
  const note = db.deliveries.find((n) => n.quoteId === quote.id);
  const readonly =
    visit.status !== "En el taller" || saved.inventoryApplied || !!note;
  const catalog = db[kind === "service" ? "services" : "products"].filter(
    (i) =>
      i.active &&
      `${i.name} ${i.category} ${i.code}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const t = totals(quote);
  function update(k, value) {
    setForm((f) => ({ ...f, [k]: value }));
    setDirty(true);
  }
  function change(k, value) {
    setQuote((q) => ({ ...q, [k]: value }));
    setDirty(true);
  }
  function add(i) {
    const existing = quote.lines.find(
      (l) => l.itemId === i.id && l.type === kind,
    );
    change(
      "lines",
      existing
        ? quote.lines.map((l) =>
            l === existing ? { ...l, quantity: Number(l.quantity) + 1 } : l,
          )
        : [
            ...quote.lines,
            {
              type: kind,
              itemId: i.id,
              name: i.name,
              price: i.price,
              quantity: 1,
            },
          ],
    );
  }
  function save(e) {
    e?.preventDefault();
    if (
      commit((d) =>
        saveVisit(d, form, {
          ...quote,
          diagnosis: form.diagnosis || form.reason,
        }),
      )
    ) {
      notify("Ingreso y trabajos guardados.");
      setDirty(false);
      return true;
    }
    return false;
  }
  function openDelivery() {
    if (dirty) {
      notify("Guarda los cambios del ingreso antes de entregar.", true);
      return;
    }
    if (!saved.lines.length) {
      notify("Añade y guarda los trabajos antes de entregar.", true);
      return;
    }
    setDelivery({
      deliveryDate: today(),
      mileage: Math.max(Number(car.mileage), Number(form.mileage)),
      responsible: user.name,
      receiver: client.name,
      observations: form.diagnosis || form.reason,
      recommendations: form.recommendations || "",
      condition: form.condition || "",
    });
  }
  function finish(e) {
    e.preventDefault();
    if (
      !confirm(
        "¿Finalizar la estancia y entregar el vehículo? Se completará el trabajo y se descontarán los repuestos una sola vez.",
      )
    )
      return;
    if (commit((d) => closeVisit(d, id, delivery))) {
      notify("Vehículo entregado. Nota de entrega creada y estancia cerrada.");
      setDelivery(null);
      setDirty(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/vehicles">
        <ArrowLeft size={16} />
        Volver al taller
      </Link>
      <Heading
        title={`${car.brand} ${car.model} · ${car.plate}`}
        description={`${visit.number} · ${client.name} · Ingreso ${visit.date}`}
        action={<Badge value={visit.status} />}
      />
      <div className="patient-links">
        <Link className="btn" to={`/clients/${client.id}`}>
          <ExternalLink size={15} />
          Ficha completa del cliente
        </Link>
        <Link className="btn" to={`/vehicles/${car.id}`}>
          <ExternalLink size={15} />
          Expediente del vehículo
        </Link>
        <Link className="btn" to={`/quotes/${quote.id}`}>
          {quote.number}
        </Link>
        {note && (
          <Link className="btn" to={`/deliveries/${note.id}`}>
            {note.number} · Imprimir entrega
          </Link>
        )}
      </div>
      <div className="clinical-grid">
        <aside className="patient-summary panel">
          <h2>Ficha de recepción</h2>
          <h3>{client.name}</h3>
          <p>{client.document}</p>
          <p>{client.phone}</p>
          <p>{client.address}</p>
          <hr />
          <h3>
            {car.brand} {car.model} · {car.year}
          </h3>
          <p>Placa: {car.plate}</p>
          <p>VIN: {car.vin || "—"}</p>
          <p>
            {car.color} · {car.fuel}
          </p>
          <p>{car.notes}</p>
          <hr />
          <p>
            <b>Responsable:</b> {visit.responsible}
          </p>
          <p>
            <b>Ingresos previos:</b>{" "}
            {
              db.visits.filter((v) => v.vehicleId === car.id && v.id !== id)
                .length
            }
          </p>
          <p>
            <b>Trabajos anteriores:</b>{" "}
            {
              db.quotes.filter(
                (q) =>
                  q.vehicleId === car.id &&
                  q.status === "Completado" &&
                  q.id !== quote.id,
              ).length
            }
          </p>
          <Link className="text-link" to={`/vehicles/${car.id}`}>
            Ver todo el historial →
          </Link>
        </aside>
        <div>
          <form onSubmit={save}>
            <section className="panel form-panel">
              <h2>Seguimiento de la estancia</h2>
              <div className="form-grid">
                <Field
                  label="Fecha de ingreso"
                  type="date"
                  required
                  disabled={visit.status !== "En el taller"}
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
                <Field
                  label="Kilometraje de ingreso"
                  type="number"
                  min="0"
                  required
                  disabled={readonly}
                  value={form.mileage}
                  onChange={(e) => update("mileage", e.target.value)}
                />
              </div>
              {[
                ["reason", "Motivo de ingreso / síntomas"],
                ["diagnosis", "Diagnóstico y evolución del trabajo"],
                ["condition", "Condiciones del vehículo"],
                ["recommendations", "Recomendaciones del mecánico"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <textarea
                    required={key === "reason"}
                    disabled={visit.status !== "En el taller"}
                    value={form[key] || ""}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </Field>
              ))}
            </section>
            <section className="panel form-panel">
              <h2>Servicios y productos de este ingreso</h2>
              {!readonly && (
                <div className="catalog-picker">
                  <div className="toolbar">
                    <div className="tabs">
                      <button
                        type="button"
                        className={kind === "service" ? "selected" : ""}
                        onClick={() => setKind("service")}
                      >
                        Servicios
                      </button>
                      <button
                        type="button"
                        className={kind === "product" ? "selected" : ""}
                        onClick={() => setKind("product")}
                      >
                        Productos
                      </button>
                    </div>
                    <SearchBox
                      value={search}
                      onChange={setSearch}
                      placeholder="Buscar trabajo, categoría o repuesto…"
                    />
                  </div>
                  <div className="catalog-results">
                    {catalog.map((i) => (
                      <button key={i.id} type="button" onClick={() => add(i)}>
                        <Plus size={15} />
                        <span>
                          <strong>{i.name}</strong>
                          <small>
                            {i.category}
                            {kind === "product"
                              ? ` · ${i.stock} disponibles`
                              : ""}
                            {i.priceMode === "range"
                              ? ` · Hasta ${money(i.priceMax)}`
                              : i.priceMode === "from"
                                ? " · A partir de"
                                : ""}
                          </small>
                        </span>
                        <b>{money(i.price)}</b>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {readonly && (
                <p className="info">
                  El detalle de un trabajo completado o con nota de entrega está
                  protegido. Puedes consultar sus líneas y finalizar la
                  estancia.
                </p>
              )}
              {quote.lines.length ? (
                <Table
                  heads={["Detalle", "Cantidad", "Precio USD", "Subtotal", ""]}
                >
                  {quote.lines.map((l, i) => (
                    <tr key={`${l.type}-${l.itemId}`}>
                      <td>
                        <strong>{l.name}</strong>
                        <small>
                          {l.type === "service" ? "Servicio" : "Repuesto"}
                        </small>
                      </td>
                      <td>
                        <input
                          className="line-input"
                          aria-label={`Cantidad ${l.name}`}
                          type="number"
                          min="1"
                          required
                          disabled={readonly}
                          value={l.quantity}
                          onChange={(e) =>
                            change(
                              "lines",
                              quote.lines.map((x, j) =>
                                i === j
                                  ? { ...x, quantity: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="line-input"
                          aria-label={`Precio ${l.name}`}
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          disabled={readonly}
                          value={l.price}
                          onChange={(e) =>
                            change(
                              "lines",
                              quote.lines.map((x, j) =>
                                i === j ? { ...x, price: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </td>
                      <td>{money(l.quantity * l.price)}</td>
                      <td>
                        {!readonly && (
                          <button
                            type="button"
                            className="icon-btn danger-text"
                            aria-label={`Quitar ${l.name}`}
                            onClick={() =>
                              change(
                                "lines",
                                quote.lines.filter((_, j) => i !== j),
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty text="Añade los trabajos y repuestos de esta estancia." />
              )}
              <div className="quote-bottom">
                <div className="form-grid">
                  <Field
                    label="Descuento USD"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={readonly}
                    value={quote.discount}
                    onChange={(e) => change("discount", e.target.value)}
                  />
                  <Field
                    label="Impuesto %"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={readonly}
                    value={quote.tax}
                    onChange={(e) => change("tax", e.target.value)}
                  />
                </div>
                <div className="totals">
                  <p>
                    Subtotal <b>{money(t.subtotal)}</b>
                  </p>
                  <p>
                    Descuento <b>{money(t.discount)}</b>
                  </p>
                  <p>
                    Impuesto <b>{money(t.tax)}</b>
                  </p>
                  <p className="grand-total">
                    Total <b>{money(t.total)}</b>
                  </p>
                </div>
              </div>
            </section>
            {visit.status === "En el taller" && (
              <div className="form-actions">
                <span className="muted">
                  {dirty ? "Hay cambios sin guardar" : ""}
                </span>
                <button className="btn primary">
                  <Save size={16} />
                  Guardar seguimiento y trabajos
                </button>
                <button className="btn" type="button" onClick={openDelivery}>
                  <ClipboardCheck size={16} />
                  Finalizar estancia / nota de entrega
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      {delivery && (
        <Modal
          title="Finalizar estancia y entregar vehículo"
          onClose={() => setDelivery(null)}
        >
          <form onSubmit={finish}>
            <p className="info">
              La nota incluirá todos los servicios y repuestos de {quote.number}
              . Al entregar, el vehículo saldrá de la lista «En el taller» y su
              historial se conservará.
            </p>
            <div className="form-grid">
              {[
                ["deliveryDate", "Fecha de entrega", "date"],
                ["mileage", "Kilometraje de entrega", "number"],
                ["responsible", "Empleado responsable", "text"],
                ["receiver", "Quien recibe el vehículo", "text"],
              ].map(([key, label, type]) => (
                <Field
                  key={key}
                  label={label}
                  required
                  type={type}
                  min={
                    type === "number"
                      ? form.mileage
                      : type === "date"
                        ? form.date
                        : undefined
                  }
                  value={delivery[key]}
                  onChange={(e) =>
                    setDelivery({ ...delivery, [key]: e.target.value })
                  }
                />
              ))}
            </div>
            {[
              ["observations", "Observaciones finales"],
              ["recommendations", "Recomendaciones"],
              ["condition", "Condiciones al entregar"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea
                  value={delivery[key]}
                  onChange={(e) =>
                    setDelivery({ ...delivery, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setDelivery(null)}
              >
                Cancelar
              </button>
              <button className="btn primary">
                Confirmar entrega y generar nota
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

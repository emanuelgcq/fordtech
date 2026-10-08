import { money, totals } from "../utils/domain";
function Header({ title, number, date }) {
  return (
    <header className="document-header">
      <img src="/logo.svg" alt="FORDTECH Servicio Automotriz" />
      <div>
        <h2>FORDTECH — {title}</h2>
        <p>Servicio automotriz · Documento de demostración</p>
        <strong>{number}</strong>
        <p>Fecha de emisión: {date}</p>
      </div>
    </header>
  );
}
function Identity({ client, vehicle }) {
  return (
    <div className="document-identity">
      <section>
        <h3>DATOS DEL CLIENTE</h3>
        <strong>{client.name}</strong>
        <p>Documento: {client.document}</p>
        <p>Teléfono: {client.phone}</p>
        <p>Correo: {client.email || "—"}</p>
        <p>Dirección: {client.address || "—"}</p>
      </section>
      <section>
        <h3>IDENTIFICACIÓN DEL VEHÍCULO</h3>
        <strong>
          {vehicle.brand} {vehicle.model}
        </strong>
        <p>
          Año: {vehicle.year} · Placa: {vehicle.plate}
        </p>
        <p>VIN / Chasis: {vehicle.vin || "—"}</p>
        <p>Color: {vehicle.color || "—"}</p>
        <p>Combustible: {vehicle.fuel || "—"}</p>
      </section>
    </div>
  );
}
function Lines({ lines, prices = true }) {
  return (
    <table className="document-table">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descripción</th>
          <th>Cant.</th>
          {prices && (
            <>
              <th>Precio</th>
              <th>Subtotal</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {lines.map((l, i) => (
          <tr key={i}>
            <td>{l.type === "product" ? "Repuesto" : "Servicio"}</td>
            <td>{l.name}</td>
            <td>{l.quantity}</td>
            {prices && (
              <>
                <td>{money(l.price)}</td>
                <td>{money(l.price * l.quantity)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function Section({ title, children }) {
  return (
    <section className="document-section">
      <h3>{title}</h3>
      <p>{children || "Sin observaciones adicionales."}</p>
    </section>
  );
}
function Signatures() {
  return (
    <div className="signatures">
      <div>Firma del empleado responsable</div>
      <div>Firma de conformidad del cliente</div>
    </div>
  );
}
export function QuoteDocument({ quote: q }) {
  const t = totals(q);
  return (
    <article className="document">
      <Header title="PRESUPUESTO" number={q.number} date={q.date} />
      <Identity client={q.client} vehicle={q.vehicle} />
      <div className="document-meta">
        <span>Kilometraje: {q.mileage} km</span>
        <span>Válido hasta: {q.expiry}</span>
        <span>Estado: {q.status}</span>
      </div>
      <Lines lines={q.lines} />
      <div className="document-total">
        <p>
          Subtotal <strong>{money(t.subtotal)}</strong>
        </p>
        <p>
          Descuento <strong>{money(t.discount)}</strong>
        </p>
        <p>
          Impuesto ({q.tax}%) <strong>{money(t.tax)}</strong>
        </p>
        <p className="grand-total">
          Total USD <strong>{money(t.total)}</strong>
        </p>
      </div>
      <Section title="DIAGNÓSTICO Y OBSERVACIONES">{q.diagnosis}</Section>
      <Section title="ELABORADO POR">{q.author}</Section>
      <Signatures />
      <footer className="document-footer">
        FORDTECH · Precisión, confianza y servicio automotriz.
      </footer>
    </article>
  );
}
export function DeliveryDocument({ note: n }) {
  return (
    <article className="document">
      <Header title="NOTA DE ENTREGA" number={n.number} date={n.date} />
      <Identity client={n.client} vehicle={n.vehicle} />
      <div className="document-meta">
        <span>Presupuesto: {n.quoteNumber}</span>
        <span>Kilometraje de entrega: {n.mileage} km</span>
        <span>Estado: {n.status}</span>
      </div>
      <h3 className="section-title">SERVICIOS REALIZADOS</h3>
      <Lines
        lines={n.lines.filter((l) => l.type === "service")}
        prices={false}
      />
      <h3 className="section-title">PRODUCTOS Y REPUESTOS UTILIZADOS</h3>
      <Lines
        lines={n.lines.filter((l) => l.type === "product")}
        prices={false}
      />
      <Section title="OBSERVACIONES DEL TRABAJO">{n.observations}</Section>
      <Section title="RECOMENDACIONES DEL MECÁNICO">
        {n.recommendations}
      </Section>
      <Section title="CONDICIONES GENERALES DEL VEHÍCULO">
        {n.condition}
      </Section>
      <div className="document-identity">
        <section>
          <h3>RESPONSABLE DE LA ENTREGA</h3>
          <p>{n.responsible}</p>
        </section>
        <section>
          <h3>RECEPCIÓN DEL VEHÍCULO</h3>
          <p>{n.receiver}</p>
          <p>Fecha de entrega: {n.deliveryDate}</p>
        </section>
      </div>
      <p className="declaration">
        Declaro haber recibido el vehículo identificado en este documento y
        haber sido informado de los trabajos realizados y las recomendaciones
        correspondientes.
      </p>
      <Signatures />
      <footer className="document-footer">
        Esta nota documenta la entrega. No genera ventas ni movimientos de
        inventario.
      </footer>
    </article>
  );
}

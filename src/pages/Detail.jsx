import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Car } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Heading, Badge, Empty } from "../components/UI";
import HistoryTable from "../components/HistoryTable";
export default function Detail({ type }) {
  const { id } = useParams();
  const { db } = useApp();
  const record = db[type].find((r) => r.id === id);
  if (!record) return <Empty text="Registro no encontrado." />;
  const isClient = type === "clients";
  const owner = isClient
    ? record
    : db.clients.find((c) => c.id === record.clientId);
  const vehicles = isClient
    ? db.vehicles.filter((v) => v.clientId === id)
    : [record];
  const active = db.visits.filter(
    (v) =>
      v.status === "En el taller" &&
      (isClient ? v.clientId === id : v.vehicleId === id),
  );
  return (
    <>
      <Link className="back-link" to={isClient ? "/clients" : "/vehicles"}>
        <ArrowLeft size={16} />
        Volver a {isClient ? "clientes" : "taller"}
      </Link>
      <Heading
        eyebrow={isClient ? "FICHA DEL CLIENTE" : "EXPEDIENTE AUTOMOTRIZ"}
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
      <section className="panel vehicle-info-simple">
        <div>
          <span>Teléfono</span>
          <p>{owner.phone || "—"}</p>
        </div>
        <div>
          <span>Correo</span>
          <p>{owner.email || "—"}</p>
        </div>
        <div>
          <span>Dirección</span>
          <p>{owner.address || "—"}</p>
        </div>
      </section>
      <div className="client-history-layout">
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
                          Ver historial
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
          <HistoryTable
            clientId={isClient ? id : undefined}
            vehicleId={isClient ? undefined : id}
          />
        </div>
      </div>
    </>
  );
}

import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Heading, Badge, Empty } from "../components/UI";
import HistoryTable from "../components/HistoryTable";
export default function VehicleDetail() {
  const { id } = useParams();
  const { db } = useApp();
  const vehicle = db.vehicles.find((v) => v.id === id);
  if (!vehicle) return <Empty text="Vehículo no encontrado." />;
  const owner = db.clients.find((c) => c.id === vehicle.clientId);
  const visits = db.visits.filter((v) => v.vehicleId === id);
  const active = visits.find((v) => v.status === "En el taller");
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
      <HistoryTable vehicleId={id} />
    </>
  );
}

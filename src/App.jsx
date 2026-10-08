import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import Detail from "./pages/Detail";
import { Workshop, WorkshopDetail } from "./pages/Workshop";
import { Quotes, QuoteForm, QuoteDetail } from "./pages/Quotes";
import { Deliveries, DeliveryForm, DeliveryDetail } from "./pages/Deliveries";
import { Empty } from "./components/UI";
function Protected() {
  const { user } = useApp();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
function AdminUsers() {
  const { admin } = useApp();
  return admin ? <Records type="users" /> : <Navigate to="/" replace />;
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        {["clients", "services", "products"].map((type) => (
          <Route
            key={type}
            path={`/${type}`}
            element={<Records key={type} type={type} />}
          />
        ))}
        {["clients", "vehicles"].map((type) => (
          <Route
            key={type}
            path={`/${type}/:id`}
            element={<Detail key={type} type={type} />}
          />
        ))}
        <Route path="/vehicles" element={<Workshop />} />
        <Route
          path="/vehicles/register"
          element={<Records type="vehicles" />}
        />
        <Route path="/workshop/:id" element={<WorkshopDetail />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/quotes/new" element={<QuoteForm />} />
        <Route path="/quotes/:id" element={<QuoteDetail />} />
        <Route path="/quotes/:id/edit" element={<QuoteForm />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/deliveries/new" element={<DeliveryForm />} />
        <Route path="/deliveries/:id" element={<DeliveryDetail />} />
        <Route path="/deliveries/:id/edit" element={<DeliveryForm />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route
          path="*"
          element={
            <Empty
              text="La página no existe."
              action={
                <Link className="btn primary" to="/">
                  Volver al inicio
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  );
}

import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  Package,
  FileText,
  ClipboardCheck,
  Shield,
  LogOut,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../context/AppContext";
const links = [
  ["/", "Inicio", LayoutDashboard],
  ["/clients", "Clientes", Users],
  ["/vehicles", "Taller", Car],
  ["/services", "Servicios", Wrench],
  ["/products", "Productos", Package],
  ["/quotes", "Presupuestos", FileText],
  ["/deliveries", "Notas de Entrega", ClipboardCheck],
];
export default function Layout() {
  const { user, admin, logout, reset } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const title =
    links.find(([path]) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path),
    )?.[1] ||
    (location.pathname.startsWith("/workshop") ? "Taller" : "Usuarios");
  return (
    <div className="app-shell">
      <aside className={`sidebar no-print ${open ? "open" : ""}`}>
        <div className="brand">
          <img src="/logo.svg" alt="FORDTECH Servicio Automotriz" />
          <button
            className="mobile-close icon-btn"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="nav-label">ESPACIO DE TRABAJO</p>
        <nav>
          {[...links, ...(admin ? [["/users", "Usuarios", Shield]] : [])].map(
            ([path, label, Icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="workshop-status">
            <span className="dot" />
            Taller en marcha <small>Prototipo · datos locales</small>
          </div>
          {admin && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "¿Restaurar los datos de demostración? Se reemplazarán todos los registros locales.",
                  )
                )
                  reset();
              }}
            >
              <RotateCcw size={16} />
              Restaurar demostración
            </button>
          )}
          <button onClick={logout}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      {open && (
        <div className="mobile-overlay" onClick={() => setOpen(false)} />
      )}
      <div className="main-shell">
        <header className="topbar no-print">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>Administración</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="top-user">
            <div>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </div>
            <span className="avatar">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

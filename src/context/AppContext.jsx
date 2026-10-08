import { createContext, useContext, useState, useRef } from "react";
import { seed } from "../data/seed";
import { migrate } from "../utils/workshop";
const Context = createContext();
const KEY = "fordtech-data-v1";
function load() {
  try {
    const x = JSON.parse(localStorage.getItem(KEY));
    if (
      x &&
      [
        "clients",
        "vehicles",
        "services",
        "products",
        "quotes",
        "users",
        "deliveries",
      ].every((k) => Array.isArray(x[k]))
    ) {
      const next = migrate(x);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    }
  } catch {}
  return seed();
}
export function AppProvider({ children }) {
  const [db, setDb] = useState(load);
  const current = useRef(db);
  const [userId, setUserId] = useState(() =>
    localStorage.getItem("fordtech-session"),
  );
  const [notice, setNotice] = useState(null);
  const timer = useRef();
  const user = db.users.find((u) => u.id === userId && u.active);
  const admin = user?.role === "Administrador";
  function notify(message, error = false) {
    setNotice({ message, error });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4500);
  }
  function commit(fn) {
    try {
      const next = fn(current.current);
      localStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setDb(next);
      return true;
    } catch (e) {
      notify(e.message || "No se pudo guardar.", true);
      return false;
    }
  }
  function login(email, password) {
    const u = current.current.users.find(
      (u) =>
        u.active &&
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    );
    if (!u) {
      notify("Credenciales incorrectas o usuario inactivo.", true);
      return false;
    }
    localStorage.setItem("fordtech-session", u.id);
    setUserId(u.id);
    return true;
  }
  function logout() {
    localStorage.removeItem("fordtech-session");
    setUserId(null);
  }
  return (
    <Context.Provider
      value={{
        db,
        user,
        admin,
        commit,
        notify,
        login,
        logout,
        reset: () => {
          if (!admin) return;
          commit(() => seed());
          notify("Datos de demostración restaurados.");
        },
      }}
    >
      {children}
      {notice && (
        <div role="status" className={`toast ${notice.error ? "error" : ""}`}>
          {notice.message}
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);

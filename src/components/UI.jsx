import { useId, cloneElement } from "react";
import { X, Search, Plus, Inbox } from "lucide-react";
export function Heading({
  eyebrow = "GESTIÓN DEL TALLER",
  title,
  description,
  action,
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span id={`${id}-label`}>{label}</span>
      {children ? (
        cloneElement(children, { id, "aria-labelledby": `${id}-label` })
      ) : (
        <input {...props} id={id} aria-labelledby={`${id}-label`} />
      )}
    </label>
  );
}
export function SearchBox({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <div className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function Badge({ value }) {
  return (
    <span className={`badge status-${String(value).toLowerCase()}`}>
      {value === "Pendiente" ? "Borrador · sin emitir" : value}
    </span>
  );
}
export function Empty({ text = "No hay registros para mostrar.", action }) {
  return (
    <div className="empty">
      <Inbox size={32} />
      <h3>{text}</h3>
      {action}
    </div>
  );
}
export function AddButton({ children = "Nuevo registro", onClick }) {
  return (
    <button className="btn primary" onClick={onClick}>
      <Plus size={18} />
      {children}
    </button>
  );
}
export function Table({ heads, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Wrench, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Field } from "../components/UI";
export default function Login() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (user) return <Navigate to="/" replace />;
  function submit(e) {
    e.preventDefault();
    if (login(email, password)) navigate("/");
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <img src="/logo.svg" alt="FORDTECH Servicio Automotriz" />
        <div>
          <span className="eyebrow">TU TALLER, MEJOR CONECTADO</span>
          <h1>
            Pasión por los motores.
            <br />
            Precisión en la gestión.
          </h1>
          <p>
            Un espacio para cuidar a tus clientes, organizar cada trabajo y
            entregar con confianza.
          </p>
          <div className="login-feature">
            <Wrench size={22} />
            Servicio, calidad y confianza.
          </div>
        </div>
        <small>FORDTECH · Servicio Automotriz</small>
      </section>
      <section className="login-form">
        <div>
          <p className="eyebrow">BIENVENIDO A FORDTECH</p>
          <h2>Inicia sesión</h2>
          <p className="muted">Ingresa tus datos para acceder al taller.</p>
          <form onSubmit={submit}>
            <Field
              label="Correo electrónico"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@fordtech.com"
            />
            <Field
              label="Contraseña"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn primary" type="submit">
              Entrar al taller <ArrowRight size={18} />
            </button>
          </form>
          <div className="demo-access">
            <h3>
              <ShieldCheck size={17} />
              Accesos de demostración
            </h3>
            <p>
              Administrador: <b>admin@fordtech.com</b>
              <br />
              Contraseña: <b>admin123</b>
            </p>
            <p>
              Empleado: <b>empleado@fordtech.com</b>
              <br />
              Contraseña: <b>empleado123</b>
            </p>
            <small>
              Autenticación simulada. No uses contraseñas reales. Los datos se
              guardan únicamente en este navegador.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}

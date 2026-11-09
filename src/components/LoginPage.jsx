import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onLogin(email.trim(), password);
    } catch {
      setError('No se pudo iniciar sesión. Verifica tus credenciales y el acceso al servicio.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-lockup">
          <span className="brand-symbol">S<span>S</span></span>
          <span>SPORTS SCHOOL</span>
        </div>
        <div className="login-brand-copy">
          <p className="eyebrow">PANEL DE CONTROL · 01</p>
          <h1>Una sola vista para cuidar cada licencia.</h1>
          <p>
            Administra escuelas, pagos y activaciones sin tocar la información
            deportiva que permanece en cada dispositivo.
          </p>
        </div>
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
        <div className="login-brand-footer">CONTROL CENTRAL · OPERACIÓN SEGURA</div>
      </section>

      <section className="login-panel">
        <div className="login-panel-top">
          <span className="mobile-brand">SS / LICENCIAS</span>
          <span className="secure-label"><i /> Conexión cifrada</span>
        </div>

        <div className="login-form-wrap">
          <p className="eyebrow">ACCESO ADMINISTRATIVO</p>
          <h2>Bienvenido.</h2>
          <p className="login-instruction">
            Ingresa con tu cuenta de administrador de licencias.
          </p>

          <form onSubmit={submit}>
            <label className="field">
              <span>Correo electrónico</span>
              <input
                autoComplete="username"
                autoCapitalize="none"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@tuorganizacion.com"
                required
              />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña segura"
                required
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="button button-dark login-submit" disabled={busy}>
              {busy ? 'Verificando acceso…' : 'Entrar al panel'}
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className="login-help">
            <span className="help-mark">i</span>
            <p>
              ¿Es tu primer acceso? El propietario inicial se configura por
              separado en el servicio backend.
            </p>
          </div>
        </div>

        <footer className="login-footer">
          <span>Sports School Licensing</span>
          <span>v1.0 · Admin</span>
        </footer>
      </section>
    </main>
  );
}

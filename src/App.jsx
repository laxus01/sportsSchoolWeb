import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  API_BASE_URL,
  ApiError,
  createApiClient,
  isExpiredSession,
  readStoredSession,
} from './api.js';
import ActivationCodeModal from './components/ActivationCodeModal.jsx';
import EventsModal from './components/EventsModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import Modal from './components/Modal.jsx';
import PaymentForm from './components/PaymentForm.jsx';
import SchoolDetails from './components/SchoolDetails.jsx';
import SchoolForm from './components/SchoolForm.jsx';
import { formatDate, licenseTypeLabel, statusLabel, statusTone } from './format.js';

const PAYMENT_METHOD_LABELS = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

function getErrorMessage(error) {
  const code = error instanceof ApiError ? error.message : '';
  const messages = {
    ADMIN_CREDENTIALS_INVALID: 'Correo o contraseña incorrectos.',
    ADMIN_AUTH_REQUIRED: 'Tu sesión venció. Inicia sesión de nuevo.',
    ACTIVE_SCHOOL_NOT_FOUND: 'La escuela necesita una licencia activa para emitir códigos.',
    LICENSE_NOT_ACTIVE: 'La licencia no está activa.',
    PAYMENT_REQUIRED: 'Registra el pago inicial antes de activar la licencia.',
    PAYMENT_PERIOD_INVALID: 'Revisa el periodo del pago: las fechas no son válidas.',
    IDEMPOTENCY_KEY_REQUIRED: 'No se pudo crear una clave de pago única. Inténtalo de nuevo.',
    IDEMPOTENCY_KEY_REUSED: 'La clave de pago ya fue usada con otros datos.',
    SCHOOL_INSTALLATION_LIMIT_REACHED: 'La escuela ya tiene una instalación activa.',
    INSTALLATION_NOT_FOUND: 'No se encontró la instalación.',
    LICENSE_CANCELLED: 'Una licencia cancelada no puede recibir pagos.',
    LICENSE_API_HTTPS_REQUIRED: 'La API debe configurarse con HTTPS.',
  };
  if (messages[code]) return messages[code];
  if (error instanceof ApiError) return error.message;
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

function Status({ value }) {
  return <span className={`status-pill tone-${statusTone(value)}`}>{statusLabel(value)}</span>;
}

function SchoolTable({ schools, onSelect }) {
  if (!schools.length) {
    return <div className="empty-feed">Todavía no hay escuelas registradas.</div>;
  }
  return (
    <div className="school-list">
      {schools.map((school, index) => (
        <button
          className="school-row"
          key={school.id}
          onClick={() => onSelect(school)}
        >
          <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="school-monogram">{school.name?.slice(0, 1).toUpperCase()}</span>
          <span className="school-row-main">
            <strong>{school.name}</strong>
            <small>{licenseTypeLabel(school.licenseType)} · {school.billingTimezone}</small>
          </span>
          <span className="school-row-paid">
            {school.licenseType === 'PERPETUAL'
              ? 'Permanente'
              : school.paidThroughDate || 'Sin fecha'}
          </span>
          <Status value={school.licenseStatus} />
          <span className="row-arrow" aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
  );
}

function LoadingMark() {
  return <span className="loading-mark" aria-label="Cargando" />;
}

export default function App() {
  const [session, setSession] = useState(readStoredSession);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [installations, setInstallations] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingInstallations, setLoadingInstallations] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('sportsSchoolAdminSession');
    setSession(null);
    setSchools([]);
    setInstallations([]);
    setSelectedSchoolId('');
  }, []);

  const api = useMemo(
    () =>
      createApiClient(session?.accessToken, () => {
        clearSession();
        setToast({ tone: 'error', message: 'La sesión venció. Inicia sesión de nuevo.' });
      }),
    [clearSession, session?.accessToken],
  );

  const selectedSchool =
    schools.find((school) => school.id === selectedSchoolId) || null;
  const filteredSchools = schools.filter((school) =>
    `${school.name} ${school.id} ${school.licenseType}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  const loadSchools = useCallback(async (preferId = '') => {
    setLoadingSchools(true);
    try {
      const result = await api.get('/admin/schools');
      const items = Array.isArray(result?.schools) ? result.schools : [];
      setSchools(items);
      setSelectedSchoolId((current) => {
        if (preferId && items.some((item) => item.id === preferId)) return preferId;
        if (current && items.some((item) => item.id === current)) return current;
        return items[0]?.id || '';
      });
    } catch (error) {
      setToast({ tone: 'error', message: getErrorMessage(error) });
    } finally {
      setLoadingSchools(false);
    }
  }, [api]);

  const refreshInstallations = useCallback(async (schoolId) => {
    if (!schoolId) {
      setInstallations([]);
      return;
    }
    setLoadingInstallations(true);
    try {
      const result = await api.get(`/admin/schools/${encodeURIComponent(schoolId)}/installations`);
      setInstallations(Array.isArray(result?.installations) ? result.installations : []);
    } catch (error) {
      setInstallations([]);
      setToast({ tone: 'error', message: getErrorMessage(error) });
    } finally {
      setLoadingInstallations(false);
    }
  }, [api]);

  useEffect(() => {
    if (!session) return undefined;
    if (isExpiredSession(session)) {
      clearSession();
      return undefined;
    }
    void loadSchools();
    const expiresIn = Math.max(0, session.expiresAt - Date.now());
    const timer = window.setTimeout(clearSession, expiresIn);
    return () => window.clearTimeout(timer);
  }, [session, clearSession, loadSchools]);

  useEffect(() => {
    void refreshInstallations(selectedSchoolId);
  }, [selectedSchoolId, refreshInstallations]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function login(email, password) {
    const result = await createApiClient(null).post('/admin/auth/login', {
      email,
      password,
    });
    if (!result?.accessToken || !result?.admin?.role) {
      throw new ApiError('Respuesta de inicio de sesión inválida.');
    }
    const nextSession = {
      accessToken: result.accessToken,
      tokenType: result.tokenType || 'Bearer',
      admin: result.admin,
      expiresAt: Date.now() + Number(result.expiresIn || 1200) * 1000,
    };
    sessionStorage.setItem('sportsSchoolAdminSession', JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function runMutation(action, successMessage) {
    setBusy(true);
    setToast(null);
    try {
      const result = await action();
      setToast({ tone: 'success', message: successMessage });
      return result;
    } catch (error) {
      setToast({ tone: 'error', message: getErrorMessage(error) });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createSchool(values) {
    const result = await runMutation(
      () => api.post('/admin/schools', values),
      'Escuela creada. Registra el pago inicial para activar la licencia.',
    );
    if (!result?.schoolId) return;
    await loadSchools(result.schoolId);
    setModal({
      type: 'payment',
      school: {
        ...result,
        name: values.name,
        paidThroughDate: values.paidThroughDate,
      },
    });
  }

  async function recordPayment(school, values, idempotencyKey) {
    const result = await runMutation(
      () =>
        api.post(
          `/admin/licenses/${encodeURIComponent(school.licenseId)}/payments`,
          values,
          { 'Idempotency-Key': idempotencyKey },
        ),
      'Pago registrado; estado de licencia actualizado.',
    );
    if (!result) return;
    setModal(null);
    await loadSchools(school.id);
  }

  async function issueActivationCode(school) {
    if (busy) return;
    if (!window.confirm(`¿Emitir un código de activación de un solo uso para ${school.name}?`)) {
      return;
    }
    const result = await runMutation(
      () =>
        api.post(
          `/admin/schools/${encodeURIComponent(school.id)}/activation-codes`,
          {},
        ),
      'Código generado. Copíalo y entrégalo de forma segura; no podrás volver a verlo.',
    );
    if (result?.code) {
      setModal({
        type: 'activation',
        code: result.code,
        expiresAt: result.expiresAt,
      });
    }
  }

  async function changeLicenseStatus(school, action) {
    if (busy) return;
    const actions = {
      suspend: { suffix: 'suspend', label: 'suspender' },
      reactivate: { suffix: 'reactivate', label: 'reactivar' },
      cancel: { suffix: 'cancel', label: 'cancelar' },
    };
    const selected = actions[action];
    if (!selected) return;
    if (!window.confirm(`¿Confirmas ${selected.label} la licencia de ${school.name}?`)) {
      return;
    }
    const result = await runMutation(
      () =>
        api.post(
          `/admin/licenses/${encodeURIComponent(school.licenseId)}/${selected.suffix}`,
          {},
        ),
      `Licencia ${action === 'reactivate' ? 'reactivada' : action === 'suspend' ? 'suspendida' : 'cancelada'}.`,
    );
    if (result) await loadSchools(school.id);
  }

  async function changeInstallationStatus(school, installation, action) {
    if (busy) return;
    const labels = { suspend: 'suspender', reactivate: 'reactivar', revoke: 'revocar' };
    if (!window.confirm(`¿Confirmas ${labels[action]} esta instalación?`)) return;
    const result = await runMutation(
      () =>
        api.post(
          `/admin/installations/${encodeURIComponent(installation.id)}/${action}`,
          {},
        ),
      `Instalación ${action === 'reactivate' ? 'reactivada' : action === 'suspend' ? 'suspendida' : 'revocada'}.`,
    );
    if (result) {
      await Promise.all([
        loadSchools(school.id),
        refreshInstallations(school.id),
      ]);
    }
  }

  async function openEvents(school) {
    setEvents([]);
    setLoadingEvents(true);
    setModal({ type: 'events', school });
    try {
      const result = await api.get(
        `/admin/licenses/${encodeURIComponent(school.licenseId)}/events`,
      );
      setEvents(Array.isArray(result?.events) ? result.events : []);
    } catch (error) {
      setToast({ tone: 'error', message: getErrorMessage(error) });
      setModal(null);
    } finally {
      setLoadingEvents(false);
    }
  }

  if (!session) {
    return <LoginPage onLogin={login} />;
  }

  const activeCount = schools.filter((item) => item.licenseStatus === 'ACTIVE').length;
  const pendingCount = schools.filter((item) => item.licenseStatus === 'PENDING_PAYMENT').length;
  const ownerCanManage = ['OWNER', 'ADMIN'].includes(session.admin.role);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-symbol">S<span>S</span></span>
          <div>
            <strong>sports school</strong>
            <small>LICENSING CONSOLE</small>
          </div>
        </div>
        <div className="sidebar-divider" />
        <p className="sidebar-label">ADMINISTRACIÓN</p>
        <button className="side-link side-link-active">
          <span className="side-link-mark">01</span>
          <span>Escuelas y licencias</span>
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="user-avatar">{session.admin.email?.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{session.admin.email}</strong>
              <small>{statusLabel(session.admin.role)}</small>
            </div>
          </div>
          <button className="logout-button" onClick={clearSession}>Cerrar sesión <span>↗</span></button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Sports School</span><b>/</b> Licencias</div>
          <div className="topbar-meta">
            <span className="secure-label"><i /> API segura</span>
            <span className="role-chip">{statusLabel(session.admin.role)}</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">CONTROL CENTRAL · LICENCIAS</p>
              <h1>Escuelas <span>&</span> accesos.</h1>
              <p>Administra vigencias, pagos e instalaciones autorizadas.</p>
            </div>
            {ownerCanManage && (
              <button className="button button-dark create-school-button" onClick={() => setModal({ type: 'school' })}>
                <span aria-hidden="true">＋</span> Nueva escuela
              </button>
            )}
          </section>

          <section className="metric-grid" aria-label="Resumen">
            <article className="metric-card">
              <span className="metric-index">01 / REGISTRO</span>
              <strong>{schools.length}</strong>
              <small>Escuelas registradas</small>
              <i className="metric-spark spark-mint" />
            </article>
            <article className="metric-card">
              <span className="metric-index">02 / VIGENCIA</span>
              <strong>{activeCount}</strong>
              <small>Licencias activas</small>
              <i className="metric-spark spark-lime" />
            </article>
            <article className="metric-card metric-card-warm">
              <span className="metric-index">03 / ACCIÓN</span>
              <strong>{pendingCount}</strong>
              <small>Pendientes de pago</small>
              <i className="metric-spark spark-orange" />
            </article>
          </section>

          <section className="workspace">
            <div className="school-board">
              <div className="board-heading">
                <div>
                  <p className="eyebrow">DIRECTORIO</p>
                  <h2>Escuelas registradas <span>{schools.length}</span></h2>
                </div>
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar escuela…"
                    aria-label="Buscar escuela"
                  />
                </label>
              </div>
              <div className="table-head">
                <span>ESCUELA</span>
                <span>TIPO</span>
                <span>VIGENCIA</span>
                <span>ESTADO</span>
                <span />
              </div>
              {loadingSchools ? (
                <div className="board-loading"><LoadingMark /> Cargando directorio…</div>
              ) : filteredSchools.length ? (
                <SchoolTable
                  schools={filteredSchools}
                  onSelect={(school) => setSelectedSchoolId(school.id)}
                />
              ) : (
                <div className="empty-feed">
                  {schools.length ? 'No hay resultados con ese filtro.' : 'No hay escuelas registradas todavía.'}
                </div>
              )}
              <div className="board-footer">
                <span>Mostrando {filteredSchools.length} de {schools.length}</span>
                <button className="text-button" onClick={() => loadSchools(selectedSchoolId)}>
                  Actualizar lista ↻
                </button>
              </div>
            </div>

            <SchoolDetails
              school={selectedSchool}
              installations={installations}
              loadingInstallations={loadingInstallations}
              busy={busy}
              role={session.admin.role}
              onPayment={(school) => setModal({ type: 'payment', school })}
              onActivationCode={issueActivationCode}
              onLicenseStatus={changeLicenseStatus}
              onInstallationStatus={changeInstallationStatus}
              onEvents={openEvents}
            />
          </section>
          <footer className="page-footer">
            <span>Los datos deportivos permanecen en el dispositivo de cada escuela.</span>
            <span>API · {API_BASE_URL.replace(/^https?:\/\//, '')}</span>
          </footer>
        </div>
      </main>

      {toast && (
        <div className={`toast toast-${toast.tone}`} role="status">
          <span>{toast.tone === 'success' ? '✓' : '!'}</span>{toast.message}
          <button onClick={() => setToast(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      {modal?.type === 'school' && (
        <Modal title="Registrar escuela" eyebrow="NUEVA LICENCIA" onClose={() => setModal(null)}>
          <SchoolForm onCancel={() => setModal(null)} onSubmit={createSchool} loading={busy} />
        </Modal>
      )}
      {modal?.type === 'payment' && (
        <Modal title="Registrar pago" eyebrow={modal.school.name} onClose={() => setModal(null)}>
          <PaymentForm
            school={modal.school}
            onCancel={() => setModal(null)}
            onSubmit={(values, idempotencyKey) =>
              recordPayment(modal.school, values, idempotencyKey)
            }
            loading={busy}
          />
        </Modal>
      )}
      {modal?.type === 'activation' && (
        <ActivationCodeModal
          code={modal.code}
          expiresAt={modal.expiresAt}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'events' && (
        <EventsModal
          school={modal.school}
          events={events}
          loading={loadingEvents}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

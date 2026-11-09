import { formatDate, licenseTypeLabel, statusLabel, statusTone } from '../format.js';

function Status({ value }) {
  return <span className={`status-pill tone-${statusTone(value)}`}>{statusLabel(value)}</span>;
}

function InstallationRow({ item, canManage, busy, onStatus }) {
  return (
    <article className="installation-row">
      <div className="installation-main">
        <span className="device-mark">D</span>
        <div>
          <div className="inline-title">
            <strong>{item.appVersion || 'Instalación'}</strong>
            <Status value={item.status} />
          </div>
          <small className="mono">{item.id}</small>
          <small className="mono">Huella {item.publicKeyThumbprint}</small>
          <div className="installation-meta">
            <span>Rev. {item.licenseRevision}</span>
            <span>Activada {formatDate(item.activatedAt)}</span>
            <span>Validada {formatDate(item.lastValidationAt)}</span>
          </div>
        </div>
      </div>
      {canManage && item.status !== 'REVOKED' && (
        <div className="installation-actions">
          {item.status === 'ACTIVE' ? (
            <button className="text-button" disabled={busy} onClick={() => onStatus(item, 'suspend')}>
              Suspender
            </button>
          ) : (
            <button className="text-button" disabled={busy} onClick={() => onStatus(item, 'reactivate')}>
              Reactivar
            </button>
          )}
          <button className="text-button danger-text" disabled={busy} onClick={() => onStatus(item, 'revoke')}>
            Revocar
          </button>
        </div>
      )}
    </article>
  );
}

export default function SchoolDetails({
  school,
  installations,
  loadingInstallations,
  busy,
  role,
  onPayment,
  onActivationCode,
  onLicenseStatus,
  onInstallationStatus,
  onEvents,
}) {
  if (!school) {
    return (
      <aside className="detail-empty">
        <span className="empty-orbit">S</span>
        <p className="eyebrow">DETALLE DE ESCUELA</p>
        <h2>Selecciona un registro.</h2>
        <p>El estado de licencia, los pagos y las instalaciones aparecerán aquí.</p>
      </aside>
    );
  }

  const canManage = role === 'OWNER' || role === 'ADMIN';
  const isActive = school.licenseStatus === 'ACTIVE' && school.status === 'ACTIVE';
  const canRecordPayment = school.licenseStatus !== 'CANCELLED';

  return (
    <aside className="school-detail">
      <div className="detail-heading">
        <div className="school-emblem">{school.name?.slice(0, 1).toUpperCase()}</div>
        <div className="detail-heading-copy">
          <p className="eyebrow">ESCUELA SELECCIONADA</p>
          <h2>{school.name}</h2>
          <small className="mono">{school.id}</small>
        </div>
        <Status value={school.licenseStatus} />
      </div>

      <div className="detail-stats">
        <div>
          <span>LICENCIA</span>
          <strong>{licenseTypeLabel(school.licenseType)}</strong>
        </div>
        <div>
          <span>REVISIÓN</span>
          <strong>{school.revision ?? 0}</strong>
        </div>
        <div>
          <span>VÁLIDA HASTA</span>
          <strong>{school.paidThroughDate || 'Sin vencimiento'}</strong>
        </div>
      </div>

      {school.licenseStatus === 'PENDING_PAYMENT' && (
        <div className="inline-alert alert-warning">
          La licencia no se activa hasta registrar el pago inicial.
        </div>
      )}

      <div className="detail-actions">
        {canManage && canRecordPayment && (
          <button className="button button-dark" disabled={busy} onClick={() => onPayment(school)}>
            Registrar pago
          </button>
        )}
        {canManage && isActive && (
          <button className="button button-accent" disabled={busy} onClick={() => onActivationCode(school)}>
            Emitir código
          </button>
        )}
        {canManage && school.licenseStatus === 'ACTIVE' && (
          <button
            className="button button-quiet"
            disabled={busy}
            onClick={() => onLicenseStatus(school, 'suspend')}
          >
            Suspender licencia
          </button>
        )}
        {canManage && school.licenseStatus === 'SUSPENDED' && (
          <button
            className="button button-quiet"
            disabled={busy}
            onClick={() => onLicenseStatus(school, 'reactivate')}
          >
            Reactivar licencia
          </button>
        )}
        {role === 'OWNER' &&
          !['CANCELLED', 'PENDING_PAYMENT'].includes(school.licenseStatus) && (
            <button
              className="button button-danger-quiet"
              disabled={busy}
              onClick={() => onLicenseStatus(school, 'cancel')}
            >
              Cancelar licencia
            </button>
          )}
        <button className="button button-quiet" disabled={busy} onClick={() => onEvents(school)}>
          Ver eventos
        </button>
      </div>

      <section className="installations-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DISPOSITIVOS</p>
            <h3>Instalaciones</h3>
          </div>
          <span className="count-chip">{installations.length}</span>
        </div>
        {loadingInstallations ? (
          <div className="loading-line"><span /> Cargando instalaciones…</div>
        ) : installations.length ? (
          <div className="installation-list">
            {installations.map((item) => (
              <InstallationRow
                key={item.id}
                item={item}
                canManage={canManage}
                busy={busy}
                onStatus={(installation, action) =>
                  onInstallationStatus(school, installation, action)
                }
              />
            ))}
          </div>
        ) : (
          <div className="empty-installations">
            <span>Este colegio aún no tiene una instalación activa.</span>
          </div>
        )}
        <p className="detail-footnote">
          Creada {formatDate(school.createdAt)} · Zona {school.billingTimezone || 'America/Bogota'}
        </p>
      </section>
    </aside>
  );
}

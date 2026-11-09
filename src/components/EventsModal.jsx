import { formatDate } from '../format.js';
import Modal from './Modal.jsx';

function renderDetails(details) {
  if (typeof details === 'string') {
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }
  return JSON.stringify(details || {}, null, 2);
}

export default function EventsModal({ school, events, loading, onClose }) {
  return (
    <Modal
      title="Actividad de licencia"
      eyebrow={school.name}
      onClose={onClose}
      wide
    >
      {loading ? (
        <div className="loading-line"><span /> Cargando actividad…</div>
      ) : events.length ? (
        <div className="event-list">
          {events.map((event) => (
            <article className="event-row" key={event.id}>
              <div className="event-marker" />
              <div className="event-content">
                <div className="event-heading">
                  <strong>{event.eventType}</strong>
                  <time>{formatDate(event.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </div>
                <div className="event-meta">
                  {event.installationId && <span>Instalación {event.installationId}</span>}
                  {event.actorAdminId && <span>Admin {event.actorAdminId}</span>}
                </div>
                <pre>{renderDetails(event.details)}</pre>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-installations">No hay eventos registrados para esta licencia.</div>
      )}
    </Modal>
  );
}

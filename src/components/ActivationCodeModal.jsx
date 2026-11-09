import { useState } from 'react';

import { formatDate } from '../format.js';
import Modal from './Modal.jsx';

export default function ActivationCodeModal({ code, expiresAt, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <Modal
      title="Código listo"
      eyebrow="ACTIVACIÓN DE DISPOSITIVO"
      onClose={onClose}
    >
      <div className="secret-callout">
        <span className="secret-icon">!</span>
        <p>
          Se muestra una sola vez. Compártelo únicamente con el responsable de
          esta escuela y no lo incluyas en capturas públicas.
        </p>
      </div>
      <div className="activation-code-box">
        <code>{code}</code>
        <button className="button button-quiet" onClick={copyCode}>
          {copied ? 'Copiado' : 'Copiar código'}
        </button>
      </div>
      {copyError && (
        <p className="modal-note">
          No se pudo copiar automáticamente; selecciona el código para copiarlo.
        </p>
      )}
      <p className="modal-note">
        Vence {formatDate(expiresAt, { dateStyle: 'long', timeStyle: 'short' })}.
      </p>
      <div className="modal-actions">
        <button className="button button-dark" onClick={onClose}>Listo</button>
      </div>
    </Modal>
  );
}

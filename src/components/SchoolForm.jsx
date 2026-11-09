import { useState } from 'react';

export default function SchoolForm({ onCancel, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [licenseType, setLicenseType] = useState('SUBSCRIPTION');
  const [paidThroughDate, setPaidThroughDate] = useState('');

  function submit(event) {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      taxIdentifier: taxIdentifier.trim() || undefined,
      licenseType,
      ...(licenseType === 'SUBSCRIPTION' ? { paidThroughDate } : {}),
    });
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label className="field">
        <span>Nombre de la escuela <b>*</b></span>
        <input
          autoFocus
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Academia Horizonte"
          required
        />
      </label>
      <label className="field">
        <span>NIT / identificación fiscal <small>Opcional</small></span>
        <input
          maxLength={40}
          value={taxIdentifier}
          onChange={(event) => setTaxIdentifier(event.target.value)}
          placeholder="Número de identificación"
        />
      </label>
      <label className="field">
        <span>Tipo de licencia <b>*</b></span>
        <select
          value={licenseType}
          onChange={(event) => setLicenseType(event.target.value)}
        >
          <option value="SUBSCRIPTION">Suscripción</option>
          <option value="PERPETUAL">Permanente</option>
        </select>
      </label>
      {licenseType === 'SUBSCRIPTION' && (
        <label className="field">
          <span>Último día pagado <b>*</b></span>
          <input
            type="date"
            value={paidThroughDate}
            onChange={(event) => setPaidThroughDate(event.target.value)}
            required
          />
          <small className="field-hint">La fecha se interpreta en America/Bogota.</small>
        </label>
      )}
      <div className="modal-actions">
        <button className="button button-quiet" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button button-dark" disabled={loading || !name.trim()}>
          {loading ? 'Creando…' : 'Crear escuela'}
        </button>
      </div>
    </form>
  );
}

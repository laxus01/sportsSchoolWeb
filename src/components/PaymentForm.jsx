import { useState } from 'react';

const today = new Date().toLocaleDateString('en-CA', {
  timeZone: 'America/Bogota',
});

export default function PaymentForm({ school, onCancel, onSubmit, loading }) {
  const isSubscription = school.licenseType === 'SUBSCRIPTION';
  const [amountCop, setAmountCop] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState(today);
  const [periodEndDate, setPeriodEndDate] = useState(school.paidThroughDate || '');
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  function submit(event) {
    event.preventDefault();
    onSubmit({
      paymentType: isSubscription ? 'SUBSCRIPTION_RENEWAL' : 'PERPETUAL_LICENSE',
      amountCop: Number(amountCop),
      currency: 'COP',
      paymentMethod,
      ...(reference.trim() ? { reference: reference.trim() } : {}),
      ...(isSubscription ? { periodStartDate, periodEndDate } : {}),
    }, idempotencyKey);
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="form-context">
        <span className="context-icon">$</span>
        <div>
          <strong>{school.name}</strong>
          <small>
            {isSubscription ? 'Pago de suscripción · COP' : 'Pago único · COP'}
          </small>
        </div>
      </div>

      <label className="field">
        <span>Valor recibido (COP) <b>*</b></span>
        <input
          autoFocus
          min="1"
          step="1"
          type="number"
          value={amountCop}
          onChange={(event) => setAmountCop(event.target.value)}
          placeholder="250000"
          required
        />
      </label>
      <label className="field">
        <span>Método de pago <b>*</b></span>
        <select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
        >
          <option value="BANK_TRANSFER">Transferencia</option>
          <option value="CASH">Efectivo</option>
          <option value="CARD">Tarjeta</option>
          <option value="OTHER">Otro</option>
        </select>
      </label>
      <label className="field">
        <span>Referencia <small>Opcional</small></span>
        <input
          maxLength={160}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Comprobante o referencia"
        />
      </label>

      {isSubscription && (
        <div className="date-pair">
          <label className="field">
            <span>Inicio del periodo <b>*</b></span>
            <input
              type="date"
              value={periodStartDate}
              onChange={(event) => setPeriodStartDate(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Fin del periodo <b>*</b></span>
            <input
              type="date"
              value={periodEndDate}
              onChange={(event) => setPeriodEndDate(event.target.value)}
              required
            />
          </label>
        </div>
      )}

      <p className="form-note">
        El registro activa o renueva la licencia en el backend. No corresponde
        a los pagos deportivos que la escuela registra en la app.
      </p>
      <div className="modal-actions">
        <button className="button button-quiet" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="button button-dark" disabled={loading}>
          {loading ? 'Guardando…' : 'Registrar pago'}
        </button>
      </div>
    </form>
  );
}

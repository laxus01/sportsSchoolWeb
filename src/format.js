export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return String(value);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    ...options,
  }).format(date);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function licenseTypeLabel(value) {
  return value === 'PERPETUAL' ? 'Permanente' : 'Suscripción';
}

export function statusLabel(value) {
  const labels = {
    ACTIVE: 'Activa',
    PENDING_PAYMENT: 'Pendiente de pago',
    SUSPENDED: 'Suspendida',
    CANCELLED: 'Cancelada',
    REVOKED: 'Revocada',
    CLOSED: 'Cerrada',
    SUPPORT: 'Soporte',
    ADMIN: 'Administrador',
    OWNER: 'Propietario',
  };
  return labels[value] || value || '—';
}

export function statusTone(value) {
  if (value === 'ACTIVE') return 'positive';
  if (value === 'PENDING_PAYMENT') return 'warning';
  if (value === 'SUSPENDED' || value === 'REVOKED' || value === 'CANCELLED') {
    return 'negative';
  }
  return 'neutral';
}

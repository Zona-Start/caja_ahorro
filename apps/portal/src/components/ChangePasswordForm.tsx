import { useState } from 'react';

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    setMessage(null);

    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? 'No se pudo cambiar la contraseña.');
        return;
      }
      setMessage('Contraseña actualizada correctamente.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && <div className="alert">{error}</div>}
      {message && (
        <div className="alert" style={{ background: '#ecfdf5', color: '#0f766e', borderColor: '#a7f3d0' }}>
          {message}
        </div>
      )}

      <label htmlFor="cp-current">Contraseña actual</label>
      <input
        id="cp-current"
        type="password"
        value={current}
        autoComplete="current-password"
        onChange={(e) => setCurrent(e.target.value)}
      />

      <label htmlFor="cp-new">Nueva contraseña</label>
      <input
        id="cp-new"
        type="password"
        value={next}
        autoComplete="new-password"
        onChange={(e) => setNext(e.target.value)}
      />

      <label htmlFor="cp-confirm">Confirmar nueva contraseña</label>
      <input
        id="cp-confirm"
        type="password"
        value={confirm}
        autoComplete="new-password"
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button type="button" onClick={submit} disabled={saving}>
        {saving ? 'Guardando…' : 'Cambiar contraseña'}
      </button>

      <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
        La nueva contraseña no puede ser igual a tu cédula.
      </p>
    </div>
  );
}

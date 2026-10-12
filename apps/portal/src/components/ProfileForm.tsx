import { useState } from 'react';

interface Option {
  id: number;
  name: string;
}

interface ProfileFormProps {
  initial: {
    cedula: string;
    fullname: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    locality: {
      id: number;
      state: string;
      municipality: string;
      parish: string;
    } | null;
  };
  states: Option[];
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data } as const;
}

const row: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: 18,
  marginTop: 18,
};

export default function ProfileForm({ initial, states }: ProfileFormProps) {
  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [address, setAddress] = useState(initial.address ?? '');

  const [stateId, setStateId] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [parishId, setParishId] = useState('');
  const [municipalities, setMunicipalities] = useState<Option[]>([]);
  const [parishes, setParishes] = useState<Option[]>([]);

  const [verifiedEmail, setVerifiedEmail] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailChanged = email.trim() !== (initial.email ?? '');
  const phoneChanged = phone.trim() !== (initial.phone ?? '');

  const loadMunicipalities = async (value: string) => {
    setStateId(value);
    setMunicipalityId('');
    setParishId('');
    setParishes([]);
    setMunicipalities([]);
    if (!value) return;
    const res = await fetch(`/api/catalog/municipalities?stateId=${value}`);
    if (res.ok) setMunicipalities(await res.json());
  };

  const loadParishes = async (value: string) => {
    setMunicipalityId(value);
    setParishId('');
    setParishes([]);
    if (!value) return;
    const res = await fetch(`/api/catalog/parishes?municipalityId=${value}`);
    if (res.ok) setParishes(await res.json());
  };

  const requestOtp = async (purpose: 'EMAIL_VERIFY' | 'PHONE_VERIFY') => {
    setError(null);
    setMessage(null);
    const target = purpose === 'EMAIL_VERIFY' ? email.trim() : phone.trim();
    if (!target) {
      setError('Completa el dato antes de verificar.');
      return;
    }
    const { ok, data } = await postJson('/api/profile/otp-request', {
      purpose,
      target,
    });
    if (!ok) {
      setError((data as { message?: string }).message ?? 'No se pudo enviar el código.');
      return;
    }
    if (purpose === 'EMAIL_VERIFY') setEmailSent(true);
    else setPhoneSent(true);
    setMessage('Código enviado. Revisa tu correo.');
  };

  const confirmOtp = async (purpose: 'EMAIL_VERIFY' | 'PHONE_VERIFY') => {
    setError(null);
    setMessage(null);
    const code = purpose === 'EMAIL_VERIFY' ? emailCode : phoneCode;
    const { ok, data } = await postJson('/api/profile/otp-verify', {
      purpose,
      code,
    });
    if (!ok) {
      setError((data as { message?: string }).message ?? 'Código inválido.');
      return;
    }
    if (purpose === 'EMAIL_VERIFY') setVerifiedEmail(true);
    else setVerifiedPhone(true);
    setMessage('Verificado correctamente.');
  };

  const save = async () => {
    setError(null);
    setMessage(null);

    if (emailChanged && !verifiedEmail) {
      setError('Debes verificar el nuevo correo antes de guardar.');
      return;
    }
    if (phoneChanged && !verifiedPhone) {
      setError('Debes verificar el nuevo teléfono antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim(),
      };

      if (stateId && municipalityId && parishId) {
        const res = await fetch(
          `/api/catalog/resolve?stateId=${stateId}&municipalityId=${municipalityId}&parishId=${parishId}`,
        );
        if (res.ok) {
          const loc = (await res.json()) as { id?: number };
          if (loc?.id) payload.localityId = loc.id;
        }
      }

      const { ok, data } = await postJson('/api/profile/update', payload);
      if (!ok) {
        setError((data as { message?: string }).message ?? 'No se pudo guardar.');
        return;
      }
      setMessage('Perfil actualizado.');
      setVerifiedEmail(false);
      setVerifiedPhone(false);
      setEmailSent(false);
      setPhoneSent(false);
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

      <p className="muted">
        Cédula <b>{initial.cedula}</b> · {initial.fullname}
      </p>

      <label htmlFor="pf-email">Correo electrónico</label>
      <input
        id="pf-email"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setVerifiedEmail(false); }}
      />
      {emailChanged && (
        <div style={{ marginTop: -8, marginBottom: 16 }}>
          {!verifiedEmail ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={{ width: 'auto' }} onClick={() => requestOtp('EMAIL_VERIFY')}>
                Enviar código al nuevo correo
              </button>
              {emailSent && (
                <>
                  <input
                    style={{ maxWidth: 120, marginBottom: 0 }}
                    placeholder="Código"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                  <button type="button" style={{ width: 'auto' }} onClick={() => confirmOtp('EMAIL_VERIFY')}>
                    Verificar
                  </button>
                </>
              )}
            </div>
          ) : (
            <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Correo verificado ✓</span>
          )}
        </div>
      )}

      <label htmlFor="pf-phone">Teléfono</label>
      <input
        id="pf-phone"
        type="tel"
        value={phone}
        onChange={(e) => { setPhone(e.target.value); setVerifiedPhone(false); }}
      />
      {phoneChanged && (
        <div style={{ marginTop: -8, marginBottom: 16 }}>
          {!verifiedPhone ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={{ width: 'auto' }} onClick={() => requestOtp('PHONE_VERIFY')}>
                Enviar código
              </button>
              {phoneSent && (
                <>
                  <input
                    style={{ maxWidth: 120, marginBottom: 0 }}
                    placeholder="Código"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                  />
                  <button type="button" style={{ width: 'auto' }} onClick={() => confirmOtp('PHONE_VERIFY')}>
                    Verificar
                  </button>
                </>
              )}
            </div>
          ) : (
            <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>Teléfono verificado ✓</span>
          )}
        </div>
      )}

      <div style={row}>
        <label htmlFor="pf-address">Dirección</label>
        <input
          id="pf-address"
          type="text"
          value={address}
          placeholder="Dirección de habitación"
          onChange={(e) => setAddress(e.target.value)}
        />

        <p className="muted" style={{ marginBottom: 8 }}>
          Localidad actual:{' '}
          {initial.locality
            ? `${initial.locality.state} / ${initial.locality.municipality} / ${initial.locality.parish}`
            : 'no registrada'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <select className="input" value={stateId} onChange={(e) => loadMunicipalities(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <option value="">Estado…</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select value={municipalityId} onChange={(e) => loadParishes(e.target.value)} disabled={!stateId}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <option value="">Municipio…</option>
            {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select value={parishId} onChange={(e) => setParishId(e.target.value)} disabled={!municipalityId}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <option value="">Parroquia…</option>
            {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div style={row}>
        <button type="button" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

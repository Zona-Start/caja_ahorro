import { useState } from 'react';

interface Option {
  id: number;
  name: string;
}

interface Profile {
  cedula: string;
  fullname: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  locality: {
    id: number;
    state: string;
    municipality: string | null;
    parish: string | null;
  } | null;
}

interface ProfileFormProps {
  initial: Profile;
  accountNumber: string | null;
  bankName: string | null;
  states: Option[];
}

const ND = 'N/D';
const val = (v: unknown) => (v == null || v === '' ? ND : String(v));

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>
);
const IconId = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h4M7 13h8" /></svg>
);
const IconCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
);
const IconBank = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10 12 4l9 6" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="pitem">
      <span className="picon" aria-hidden="true">{icon}</span>
      <div>
        <div className="pitem-label">{label}</div>
        <div className="pitem-value">{value}</div>
      </div>
    </div>
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as const;
}

export default function ProfileForm({ initial, accountNumber, bankName, states }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [editing, setEditing] = useState(false);

  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [address, setAddress] = useState(initial.address ?? '');

  const [stateId, setStateId] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [parishId, setParishId] = useState('');
  const [municipalities, setMunicipalities] = useState<Option[]>([]);
  const [parishes, setParishes] = useState<Option[]>([]);

  const [verifiedEmail, setVerifiedEmail] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailChanged = email.trim() !== (profile.email ?? '');

  const loadMunicipalities = async (value: string) => {
    setStateId(value);
    setMunicipalityId('');
    setParishId('');
    setMunicipalities([]);
    setParishes([]);
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

  const requestEmailOtp = async () => {
    setError(null);
    setMessage(null);
    const target = email.trim();
    if (!target) {
      setError('Completa el correo antes de verificar.');
      return;
    }
    const { ok, data } = await postJson('/api/profile/otp-request', {
      purpose: 'EMAIL_VERIFY',
      target,
    });
    if (!ok) {
      setError((data as { message?: string }).message ?? 'No se pudo enviar el código.');
      return;
    }
    setEmailSent(true);
    setMessage('Código enviado. Revisa tu correo.');
  };

  const confirmEmailOtp = async () => {
    setError(null);
    setMessage(null);
    const { ok, data } = await postJson('/api/profile/otp-verify', {
      purpose: 'EMAIL_VERIFY',
      code: emailCode,
    });
    if (!ok) {
      setError((data as { message?: string }).message ?? 'Código inválido.');
      return;
    }
    setVerifiedEmail(true);
    setMessage('Verificado correctamente.');
  };

  const save = async () => {
    setError(null);
    setMessage(null);
    if (emailChanged && !verifiedEmail) {
      setError('Debes verificar el nuevo correo antes de guardar.');
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
      const updated = (data as { data?: Profile }).data;
      if (updated) setProfile(updated);
      setVerifiedEmail(false);
      setEmailSent(false);
      setEmailCode('');
      setEditing(false);
      setMessage('Perfil actualizado.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setStateId('');
    setMunicipalityId('');
    setParishId('');
    setMunicipalities([]);
    setParishes([]);
    setVerifiedEmail(false);
    setEmailSent(false);
    setEmailCode('');
    setError(null);
    setMessage(null);
    setEditing(false);
  };

  const localityText = profile.locality
    ? [profile.locality.state, profile.locality.municipality, profile.locality.parish]
        .filter(Boolean)
        .join(' / ')
    : ND;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">{initials(profile.fullname)}</div>
        <div className="profile-headinfo">
          <h2 className="profile-name">{profile.fullname}</h2>
          <div className="profile-sub">Cédula {profile.cedula}</div>
        </div>
        {!editing && (
          <button type="button" className="btn-sm" onClick={() => { setEditing(true); setMessage(null); setError(null); }}>
            Editar
          </button>
        )}
      </div>

      {!editing ? (
        <>
          {(message || error) && (
            <div className="profile-section" style={{ paddingBottom: 0 }}>
              {error && <div className="alert">{error}</div>}
              {message && (
                <div className="alert" style={{ background: 'var(--tone-success-bg)', color: 'var(--tone-success-fg)', borderColor: 'transparent' }}>
                  {message}
                </div>
              )}
            </div>
          )}

          <div className="profile-section">
            <h3 className="profile-section-title">Datos del asociado</h3>
            <div className="profile-grid">
              <Item icon={<IconUser />} label="Nombre completo" value={val(profile.fullname)} />
              <Item icon={<IconId />} label="Cédula" value={val(profile.cedula)} />
              <Item icon={<IconCard />} label="Número de cuenta" value={val(accountNumber)} />
              <Item icon={<IconBank />} label="Banco" value={val(bankName)} />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">Contacto y ubicación</h3>
            <div className="profile-grid">
              <Item icon={<IconMail />} label="Correo" value={val(profile.email)} />
              <Item icon={<IconPhone />} label="Teléfono" value={val(profile.phone)} />
              <Item icon={<IconPin />} label="Dirección" value={val(profile.address)} />
              <Item icon={<IconPin />} label="Localidad" value={localityText} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="profile-body">
            {error && <div className="alert">{error}</div>}
            {message && (
              <div className="alert" style={{ background: 'var(--tone-success-bg)', color: 'var(--tone-success-fg)', borderColor: 'transparent' }}>
                {message}
              </div>
            )}

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
                    <button type="button" className="btn-sm" onClick={requestEmailOtp}>
                      Enviar código al nuevo correo
                    </button>
                    {emailSent && (
                      <>
                        <input style={{ maxWidth: 120, marginBottom: 0 }} placeholder="Código" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
                        <button type="button" className="btn-sm" onClick={confirmEmailOtp}>Verificar</button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="badge badge--success">Correo verificado ✓</span>
                )}
              </div>
            )}

            <label htmlFor="pf-phone">Teléfono</label>
            <input
              id="pf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label htmlFor="pf-address">Dirección</label>
            <input
              id="pf-address"
              type="text"
              value={address}
              placeholder="Dirección de habitación"
              onChange={(e) => setAddress(e.target.value)}
            />

            <label>Localidad (opcional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <select value={stateId} onChange={(e) => loadMunicipalities(e.target.value)} style={{ marginBottom: 0 }}>
                <option value="">Estado…</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={municipalityId} onChange={(e) => loadParishes(e.target.value)} disabled={!stateId} style={{ marginBottom: 0 }}>
                <option value="">Municipio…</option>
                {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={parishId} onChange={(e) => setParishId(e.target.value)} disabled={!municipalityId} style={{ marginBottom: 0 }}>
                <option value="">Parroquia…</option>
                {parishes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>Localidad actual: {localityText}</p>
          </div>

          <div className="profile-actions">
            {emailChanged && !verifiedEmail && (
              <span className="muted" style={{ margin: '0 auto 0 0', alignSelf: 'center', fontSize: '0.85rem' }}>
                Verifica el nuevo correo para poder guardar
              </span>
            )}
            <button type="button" className="btn-ghost" onClick={cancel} disabled={saving}>Cancelar</button>
            <button
              type="button"
              className="btn-sm"
              onClick={save}
              disabled={saving || (emailChanged && !verifiedEmail)}
              title={emailChanged && !verifiedEmail ? 'Debes verificar el nuevo correo antes de guardar' : undefined}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

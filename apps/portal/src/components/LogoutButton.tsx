import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  return (
    <form
      method="POST"
      action="/api/logout"
      onSubmit={() => setLoading(true)}
    >
      <button type="submit" disabled={loading}>
        {loading ? 'Saliendo…' : 'Cerrar sesión'}
      </button>
    </form>
  );
}

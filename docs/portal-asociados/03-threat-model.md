# 03 · Threat Model — Portal del Asociado

> Metodología: STRIDE por componente + superficie de ataque. Estado: **DISEÑO (Fase 0)**.

## 1. Alcance y supuestos

- El portal es **solo consulta** salvo teléfono, email, dirección y localidad (edición acotada).
- La fuente de verdad de los datos sigue siendo el ERP (`savings.*`); el portal no los duplica.
- Autenticación: `usuario = cédula`, `contraseña inicial = cédula`, **sin cambio forzado**.
- OTP por correo electrónico vía **Resend**.
- Misma instancia PostgreSQL, esquema `portal` + rol `portal_app` de mínimo privilegio.

### Activos a proteger
1. Datos financieros y personales de cada asociado (confidencialidad e integridad).
2. Credenciales y sesiones del portal.
3. Integridad de `savings.associates` y de los saldos/movimientos (no deben corromperse desde el portal).
4. Disponibilidad del ERP (el portal **no** debe afectar cierres ni procesos pesados).

## 2. Superficie de ataque

| Superficie | Descripción |
|---|---|
| Login público | `POST /auth/login` (cédula + cédula) |
| Recuperación / OTP | `forgot-password`, `otp/request`, `otp/verify` — envío por Resend |
| Endpoints de miembro | `/me/*` |
| Edición de perfil | `PATCH /me/profile` |
| Catálogos | `/catalog/*` |
| Base de datos | Rol `portal_app`, pool separado |
| Email | Integración Resend (API key, dominio verificado) |

## 3. Modelo STRIDE

### 3.1 Spoofing (suplantación)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| S1 | Adivinar credenciales `cédula/cédula` | cédula enumerable y pública | **Lockout** tras N intentos + **CAPTCHA** + **rate limit por IP y por cuenta** + auditoría + notificación de accesos anómalos |
| S2 | Relleno de credenciales distribuido | muchos IPs | Límite global por cuenta + detección de patrones + WAF |
| S3 | Enumeración de cuentas | login/forgot responde distinto | Mensajes **genéricos** y tiempos constantes |
| S4 | Email de OTP interceptado | buzón comprometido | TTL corto (10 min), un solo uso, máx. 5 intentos, no reutilizable |

### 3.2 Tampering (manipulación)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| T1 | Cambiar `associateId`/`localityId` de otro | parámetros manipulados | `associateId` **solo desde el token**; validar `localityId` existente y coherente con el trío |
| T2 | Escalar campos no editables | body con `fullname`, `base_salary`, `status` | Allowlist estricta; `UPDATE` por **columnas** en BD |
| T3 | Inyección SQL | inputs sin validar | **Drizzle ORM** con bind de parámetros (todo el CRUD vía Drizzle, sin SQL crudo de datos) + validación zod; rol sin acceso a funciones peligrosas |
| T4 | Corromper saldos desde el portal | escritura indebida | Rol `portal_app` **sin** UPDATE en saldos/movimientos |

### 3.3 Repudiation (repudio)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| R1 | Negar una edición de datos | — | `portal.access_log` + `audit.audit_events` con IP, UA, `correlation_id` |
| R2 | Negar login | — | Registro de `LOGIN`/`LOGIN_FAILED` con contexto |

### 3.4 Information Disclosure (fuga de información)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| I1 | **IDOR**: leer datos de otro asociado | cambiar ids en `/me/prestamo/{id}` | Scoping `WHERE associate_id = token.associateId AND tenant_id = token.tenantId` + validación en detalle + **tests IDOR** |
| I2 | Fuga de tokens al navegador | tokens en JS/localStorage | **BFF**: cookie `httpOnly`; el navegador nunca ve tokens |
| I3 | Fuga por logs | PII en logs | Enmascarar cédula/email/teléfono; no loguear OTP ni contraseñas |
| I4 | Dump de BD | refresh tokens en claro | **No** se almacena el refresh en claro (solo hash) — mejora sobre el ERP |
| I5 | Cross-tenant | `x-tenant-id` manipulado | Tenant derivado del host + validación de pertenencia; en el portal el tenant viene del token |

### 3.5 Denial of Service (denegación)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| D1 | Cierre pesado del ERP degrada el portal | contención de recursos | Pool separado + `statement_timeout` + READ ONLY + paginación; **réplica de lectura** y read-model como escala |
| D2 | Abuso de OTP / login | spam de correos, fuerza bruta | Rate limit dedicado por cuenta/IP, cuotas de envío, CAPTCHA |
| D3 | Consultas costosas | paginación ausente | Límite máximo por página (≤50), índices, cache Redis del resumen |

### 3.6 Elevation of Privilege (elevación)

| ID | Amenaza | Vector | Mitigación |
|---|---|---|---|
| E1 | Asociado usa APIs/flujo de staff | token del portal en el ERP | **Realm separado**: JWT con `aud: zonastart-portal` y secretos distintos; los guards del ERP rechazan tokens del portal |
| E2 | Escalar a SQL de más privilegios | `portal_app` | Mínimo privilegio + column grants + sin `CREATE`/`TRUNCATE` |
| E3 | Reuso de refresh token | robo de refresh | Rotación + detección de reuso (`previous_refresh_token_hash`) + revocación |

## 4. Matriz de autorización (resumen)

| Recurso | Anónimo | Asociado autenticado | Staff ERP |
|---|---|---|---|
| `POST /auth/login`, `forgot-password` | ✅ | — | — |
| `/me/statement`, `/me/haberes`, `/me/retiros`, `/me/prestamos`, `/me/creditos`, `/me/historial`, `/me/movimientos`, `/me/excesos` | ❌ | ✅ (solo su data) | — |
| `/me/prestamo|credito|retiro/{id}` | ❌ | ✅ (solo si es suyo) | — |
| `PATCH /me/profile` (phone, email, localityId, address) | ❌ | ✅ | — |
| `GET /catalog/*` | ❌ | ✅ | — |
| Módulos ERP (`accounting`, `inventory`, `purchasing`, `sales`, `treasury`) | ❌ | ❌ | ✅ (según RBAC del ERP) |
| Escritura en saldos/movimientos | ❌ | ❌ | ✅ (vía ERP) |

> Decisión clave: el asociado **no** recibe ningún rol del ERP; su autorización se resuelve por
> pertenencia (token → `associateId`), no por permisos.

## 5. Controles de seguridad (checklist)

### Identidad y sesión
- [ ] Secretos dedicados: `PORTAL_JWT_SECRET`, `PORTAL_JWT_REFRESH_SECRET` (fail-closed, sin fallback).
- [ ] `aud`/`iss` propios (`zonastart-portal`); access corto (10–15 min) + refresh rotado.
- [ ] Cookie `httpOnly`, `Secure`, `SameSite=Strict` + **protección CSRF** en el BFF.
- [ ] Máx. sesiones concurrentes; revocación en cambio de contraseña y en `logout-all`.
- [ ] `deviceFingerprint` + IP + `correlation_id` por sesión.
- [ ] Contraseña nueva ≠ cédula; política de fortaleza.

### Autorización y datos
- [ ] Guard `PortalMemberGuard`: `realm=portal`, `associateId` presente, cuenta `ACTIVE`.
- [ ] Scoping obligatorio `associateId + tenantId` en toda consulta.
- [ ] Validación de pertenencia en cada detalle (`/me/prestamo|credito|retiro`).
- [ ] Rol `portal_app` con mínimo privilegio y `UPDATE` por columnas.
- [ ] Lecturas en transacción `READ ONLY` + `statement_timeout`.

### Aplicación / infraestructura
- [ ] Helmet: HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
- [ ] CORS estricto por origen del tenant (subdominio/dominio personalizado).
- [ ] Rate limiting global + específico (login, OTP, perfil).
- [ ] Auditoría completa (login, lecturas sensibles, ediciones, cambios de contraseña).
- [ ] Minimización y enmascaramiento de PII en respuestas y logs.
- [ ] Secrets en gestor (no en repo); rotación periódica; backups cifrados; TLS extremo a extremo.
- [ ] `RUN` de pruebas IDOR y de reuso de tokens en CI.

### Email (Resend)
- [ ] Dominio remitente verificado con **SPF + DKIM + DMARC**.
- [ ] `RESEND_API_KEY` en gestor de secretos; nunca en el cliente.
- [ ] Plantillas sin datos sensibles más allá de lo mínimo (código OTP y contexto).
- [ ] Cuotas y reintentos vía `portal.email_log` + backoff.
- [ ] Respuesta genérica en `forgot-password`/`otp/request` (no revelar si existe la cuenta).
- [ ] TTL del OTP (10 min), un solo uso, máx. 5 intentos, invalidar anteriores del mismo `purpose`.

## 6. Riesgos residuales aceptados (con justificación)

| Riesgo | Motivo | Compensación |
|---|---|---|
| Contraña inicial = cédula adivinable | decisión de negocio (sin cambio forzado) | lockout + CAPTCHA + rate limit + auditoría + recomendación de cambio en el dashboard |
| Sin MFA | alcance fase 1 | OTP disponible para acciones sensibles; MFA planificable como fase futura |
| Cédula como username | decisión de negocio | enumerable, pero impacto mitigado por controles de acceso |

## 7. Plan de pruebas de seguridad (Fase 6)

1. **IDOR**: intentar leer `/me/prestamo/{id}` de otro asociado → 404.
2. **Fuerza bruta**: superar umbrales → lockout + CAPTCHA; verificar auditoría.
3. **Reuso de refresh**: reusar un refresh rotado → revocación + 401.
4. **Replay de OTP**: reusar código consumido → 400.
5. **Validación de allowlist**: enviar campos no editables → 403/ignorados.
6. **Cross-tenant**: token de un tenant contra host de otro → rechazado.
7. **Contención**: ejecutar un cierre pesado y verificar que el portal responde dentro del SLO.
8. **Headers/CORS/CSRF**: verificación automatizada.

## 8. Referencias

- ERD y modelo: [`01-modelo-datos.md`](./01-modelo-datos.md)
- DDL: [`ddl/portal-schema.sql`](./ddl/portal-schema.sql)
- Permisos: [`ddl/portal-role-grants.sql`](./ddl/portal-role-grants.sql)
- API: [`02-api-openapi.yaml`](./02-api-openapi.yaml)

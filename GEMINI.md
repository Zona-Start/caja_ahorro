Responde siempre en español

## Contexto del Proyecto: Sistema de Gestión de Caja de Ahorro

Este proyecto es un sistema integral para la gestión de una caja de ahorro, diseñado para manejar las operaciones financieras y administrativas clave. A continuación, se detalla la estructura de la base de datos y la funcionalidad principal que soporta:

**Módulos Principales:**

1.  **Núcleo del Sistema (Esquema `core`):**
    - **Gestión de la Compañía:** Almacena la información de la caja de ahorro, incluyendo datos de contacto y fiscales.
    - **Configuraciones del Sistema:** Gestiona parámetros globales como la moneda principal, tasas de interés, y otros valores configurables.
    - **Gestión de Ubicaciones:** Define la estructura geográfica (estados, municipios, parroquias).
    - **Tipos y Categorías:** Permite la creación de clasificaciones personalizadas para diferentes entidades como tipos de nómina, tipos de trabajador, etc.

2.  **Autenticación y Autorización (Esquema `auth`):**
    - **Gestión de Usuarios, Roles y Permisos:** Controla el acceso al sistema con un sistema robusto de usuarios, roles y permisos granulares.
    - **Sesiones y Verificación:** Maneja las sesiones de usuario y la verificación de correo electrónico.

3.  **Contabilidad (Esquema `accounting`):**
    - **Plan de Cuentas:** Define la estructura contable jerárquica de la caja de ahorro.
    - **Ciclos Contables:** Gestiona los períodos contables (apertura, cierre).
    - **Asientos Contables:** Registra todas las transacciones contables con su detalle de débitos y créditos.
    - **Configuración Contable:** Permite parametrizar los asientos contables para diferentes tipos de operaciones.

4.  **Caja de Ahorro (Esquema `savings_banks`):**
    - **Gestión de Asociados:** Almacena la información detallada de los miembros de la caja de ahorro.
    - **Cuentas de Asociados:** Maneja las cuentas individuales de ahorro y aportes de los asociados.
    - **Movimientos de Cuentas:** Registra todos los movimientos (depósitos, retiros, etc.) en las cuentas de los asociados.
    - **Préstamos y Créditos:** Gestiona el ciclo de vida completo de los préstamos y créditos, desde la solicitud hasta la amortización y el pago.
    - **Liquidaciones y Retiros:** Maneja los procesos de retiro de haberes y liquidación de asociados.

5.  **Banca (Esquema `banking`):**
    - **Directorio de Bancos:** Mantiene un registro de las entidades bancarias con las que opera la caja de ahorro.
    - **Cuentas Bancarias:** Gestiona las cuentas bancarias propias de la caja de ahorro.
    - **Transacciones y Conciliación:** Permite registrar y conciliar los movimientos bancarios.

6.  **Administración (Esquema `administration`):**
    - **Proveedores y Cuentas por Pagar:** Gestiona la información de los proveedores y las facturas pendientes de pago.
    - **Gestión de Compras:** Permite registrar órdenes de compra y los ítems adquiridos.
    - **Inventario:**
      - **Productos y Servicios:** Define los productos y servicios que ofrece la caja de ahorro.
      - **Activos Fijos:** Gestiona los activos fijos de la organización.
      - **Movimientos de Inventario:** Registra las entradas, salidas y ajustes de inventario.

7.  **Auditoría (Esquema `audit`):**
    - **Logs de Actividad y Auditoría:** Registra todos los eventos importantes del sistema, incluyendo cambios en los datos y acciones de los usuarios, para garantizar la trazabilidad y seguridad.

En resumen, el sistema está diseñado para ser una solución completa y robusta para la administración de una caja de ahorro, cubriendo desde la gestión de asociados y sus operaciones financieras hasta la contabilidad, la banca, el inventario y la auditoría.

## Estructura de Módulos Backend (NestJS)

Para crear o modificar módulos en el backend, es fundamental seguir la estructura existente para mantener la coherencia y la escalabilidad del proyecto. Antes de cualquier modificación, **siempre debes leer el esquema de la base de datos** en `apps/api/src/database/schema/` para entender cómo se estructuran los datos.

La estructura de los módulos se encuentra en `apps/api/src/features/` y sigue un patrón de módulos y submódulos.

### Estructura de un Módulo

Cada módulo principal (ej. `administration`) puede contener varios submódulos (ej. `suppliers`). La estructura interna de un submódulo es la siguiente:

- **`dto/`**: Contiene los Data Transfer Objects (DTOs), que definen la forma de los datos para las solicitudes y respuestas de la API.
- **`entities/`**: Contiene las entidades que representan las tablas de la base de datos.
- **`*.controller.ts`**: El controlador de NestJS, que define las rutas y los endpoints de la API.
- **`*.module.ts`**: El módulo de NestJS, que agrupa el controlador, el servicio y otras dependencias.
- **`*.service.ts`**: El servicio de NestJS, que contiene la lógica de negocio.

### Patrón de Ejemplo: Módulo `suppliers`

El módulo `suppliers` dentro de `administration` es un buen ejemplo a seguir:

`apps/api/src/features/administration/suppliers/`

- `dto/create-supplier.dto.ts`
- `dto/update-supplier.dto.ts`
- `entities/supplier.entity.ts`
- `suppliers.controller.ts`
- `suppliers.module.ts`
- `suppliers.service.ts`

Al crear un nuevo módulo, replica esta estructura para asegurar que el código sea consistente, mantenible y fácil de entender.

## Estructura de Módulos Frontend

Para crear un nuevo módulo en el frontend, sigue la siguiente estructura de directorios dentro de `apps/web/feactures/`:

`apps/web/feactures/<nombre-del-modulo>/<nombre-del-sub-modulo>/`

Cada sub-módulo debe contener las siguientes carpetas:

- **actions**: Contiene las acciones del servidor para interactuar con la API.
- **components**: Contiene los componentes de React.
  - **tables**: Contiene los componentes relacionados con las tablas de datos (`columns.tsx`, `cell-action.tsx`, etc.).
- **hooks**: Contiene los hooks de React Query para el manejo de datos (`use-query-<...>`, `use-mutation-<...>`).
- **schemas**: Contiene los esquemas de Zod para la validación de datos de la API y formularios.
- **utils**: Contiene funciones de utilidad, como `searchparams.ts`.

**Ejemplo:**

Para un nuevo módulo de "clientes", la estructura sería:

`apps/web/feactures/customers/clients/`

Y dentro de `clients` irían las carpetas `actions`, `components`, `hooks`, `schemas` y `utils`.

## Interacción con la API Backend

La aplicación frontend consume datos de una API de NestJS. La lógica de negocio del backend está organizada en módulos dentro del directorio `/apps/api/src/features/`.

Para interactuar con la API, es crucial entender las rutas y los tipos de datos esperados. Debes analizar los siguientes archivos dentro de cada módulo del backend (`/apps/api/src/features/<nombre-del-modulo>/`):

1.  **Controladores (`*.controller.ts`):** Lee estos archivos para identificar las rutas de la API, los métodos HTTP (GET, POST, PATCH, DELETE), los parámetros de ruta (`@Param`), los parámetros de consulta (`@Query`) y los cuerpos de las solicitudes (`@Body`).
2.  **DTOs (Data Transfer Objects) (`dto/*.dto.ts`):** Analiza estos archivos para comprender la estructura y las validaciones de los datos que se envían en las solicitudes (payloads).
3.  **Entidades (`entities/*.entity.ts`):** Revisa estos archivos para conocer la estructura de los datos que la API devuelve en sus respuestas.

Al comprender estos tres componentes, podrás construir las `actions` y los esquemas de Zod (`schemas`) en el frontend de manera correcta y consistente con la API.

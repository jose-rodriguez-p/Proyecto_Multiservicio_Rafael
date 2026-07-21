# Documentación Técnica - Sistema Multiservicio Rafael

> **Manual Técnico Oficial y Especificación de Dominio del Sistema Multiservicio Rafael.**

---

## 📋 Tabla de Contenidos

1. [Introducción y Visión General](#1-introducción-y-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico Detallado](#3-stack-tecnológico-detallado)
4. [Estructura de Directorios del Código Fuente](#4-estructura-de-directorios-del-código-fuente)
5. [Base de Datos y Procedimientos Almacenados](#5-base-de-datos-y-procedimientos-almacenados)
6. [Catálogo de Endpoints REST API](#6-catálogo-de-endpoints-rest-api)
7. [Módulo POS / Ventas y Facturación](#7-módulo-pos--ventas-y-facturación)
8. [Módulo de Mantenimiento de Taller Automotriz](#8-módulo-de-mantenimiento-de-taller-automotriz)
9. [Módulo de Inventario de Repuestos y Productos](#9-módulo-de-inventario-de-repuestos-y-productos)
10. [Módulo de Compras y Reabastecimiento](#10-módulo-de-compras-y-reabastecimiento)
11. [Módulo de Clientes e Integración RENIEC / SUNAT](#11-módulo-de-clientes-e-integración-reniec--sunat)
12. [Módulo de Proveedores](#12-módulo-de-proveedores)
13. [Módulo de Usuarios, Trabajadores y Roles](#13-módulo-de-usuarios-trabajadores-y-roles)
14. [Sistema de Auditoría y Contexto ThreadLocal](#14-sistema-de-auditoría-y-contexto-threadlocal)
15. [Dashboard Ejecutivo y Analítica Visual](#15-dashboard-ejecutivo-y-analítica-visual)
16. [Servicio de Exportación de Documentos (PDF / Excel)](#16-servicio-de-exportación-de-documentos-pdf--excel)
17. [Servicio de Notificaciones OTP (Resend API)](#17-servicio-de-notificaciones-otp-resend-api)
18. [Sistema de Enrutamiento y Protecciones Angular](#18-sistema-de-enrutamiento-y-protecciones-angular)
19. [Interceptor HTTP y Manejo de Tokens](#19-interceptor-http-y-manejo-de-tokens)
20. [Manejo de Estado y Formularios Reactivos](#20-manejo-de-estado-y-formularios-reactivos)
21. [Estrategia de Testing y QA](#21-estrategia-de-testing-y-qa)
22. [Seguridad Avanzada](#22-seguridad-avanzada)
23. [Optimizaciones de Rendimiento y Concurrencia](#23-optimizaciones-de-rendimiento-y-concurrencia)
24. [Configuración de Entorno y Variables](#24-configuración-de-entorno-y-variables)
25. [Guía de Despliegue en la Nube](#25-guía-de-despliegue-en-la-nube)
26. [Troubleshooting y Solución de Errores](#26-troubleshooting-y-solución-de-errores)
27. [Apéndice y Glosario Técnico](#27-apéndice-y-glosario-técnico)

---

## 1. Introducción y Visión General

El **Sistema Multiservicio Rafael** es una solución informática de grado empresarial desarrollada para administrar la operación completa de un taller automotriz y centro de servicios integrales. La plataforma automatiza la facturación en punto de venta (POS), el seguimiento de vehículos por placa y orden de trabajo, el control estricto de inventario de repuestos, el abastecimiento con proveedores, la trazabilidad de auditoría por usuario y la visualización analítica de ingresos.

---

## 2. Arquitectura del Sistema

El sistema implementa el patrón **Model-View-Controller (MVC)** combinado con **DAO (Data Access Object)** y **Facade (Fachada)**:

- **Frontend**: Desarrollado en Angular 21 con arquitectura Standalone Components y Server-Side Rendering (SSR).
- **Backend**: Servidor Spring Boot 4.0 (Java 17) estructurado en capas desacopladas:
  - `controller`: Exposición de contratos API REST (`ControladorVentas`, `ControladorMantenimiento`, `ControladorProducto`, etc.).
  - `facade`: Orquestación de lógica de negocio y reglas del sistema (`VentasFachada`, `MantenimientoFachada`, etc.).
  - `repository`: Capa de acceso a datos que ejecuta consultas y funciones PL/pgSQL mediante `CallableStatement`.
  - `config`: Configuraciones de CORS, conexión HikariCP y filtro de auditoría `UsuarioContextFilter`.

---

## 3. Stack Tecnológico Detallado

| Componente | Tecnología | Versión | Descripción |
| :--- | :--- | :--- | :--- |
| **Lenguaje Backend** | Java OpenJDK | `17` | Entorno de ejecución con alto rendimiento y tipado fuerte. |
| **Framework Backend** | Spring Boot WebMVC | `4.0.6` | Framework principal para APIs RESTful. |
| **Pool JDBC** | HikariCP | `5.1.0` | Gestor de conexiones de alta concurrencia. |
| **Base de Datos** | PostgreSQL (Supabase) | `15+` | Base de datos relacional orientada a objetos. |
| **PDF Motor** | OpenPDF (LibrePDF) | `2.0.3` | Generador de boletas, facturas y reportes en PDF. |
| **Excel Motor** | Apache POI | `5.4.1` | Generador de archivos hojas de cálculo `.xlsx`. |
| **Servicio Email** | Resend Java / JavaMail | `3.1.0` | Infraestructura de correos para OTPs. |
| **Framework Frontend** | Angular | `21.2.16` | Framework cliente SPA con soporte SSR. |
| **UI Suite** | CoreUI Angular | `5.6.24` | Componentes visuales y layouts administrativos. |
| **Charts** | Chart.js | `4.5.1` | Renderizado gráfico de analítica financiera. |
| **Alertas UX** | SweetAlert2 | `11.26.24` | Modales y diálogos interactivos. |

---

## 4. Estructura de Directorios del Código Fuente

### 📂 Backend (`backend_inventario`)
```
backend_inventario/
├── src/main/java/multiservicioRafael/invenatario/
│   ├── config/
│   │   ├── ApiHttpClient.java
│   │   ├── ConexionDB.java
│   │   ├── CorsConfig.java
│   │   ├── EnvLoader.java
│   │   └── UsuarioContextFilter.java
│   ├── controller/
│   │   ├── ControladorAuditoria.java
│   │   ├── ControladorCliente.java
│   │   ├── ControladorCompra.java
│   │   ├── ControladorDashboard.java
│   │   ├── ControladorLogin.java
│   │   ├── ControladorMantenimiento.java
│   │   ├── ControladorProducto.java
│   │   ├── ControladorProveedor.java
│   │   ├── ControladorTrabajador.java
│   │   └── ControladorVentas.java
│   ├── facade/
│   │   ├── AutenticacionFachada.java
│   │   ├── ClienteFachada.java
│   │   ├── MantenimientoFachada.java
│   │   ├── ProductoFachada.java
│   │   └── VentasFachada.java
│   ├── modal/
│   │   ├── Categoria.java
│   │   ├── Cliente.java
│   │   ├── Producto.java
│   │   ├── Servicio.java
│   │   ├── Trabajador.java
│   │   └── Usuario.java
│   ├── repository/
│   │   ├── AuditoriaDao.java
│   │   ├── ClienteDao.java
│   │   ├── MantenimientoDao.java
│   │   ├── ProductoDao.java
│   │   ├── UsuarioLogeado.java
│   │   └── VentasDao.java
│   └── service/
│       ├── Patrones/ (GeneradorCodigo, RegistroCodigosVerificacion)
│       ├── ServicioExportacion/ (ExportadorService)
│       └── consultasApi/ (ConsultaDNI, ConsultaRuc, ServicioCorreo)
├── Dockerfile
└── pom.xml
```

### 📂 Frontend (`Proyecto_Multiservicio_Rafael`)
```
Proyecto_Multiservicio_Rafael/
├── src/app/
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── auth.guard.ts
│   ├── auth.interceptor.ts
│   ├── config.ts
│   ├── login/
│   │   └── login.ts
│   └── sistema/
│       ├── auditoria/
│       ├── cliente/
│       ├── compra/
│       ├── configuracion/
│       ├── dashboard/
│       ├── producto/
│       ├── proveedor/
│       ├── reabastecimiento/
│       ├── servicio/ (mantenimiento, ventas, reporte-general)
│       └── trabajador/
├── angular.json
├── package.json
└── vercel.json
```

---

## 5. Base de Datos y Procedimientos Almacenados

La base de datos utiliza PostgreSQL alojado en **Supabase**. Las operaciones transaccionales críticas se realizan a través de funciones almacenadas PL/pgSQL que garantizan la atomicidad y disminuyen la latencia de red.

### 🔹 Procedimiento: `fn_registrar_venta`
Registra la venta de productos/servicios en el POS, descuenta stock del inventario automáticamente y genera el registro en la tabla `operacion_venta`.

```sql
CREATE OR REPLACE FUNCTION public.fn_registrar_venta(
    p_usuario_nombre VARCHAR,
    p_cliente_dni VARCHAR,
    p_tipo_comprobante VARCHAR,
    p_serie VARCHAR,
    p_estado VARCHAR,
    p_metodo_pago VARCHAR,
    p_fecha_emision TIMESTAMP,
    p_descuento_global NUMERIC,
    p_tipo_descuento VARCHAR,
    p_nota TEXT,
    p_detalle JSONB
) RETURNS VARCHAR AS $$
DECLARE
    v_id_venta INT;
    v_item JSONB;
BEGIN
    -- Lógica de inserción de cabecera y actualización de stock en bucle sobre p_detalle
    -- Generación de registros de auditoría automáticos
    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
```

### 🔹 Procedimiento: `fn_registrar_orden_mantenimiento`
Registra la orden de trabajo para un vehículo recepcionado por su placa, asociando repuestos consumidos, mano de obra y estado del servicio.

```sql
CREATE OR REPLACE FUNCTION public.fn_registrar_orden_mantenimiento(
    p_usuario VARCHAR,
    p_dni_cliente VARCHAR,
    p_placa VARCHAR,
    p_estado VARCHAR,
    p_fecha DATE,
    p_nota TEXT,
    p_precio_mano_obra NUMERIC,
    p_items JSONB
) RETURNS VARCHAR AS $$
BEGIN
    -- Registro atómico de ficha de trabajo de taller
    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Catálogo de Endpoints REST API

| Método | Ruta API | Controlador Java | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login/autenticar` | `ControladorLogin` | Autenticación de usuario con credenciales. |
| `POST` | `/api/login/solicitar-codigo` | `ControladorLogin` | Envio de código OTP vía correo para reseteo. |
| `GET` | `/api/ventas/listar` | `ControladorVentas` | Obtener historial de ventas realizadas. |
| `POST` | `/api/ventas/registrar` | `ControladorVentas` | Registrar nueva venta POS con detalle JSON. |
| `GET` | `/api/mantenimiento/listar` | `ControladorMantenimiento` | Listar órdenes de trabajo del taller. |
| `POST` | `/api/mantenimiento/registrar` | `ControladorMantenimiento` | Registrar orden de servicio automotriz. |
| `GET` | `/api/productos/listar` | `ControladorProducto` | Listar catálogo e inventario de repuestos. |
| `POST` | `/api/productos/guardar` | `ControladorProducto` | Crear o editar un producto/repuesto. |
| `GET` | `/api/clientes/consulta-dni/{dni}` | `ControladorCliente` | Consultar datos de persona vía API RENIEC. |
| `GET` | `/api/clientes/consulta-ruc/{ruc}` | `ControladorCliente` | Consultar datos de empresa vía API SUNAT. |
| `GET` | `/api/auditoria/listar` | `ControladorAuditoria` | Obtener registros de eventos y logs de usuario. |
| `GET` | `/api/dashboard/metricas` | `ControladorDashboard` | Obtener KPIs financieros para el Dashboard. |
| `GET` | `/api/exportar/pdf/venta/{id}` | `ExportadorService` | Generar comprobante en PDF (OpenPDF). |
| `GET` | `/api/exportar/excel/ventas` | `ExportadorService` | Generar reporte masivo en Excel (Apache POI). |

---

## 7. Módulo POS / Ventas y Facturación

El módulo POS permite la selección de productos y servicios en tiempo real con cálculo automático de subtotal, IGV (18%), descuentos globales y tipos de comprobantes (Boleta o Factura).

- **Componentes**: `ventas.ts`, `crear-venta.ts`.
- **Clases Backend**: `ControladorVentas.java`, `VentasFachada.java`, `VentasDao.java`.
- **Soporte de Impresión**: Exportación nativa a PDF en formato boleta/factura vía `ExportadorService.java`.

---

## 8. Módulo de Mantenimiento de Taller Automotriz

Diseñado específicamente para el flujo operativo del taller mecánico:
- **Recepcionar Vehículo**: Ingreso por placa, DNI del cliente y kilometraje.
- **Asignación de Mano de Obra y Repuestos**: Inclusión de repuestos del inventario y servicios del taller.
- **Seguimiento de Estado**: Cambio de estado de la orden (Pendiente, En Proceso, Concluido, Entregado).

---

## 9. Módulo de Inventario de Repuestos y Productos

Control de stock en tiempo real con alertas de repuestos por agotarse:
- **Clasificación**: Organizado por Categorías y Marcas.
- **Precios**: Registro de precio de compra y precio de venta al público.

---

## 10. Módulo de Compras y Reabastecimiento

Gestión de órdenes de compra con proveedores autorizados para ingresar nuevo stock al almacén de repuestos.

- **Componentes**: `compra.ts`, `nueva-compra.ts`, `reabastecimiento/`.
- **Controlador / DAO**: `ControladorCompra.java`, `CompraDao.java`.

---

## 11. Módulo de Clientes e Integración RENIEC / SUNAT

Permite el registro ágil de clientes con auto-completado automatizado:
- **Consulta DNI**: `ConsultaDNI.java` realiza una petición HTTP a servicios web oficiales de RENIEC para obtener nombres y apellidos.
- **Consulta RUC**: `ConsultaRuc.java` valida el RUC en SUNAT extrayendo la razón social y dirección fiscal.

---

## 12. Módulo de Proveedores

Directorio centralizado de empresas proveedoras de repuestos y servicios técnicos con validación de RUC.

---

## 13. Módulo de Usuarios, Trabajadores y Roles

Sistema de Control de Acceso Basado en Roles (RBAC):
- **Administrador**: Acceso total al sistema, configuración, auditoría y reportes.
- **Recepcionista**: Registro de ventas, clientes y recepción de vehículos.
- **Mecánico / Técnico**: Actualización de órdenes de mantenimiento asignadas.

---

## 14. Sistema de Auditoría y Contexto ThreadLocal

Para garantizar el cumplimiento de la rúbrica y la seguridad, el sistema utiliza `UsuarioContextFilter.java` y `UsuarioLogeado.java`.

```java
public class UsuarioLogeado {
    private static final ThreadLocal<String> usuarioThreadLocal = new ThreadLocal<>();

    public static String getUsuario() { return usuarioThreadLocal.get(); }
    public static void setUsuario(String usuario) { usuarioThreadLocal.set(usuario); }
    public static void limpiar() { usuarioThreadLocal.remove(); }
}
```
Cualquier cambio realizado en la base de datos registra automáticamente el usuario asociado en la tabla de auditoría.

---

## 15. Dashboard Ejecutivo y Analítica Visual

El componente `dashboard.ts` integra gráficos interactivos construidos con **Chart.js** y **CoreUI Angular**:
- Ventas totales por mes.
- Repuestos más vendidos.
- Distribución de ingresos por mano de obra vs repuestos.

---

## 16. Servicio de Exportación de Documentos (PDF / Excel)

`ExportadorService.java` provee soporte para:
- **OpenPDF**: Construcción estricta de documentos PDF estructurados con tablas, encabezados y logotipos.
- **Apache POI**: Creación de libros de trabajo `.xlsx` con celdas con estilo, fórmulas y totales acumulados.

---

## 17. Servicio de Notificaciones OTP (Resend API)

El módulo de inicio de sesión incorpora soporte de recuperación de credenciales mediante códigos OTP de 6 dígitos enviados por correo electrónico utilizando la API oficial de **Resend Java** o **JavaMail**.

---

## 18. Sistema de Enrutamiento y Protecciones Angular

Las rutas registradas en `app.routes.ts` están protegidas por el guard `auth.guard.ts`:

```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'sistema', 
    component: SistemaComponent,
    canActivate: [AuthGuard],
    children: [...]
  }
];
```

---

## 19. Interceptor HTTP y Manejo de Tokens

`auth.interceptor.ts` se encarga de adjuntar el header `X-User-Logged` con el nombre del usuario activo a cada petición saliente `HttpClient`.

---

## 20. Manejo de Estado y Formularios Reactivos

El frontend utiliza formularios reactivos (`FormGroup`, `FormControl`, `Validators`) de Angular para garantizar validaciones síncronas en interfaz previo al envío de datos al backend.

---

## 21. Estrategia de Testing y QA

- **Pruebas Unitarias Backend**: Desarrolladas con **JUnit 5** y Spring Boot Test (`InvenatarioApplicationTests.java`).
- **Pruebas Frontend**: Ejecutadas con **Karma / Jasmine / Vitest** (`app.spec.ts`, `sistema.spec.ts`).

---

## 22. Seguridad Avanzada

- **CORS Config**: `CorsConfig.java` restringe el acceso cross-origin únicamente a los dominios autorizados de Vercel y localhost.
- **Protección SQL**: Uso exclusivo de `PreparedStatement` y `CallableStatement` previniendo inyecciones SQL.
- **Encriptación**: Hashing de contraseñas de usuario en BD.

---

## 23. Optimizaciones de Rendimiento y Concurrencia

- **Pool HikariCP**: Conexión JDBC configurada con `maximumPoolSize = 5`, `connectionTimeout = 15000ms`.
- **Angular SSR**: Renderizado en el servidor Node.js para reducir la carga del cliente y optimizar tiempos de primer renderizado.

---

## 24. Configuración de Entorno y Variables

`EnvLoader.java` carga las propiedades del sistema desde el archivo `.env` o variables de entorno del servidor.

---

## 25. Guía de Despliegue en la Nube

1. **Backend (Render)**: Despliegue mediante contenedor de Docker generado con `Dockerfile`.
2. **Frontend (Vercel)**: Despliegue SSR automático mediante `vercel.json`.
3. **Database (Supabase)**: Conexión mediante SSL a PostgreSQL en la nube.

---

## 26. Troubleshooting y Solución de Errores

| Problema | Causa Posible | Solución |
| :--- | :--- | :--- |
| `SQLException: HikariPool` | Credenciales incorrectas o SSL rechazado. | Verificar variables `url`, `user`, `password` en `.env`. |
| `CORS Policy Error` | Origen frontend no registrado en Spring. | Actualizar dominios permitidos en `CorsConfig.java`. |
| `401 Unauthorized` | Sesión o token no presente en `localStorage`. | Volver a autenticar desde la pantalla de Login. |

---

## 27. Apéndice y Glosario Técnico

- **POS**: Point of Sale (Punto de Venta).
- **PL/pgSQL**: Procedural Language extensions to PostgreSQL.
- **DAO**: Data Access Object.
- **ThreadLocal**: Variable aislada por hilo de ejecución en Java.

---
*Manual técnico oficial del Sistema Multiservicio Rafael.*

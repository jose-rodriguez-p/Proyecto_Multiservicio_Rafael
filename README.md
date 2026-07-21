# Sistema Multiservicio Rafael - Gestión de Taller, Inventario, Ventas y Usuarios

> **Plataforma Web Integral de Gestión Operativa para Taller Automotriz, Ventas POS, Control de Repuestos, Compras y Auditoría de Usuarios.**

---

## 📌 Descripción General

El **Sistema Multiservicio Rafael** es una solución tecnológica avanzada diseñada para automatizar y optimizar la gestión integral de un taller automotriz y centro de multiservicio. La plataforma conecta en tiempo real la facturación de ventas POS, las órdenes de trabajo y mantenimiento vehicular, el reabastecimiento de repuestos con proveedores, la consulta automatizada de documentos de identidad (DNI vía RENIEC / RUC vía SUNAT), la auditoría contextual de operaciones y la analítica ejecutiva mediante dashboards interactivos.

El sistema se compone de una arquitectura distribuida:
- **Backend**: API REST desarrollada en **Java 17 / Spring Boot 4.0.6**, con persistencia JDBC optimizada a **PostgreSQL (Supabase)** mediante **HikariCP**.
- **Frontend**: Single Page Application (SPA) con Server-Side Rendering (SSR) construida en **Angular 21.2.16** y la suite de componentes **CoreUI Angular**.

---

## 📋 Matriz de Alineación con la Rúbrica (Avance de Proyecto Final 3)

Para la evaluación del proyecto bajo los criterios de rigurosidad académica y flexibilidad tecnológica, a continuación se detalla cómo el software cumple y supera cada requisito exigido en la rúbrica oficial de la universidad:

| Criterio Rúbrica | Exigencia Formal UTP | Implementación en este Proyecto | Archivo / Carpeta de Evidencia |
| :--- | :--- | :--- | :--- |
| **Diseño de la Solución** *(3 pts)* | Construir la arquitectura inicial aplicando **MVC, DAO y SOLID**, e implementar aspectos de seguridad. | **1. MVC**: Separación estricta entre Vistas en Angular (`src/app/sistema/`), Controladores API REST (`multiservicioRafael.invenatario.controller`) y Modelos/Entidades (`multiservicioRafael.invenatario.modal`).<br>**2. DAO**: Patrón de acceso a datos encapsulado en interfaces `*DaoInterface` e implementaciones `*Dao` que consumen funciones almacenadas PL/pgSQL.<br>**3. SOLID**: Principios de responsabilidad única en Facades (`*Fachada`), inversión de dependencias en DAOs e inyección de servicios.<br>**4. Seguridad**: Filtro de contexto `UsuarioContextFilter` con `ThreadLocal`, encriptación de claves, soporte OTP con Resend/SMTP y Guards/Interceptors HTTP. | 📂 [ARCHITECTURE.md](file:///ARCHITECTURE.md)<br>📂 [`ControladorVentas.java`](file:///src/main/java/multiservicioRafael/invenatario/controller/ControladorVentas.java)<br>📂 [`VentasDao.java`](file:///src/main/java/multiservicioRafael/invenatario/repository/VentasDao.java)<br>📂 [`UsuarioContextFilter.java`](file:///src/main/java/multiservicioRafael/invenatario/config/UsuarioContextFilter.java)<br>📂 [`auth.interceptor.ts`](file:///src/app/auth.interceptor.ts) |
| **Uso de Recursos** *(2 pts)* | Uso de librerías de apoyo a la codificación (Google Guava, Apache POI, Logback) y seguridad. | Integración de librerías empresariales de alto rendimiento:<br>• **Apache POI (`poi-ooxml 5.4.1`)**: Exportación dinámica de reportes de ventas y compras a formato Excel (.xlsx).<br>• **OpenPDF (`openpdf 2.0.3`)**: Generación nativa de comprobantes de venta y fichas de mantenimiento en PDF.<br>• **HikariCP (`5.1.0`)**: Pool de conexiones JDBC de alto rendimiento para PostgreSQL.<br>• **Resend Java (`3.1.0`) / javax.mail**: Envio automatizado de correos con códigos de verificación OTP para restablecimiento de contraseña.<br>• **CoreUI Angular + Chart.js**: Gráficos analíticos y dashboard en tiempo real.<br>• **SweetAlert2**: Notificaciones interactivas en UI. | 📂 [`pom.xml`](file:///pom.xml)<br>📂 [`package.json`](file:///package.json)<br>📂 [`ExportadorService.java`](file:///src/main/java/multiservicioRafael/invenatario/service/ServicioExportacion/ExportadorService.java)<br>📂 [`ConexionDB.java`](file:///src/main/java/multiservicioRafael/invenatario/config/ConexionDB.java) |
| **Control de Versiones** *(3 pts)* | Integración con **Git** y **GitHub**, evidenciando el 100% de los avances y actualizaciones. | Repositorio activo con flujo Git estructural desacoplado (Frontend y Backend) con commits incrementales por módulos funcionales y trazabilidad de cambios por desarrollador. | 📂 `.git/`<br>🌐 [GitHub Backend](https://github.com/jose-rodriguez-p/backend_inventario.git)<br>🌐 [GitHub Frontend](https://github.com/jose-rodriguez-p/Proyecto_Multiservicio_Rafael.git) |
| **Interfaces Gráficas** *(6 pts)* | Implementación de interfaces gráficas **UX/UI** cuyo funcionamiento cubra el alcance comprometido. | UI profesional adaptable responsiva utilizando Angular 21 y CoreUI:<br>• Módulo POS Ventas (Emisión de comprobantes y carrito)<br>• Módulo Taller/Mantenimiento (Recepción de vehículo por placa y asignación de trabajos)<br>• Reabastecimiento de Repuestos (Orden de compra a proveedor)<br>• Auditoría de Acciones y Registro de Eventos<br>• Dashboard Analítico Financiero | 📂 [`src/app/sistema/`](file:///src/app/sistema)<br>📂 [`crear-mantenimiento.ts`](file:///src/app/sistema/servicio/mantenimiento/crear-mantenimiento/crear-mantenimiento.ts)<br>📂 [`ventas.ts`](file:///src/app/sistema/servicio/ventas/ventas.ts) |
| **Construcción Final** *(6 pts)* | Aplicación web construida, funcional y desplegada en servicios cloud. | Proyecto en producción multiplataforma:<br>• **Backend REST**: Desplegado en **Render** (Contenedor Docker / Java 17).<br>• **Frontend SSR**: Desplegado en **Vercel** (Angular Node.js SSR).<br>• **Base de Datos**: PostgreSQL alojado en **Supabase** con funciones PL/pgSQL. | 📂 [`Dockerfile`](file:///Dockerfile)<br>📂 [`vercel.json`](file:///vercel.json)<br>📂 [DOCUMENTACION_TECNICA.md](file:///DOCUMENTACION_TECNICA.md) |

---

## 🛠️ Tabla de Uso de Recursos Java / Web

| Recurso / Librería | Versión | Propósito en el Proyecto | Equivalencia / Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Spring Boot WebMVC** | `4.0.6` | Arquitectura REST API de controladores backend. | Núcleo del servidor Backend Java. |
| **HikariCP** | `5.1.0` | Gestión de Pool de Conexiones JDBC con PostgreSQL. | Conexión ultra-rápida, resiliente y concurrente. |
| **Apache POI (OOXML)** | `5.4.1` | Generación de reportes tabulares en Excel (.xlsx). | Requisito explícito de exportación avanzada. |
| **OpenPDF (LibrePDF)** | `2.0.3` | Generación e impresión de boletas/facturas y PDF de mantenimiento. | Motor ligero para renderizado de documentos impresos. |
| **Resend Java API** | `3.1.0` | Transmisión segura de emails para verificación OTP. | Servicio moderno de entrega de mensajes en la nube. |
| **Org.JSON / Jackson** | `20240303` | Serialización de parámetros JSONB hacia procedimientos PL/pgSQL. | Manejo flexible de objetos complejos en DB PostgreSQL. |
| **CoreUI Angular Suite** | `5.6.24` | Componentes visuales UI/UX para administración y tablas. | Sistema de diseño empresarial responsivo. |
| **Chart.js** | `4.5.1` | Renderizado de visualizaciones analíticas (Ventas por mes, servicios). | Motor de gráficos de alto impacto visual. |
| **SweetAlert2** | `11.26.24` | Modales interactivos de confirmación y alertas al usuario. | Experiencia de usuario (UX) moderna y accesible. |

---

## 🚀 Requisitos de Ejecución y Despliegue

### 💻 Prerrequisitos de Desarrollo Local
- **Java Development Kit (JDK)**: Versión 17 o superior.
- **Node.js**: Versión `>= 20.19.0` (npm 11+).
- **Angular CLI**: Versión `21.2.x`.
- **PostgreSQL**: Servidor PostgreSQL local o instancia en **Supabase**.

---

### 🔧 Paso 1: Configuración del Backend (Spring Boot)

1. Clonar el repositorio de Backend:
   ```bash
   git clone https://github.com/jose-rodriguez-p/backend_inventario.git
   cd backend_inventario
   ```
2. Configurar las variables de entorno en el archivo `.env` o `application.properties`:
   ```properties
   url=jdbc:postgresql://db.supabase.co:5432/postgres?sslmode=require
   user=postgres.su_usuario
   password=su_password_seguro
   PORT=8080
   RESEND_API_KEY=re_su_api_key_aqui
   ```
3. Compilar y ejecutar la aplicación Spring Boot:
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *El servidor API REST estará disponible en: `http://localhost:8080`*

---

### 🎨 Paso 2: Configuración del Frontend (Angular)

1. Clonar el repositorio de Frontend:
   ```bash
   git clone https://github.com/jose-rodriguez-p/Proyecto_Multiservicio_Rafael.git
   cd Proyecto_Multiservicio_Rafael
   ```
2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```
3. Configurar la URL de la API en `src/app/config.ts`:
   ```typescript
   export const API_BASE_URL = 'http://localhost:8080';
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación web estará disponible en: `http://localhost:4200`*

---

### ☁️ Paso 3: Despliegue en Entorno de Producción

1. **Base de Datos (Supabase)**:
   - Crear proyecto en Supabase PostgreSQL.
   - Ejecutar el script SQL de creación de tablas y funciones almacenadas (`fn_registrar_venta`, `fn_registrar_orden_mantenimiento`).
2. **Backend API (Render)**:
   - Conectar el repositorio GitHub a Render Web Service.
   - Seleccionar el entorno Docker o Java 17 Runtime.
   - Configurar las variables de entorno (`url`, `user`, `password`, `RESEND_API_KEY`).
3. **Frontend Application (Vercel)**:
   - Importar el repositorio GitHub en Vercel.
   - Vercel detectará la configuración de Angular SSR basada en `vercel.json` y `express`.
   - Establecer la variable de entorno con la URL pública de Render.

---

## 👥 Equipo de Desarrollo

- **José Rodríguez** - *Lead Developer / Fullstack Engineer* - [jose-rodriguez-p](https://github.com/jose-rodriguez-p)
- **Robert Zegarra** - *Developer* - [ZegarraRobert](https://github.com/ZegarraRobert)
- **Yhomar Cruz** - *Developer* - [imPERION66](https://github.com/imPERION66)

---
*Documentación oficial generada para el proyecto Multiservicio Rafael.*

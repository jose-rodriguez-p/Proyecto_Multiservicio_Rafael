export interface InfoTabla {
  icono: string;
  etiqueta: string;
  color: string;
}

export interface InfoAccion {
  etiqueta: string;
  color: string;
}

export const MAPA_TABLAS: Record<string, InfoTabla> = {
  cliente: { icono: 'bi-person-plus', etiqueta: 'Cliente', color: 'primary' },
  orden_venta: { icono: 'bi-cart-check', etiqueta: 'Venta', color: 'success' },
  orden_servicio: { icono: 'bi-tools', etiqueta: 'Mantenimiento', color: 'warning' },
  producto: { icono: 'bi-box-seam', etiqueta: 'Producto', color: 'info' },
  repuesto: { icono: 'bi-box-seam', etiqueta: 'Producto', color: 'info' },
  proveedor: { icono: 'bi-truck', etiqueta: 'Proveedor', color: 'secondary' },
  compra: { icono: 'bi-bag-plus', etiqueta: 'Compra', color: 'dark' },
  trabajador: { icono: 'bi-people', etiqueta: 'Trabajador', color: 'primary' },
  usuario: { icono: 'bi-shield-lock', etiqueta: 'Usuario', color: 'dark' },
  categorias: { icono: 'bi-tags', etiqueta: 'Categoría', color: 'secondary' },
  categoria: { icono: 'bi-tags', etiqueta: 'Categoría', color: 'secondary' },
  categoria_marca: { icono: 'bi-tags', etiqueta: 'Categoría y marca', color: 'secondary' },
  marcas: { icono: 'bi-bookmark-star', etiqueta: 'Marca', color: 'secondary' },
  marca: { icono: 'bi-bookmark-star', etiqueta: 'Marca', color: 'secondary' },
  roles: { icono: 'bi-person-badge', etiqueta: 'Rol', color: 'secondary' },
  rol: { icono: 'bi-person-badge', etiqueta: 'Rol', color: 'secondary' },
  cargo_rol: { icono: 'bi-person-badge', etiqueta: 'Cargo del trabajador', color: 'secondary' },
  'rol/acceso_menu': { icono: 'bi-key', etiqueta: 'Permisos de rol', color: 'secondary' },
  servicio: { icono: 'bi-wrench-adjustable', etiqueta: 'Servicio', color: 'warning' },
  vehiculo: { icono: 'bi-car-front', etiqueta: 'Vehículo', color: 'info' },
  configuracion: { icono: 'bi-gear', etiqueta: 'Configuración', color: 'secondary' },
};

export const MAPA_ACCIONES: Record<string, InfoAccion> = {
  INSERT: { etiqueta: 'Nuevo', color: 'success' },
  UPDATE: { etiqueta: 'Actualizado', color: 'primary' },
  DELETE: { etiqueta: 'Eliminado', color: 'danger' },
  LOGIN: { etiqueta: 'Inicio de sesión', color: 'secondary' },
  LOGOUT: { etiqueta: 'Cierre de sesión', color: 'secondary' },
};

// Respaldo: si aparece una tabla que todavía no está mapeada arriba,
// al menos la mostramos legible en vez del nombre crudo de la BD.
function formatearNombreGenerico(tabla: string): string {
  if (!tabla) return '';
  return tabla
    .replace(/[_/]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function infoTabla(tabla: string): InfoTabla {
  const clave = (tabla || '').toLowerCase();
  if (MAPA_TABLAS[clave]) return MAPA_TABLAS[clave];
  return { icono: 'bi-diagram-3', etiqueta: formatearNombreGenerico(tabla), color: 'secondary' };
}

export function infoAccion(accion: string): InfoAccion {
  const clave = (accion || '').toUpperCase();
  return MAPA_ACCIONES[clave] || { etiqueta: accion, color: 'secondary' };
}

// A qué módulo pertenece cada tabla, para poder "ir al registro"
export const RUTA_MODULO: Record<string, string> = {
  orden_servicio: '/sistema/servicio/mantenimiento',
  orden_venta: '/sistema/servicio/ventas',
  cliente: '/sistema/cliente',
  producto: '/sistema/producto',
  repuesto: '/sistema/producto',
  proveedor: '/sistema/proveedor',
  trabajador: '/sistema/trabajador',
  categorias: '/sistema/configuracion/categorias',
  categoria: '/sistema/configuracion/categorias',
  marcas: '/sistema/configuracion/marcas',
  marca: '/sistema/configuracion/marcas',
  roles: '/sistema/configuracion/rol',
  rol: '/sistema/configuracion/rol',
  cargo_rol: '/sistema/configuracion/rol',
  servicio: '/sistema/configuracion/servicios',
};

export function rutaModulo(tabla: string): string | null {
  return RUTA_MODULO[(tabla || '').toLowerCase()] || null;
}

// Saca del texto de "descripcion" un dato que el buscador del módulo destino
// realmente entienda (n° de orden, DNI). Es un parche mientras el backend
// no mande esta clave como campo aparte.
export function extraerClaveBusqueda(tabla: string, descripcion: string, idRegistro: number | null): string | null {
  const clave = (tabla || '').toLowerCase();
  const texto = descripcion || '';

  if (clave === 'orden_servicio') {
    const porNumero = texto.match(/orden\s*#(\d+)/i);
    if (porNumero) return porNumero[1];
    if (idRegistro) return String(idRegistro);
    return null;
  }

  if (clave === 'orden_venta') {
    const porCodigo = texto.match(/venta\s+([A-Z0-9]+-\d+)/i);
    if (porCodigo) return porCodigo[1];
    return null;
  }

  if (clave === 'cliente') {
    const porDni = texto.match(/DNI:?\s*(\d+)/i);
    if (porDni) return porDni[1];
    return null;
  }

  return null;
}
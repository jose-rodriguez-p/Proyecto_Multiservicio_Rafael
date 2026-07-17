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
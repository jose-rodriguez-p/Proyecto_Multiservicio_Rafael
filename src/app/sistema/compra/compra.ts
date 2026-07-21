import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'año' | '';

@Component({
  selector: 'app-compra',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})
export class Compra implements OnInit {
  filtroBusqueda = '';
  compras: any[] = [];
  compraSeleccionada: any = null;
  detalleCompra: any[] = [];
  mostrarModalDetalle = false;
  mostrarModalRuta = false;
  cargandoTabla = true;

  // Filtro de rango de fechas (se filtra en el cliente, igual que en Ventas)
  fechaInicio = '';
  fechaFin = '';
  rangoActivo: RangoFecha = '';

  // Filtro por proveedor
  filtroProveedor = '';
  todosProveedores: any[] = [];

  // Paginación (en el cliente)
  paginaActual = 1;
  porPagina = 10;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private appRef = inject(ApplicationRef);
  private http = inject(HttpClient);
  private URL_API = `${API_BASE_URL}/api/compras`;
  private URL_PROVEEDORES = `${API_BASE_URL}/api/proveedores`;

  constructor(public router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url || '';
        this.mostrarModalRuta = url.includes('nueva-compra');
        if (!this.mostrarModalRuta) this.cargarCompras();
      });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCompras();
      this.cargarProveedores();
    }
  }

  /** Trae TODOS los proveedores (no solo los que ya tienen compras) para el filtro */
  cargarProveedores() {
    this.http.get<any[]>(`${this.URL_PROVEEDORES}/listar`).subscribe({
      next: (data) => {
        this.todosProveedores = Array.isArray(data) ? data : [];
        this.refrescarVista();
      },
      error: (err) => {
        if (err.status !== 204) {
          console.error('Error al cargar proveedores:', err);
        }
        this.todosProveedores = [];
        this.refrescarVista();
      },
    });
  }

  /**
   * Fuerza el refresco de la vista tras una respuesta HTTP.
   * `cdr.detectChanges()` a veces no alcanza cuando la respuesta llega
   * fuera del ciclo de detección de cambios de Angular (p.ej. con
   * hydration o el cliente HTTP basado en fetch), por lo que además
   * disparamos un tick completo de la aplicación como respaldo.
   */
  private refrescarVista() {
    try {
      this.cdr.detectChanges();
    } catch {
      // ignorar: puede lanzar si la vista aún no está adjunta
    }
    if (!this.appRef.destroyed) {
      this.appRef.tick();
    }
  }

  cargarCompras() {
    this.cargandoTabla = true;
    this.http.get<any[]>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        this.compras = Array.isArray(data) ? data : [];
        this.cargandoTabla = false;
        this.refrescarVista();
      },
      error: (err) => {
        if (err.status !== 204) {
          console.error('Error al cargar compras:', err);
        }
        this.compras = [];
        this.cargandoTabla = false;
        this.refrescarVista();
      },
    });
  }

  get comprasFiltradas() {
    const q = this.filtroBusqueda.trim().toLowerCase();
    return this.compras.filter((c) => {
      const coincideTexto =
        !q ||
        (c.nombre_proveedor || '').toLowerCase().includes(q) ||
        (c.ruc_proveedor || '').toLowerCase().includes(q);

      const coincideProveedor =
        !this.filtroProveedor || c.nombre_proveedor === this.filtroProveedor;

      const fechaCompra = this.soloFecha(c.fec_compra);
      const dentroInicio = !this.fechaInicio || fechaCompra >= this.fechaInicio;
      const dentroFin = !this.fechaFin || fechaCompra <= this.fechaFin;

      return coincideTexto && coincideProveedor && dentroInicio && dentroFin;
    });
  }

  /** Lista de proveedores para el dropdown de filtro (todos los registrados, no solo los que ya tienen compras) */
  get listaProveedores(): string[] {
    const nombres = this.todosProveedores
      .filter((p) => !p.estado || p.estado === 'Activo')
      .map((p) => p.nombre_empresa)
      .filter((n): n is string => !!n);
    return Array.from(new Set(nombres)).sort((a, b) => a.localeCompare(b));
  }

  // --- Paginación (sobre comprasFiltradas) ---

  get comprasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.comprasFiltradas.slice(inicio, inicio + this.porPagina);
  }

  get totalRegistros(): number {
    return this.comprasFiltradas.length;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalRegistros / this.porPagina));
  }

  get paginas(): number[] {
    const rango = 2;
    const inicio = Math.max(1, this.paginaActual - rango);
    const fin = Math.min(this.totalPaginas, this.paginaActual + rango);
    const arr: number[] = [];
    for (let i = inicio; i <= fin; i++) arr.push(i);
    return arr;
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas || p === this.paginaActual) return;
    this.paginaActual = p;
  }

  cambiarPorPagina() {
    this.paginaActual = 1;
  }

  onFiltroChange() {
    this.paginaActual = 1;
  }

  // --- Tarjetas resumen ---

  get resumen() {
    const lista = this.comprasFiltradas;
    const totalCompras = lista.length;
    const montoTotal = lista.reduce((sum, c) => sum + (Number(c.tot_pago) || 0), 0);
    const ticketPromedio = totalCompras > 0 ? montoTotal / totalCompras : 0;
    return { totalCompras, montoTotal, ticketPromedio };
  }

  get cargandoResumen(): boolean {
    return this.cargandoTabla;
  }

  /** Extrae la parte 'yyyy-MM-dd' de un timestamp para comparar con los <input type="date"> */
  private soloFecha(fecha: string): string {
    if (!fecha) return '';
    return fecha.slice(0, 10);
  }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  setRango(tipo: RangoFecha) {
    if (!tipo) return;
    const hoy = new Date();
    let inicio: Date, fin: Date;

    if (tipo === 'hoy') {
      inicio = new Date(hoy);
      fin = new Date(hoy);
    } else if (tipo === 'semana') {
      const dia = hoy.getDay() === 0 ? 7 : hoy.getDay();
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - dia + 1);
      fin = new Date(hoy);
    } else if (tipo === 'mes') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy);
    } else {
      inicio = new Date(hoy.getFullYear(), 0, 1);
      fin = new Date(hoy);
    }

    this.fechaInicio = inicio.toISOString().split('T')[0];
    this.fechaFin = fin.toISOString().split('T')[0];
    this.rangoActivo = tipo;
    this.paginaActual = 1;
  }

  onFechaManual() {
    this.rangoActivo = '';
    this.paginaActual = 1;
  }

  limpiarFecha() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.rangoActivo = '';
    this.paginaActual = 1;
  }

  abrirNuevaCompra() {
    this.router.navigate(['/sistema/compra/nueva-compra']);
  }

  verDetalle(compra: any) {
    this.compraSeleccionada = compra;
    this.detalleCompra = [];
    this.mostrarModalDetalle = true;
    this.http.get<any[]>(`${this.URL_API}/detalle/${compra.id_oper_compra}`).subscribe({
      next: (data) => {
        this.detalleCompra = Array.isArray(data) ? data : [];
        this.refrescarVista();
      },
      error: (err) => {
        if (err.status !== 204) {
          Swal.fire('Error', 'No se pudo cargar el detalle de la compra.', 'error');
        }
        this.refrescarVista();
      },
    });
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.compraSeleccionada = null;
    this.detalleCompra = [];
  }

  exportarExcel() {
    const payload = this.comprasFiltradas.map((c) => ({
      id_oper_compra: c.id_oper_compra,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Compras_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('Éxito', 'El reporte de Excel se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.comprasFiltradas.map((c) => ({
      id_oper_compra: c.id_oper_compra,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Compras_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('Éxito', 'El reporte de PDF se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de PDF', 'error');
      },
    });
  }
}
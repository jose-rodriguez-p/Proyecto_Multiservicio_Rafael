import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface VentaResumen {
  n_orden: number;
  productos: string;
  fecha:        string;
  hora:         string;
  cliente:      string;
  dni:   string;
  vendedor:     string;
  metodo_pago:   string;
  total:  number;
}

interface ResumenHoy {
  totalVentas:    number;
  montoTotalHoy:  number;
  ticketPromedio: number;
}

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'año' | '';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/ventas`;
  private URL_CAJA = `${API_BASE_URL}/api/caja`;

  enCrear = false;
  cargandoTabla = true;

  // --- Estado de caja (apertura/cierre para cuadre) ---
  cargandoCaja = true;
  cajaAbierta = false;
  cajaActual: { id_cierre_caja: number, fec_apertura: string, saldo_inicial: number } | null = null;

  // Traemos TODAS las ventas una sola vez; búsqueda, fechas y paginación se filtran en el cliente.
  // Límite de seguridad: si algún día superas ~2000 ventas, hay que mover el filtro al backend.
  private todasVentas: VentaResumen[] = [];

  busqueda = '';

  // Filtro de rango de fechas
  fechaInicio = '';
  fechaFin = '';
  rangoActivo: RangoFecha = 'mes';

  paginaActual = 1;
  porPagina = 10;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.enCrear = e.urlAfterRedirects.includes('/ventas/crear');
      if (isPlatformBrowser(this.platformId) && !this.enCrear) {
        this.cargarTodo();
        this.cargarEstadoCaja();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setRango('mes');
      this.cargarTodo();
      this.cargarEstadoCaja();
    }
  }

  cargarEstadoCaja() {
    this.cargandoCaja = true;
    this.http.get<any>(`${this.URL_CAJA}/estado`).subscribe({
      next: (res) => {
        this.cajaAbierta = !!res?.abierta;
        this.cajaActual = res?.caja || null;
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoCaja = false; this.cdr.detectChanges(); },
    });
  }

  abrirCaja() {
    Swal.fire({
      title: 'Abrir caja',
      html: `<p class="text-muted small mb-2">Ingresa el monto en efectivo con el que inicias el turno.</p>`,
      input: 'number',
      inputLabel: 'Saldo inicial (S/)',
      inputValue: 0,
      inputAttributes: { min: '0', step: '0.10' },
      showCancelButton: true,
      confirmButtonText: 'Abrir caja',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => (value === '' || Number(value) < 0) ? 'Ingresa un monto válido' : undefined,
    }).then((res) => {
      if (!res.isConfirmed) return;
      const saldoInicial = Number(res.value);
      this.http.post<any>(`${this.URL_CAJA}/abrir`, { saldo_inicial: saldoInicial }).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Caja abierta', timer: 1500, showConfirmButton: false });
          this.cargarEstadoCaja();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo abrir la caja', 'error'),
      });
    });
  }

  cerrarCaja() {
    if (!this.cajaActual) return;
    const idCierreCaja = this.cajaActual.id_cierre_caja;

    this.http.get<any>(`${this.URL_CAJA}/${idCierreCaja}/resumen`).subscribe({
      next: (resumen) => {
        const totSistema: number = resumen.tot_ventas_sistema || 0;
        Swal.fire({
          title: 'Cerrar caja',
          html: `
            <div class="text-start small">
              <p class="mb-1">Ventas contabilizadas: <b>${resumen.cantidad_ventas || 0}</b></p>
              <p class="mb-3">Total según sistema: <b>S/ ${totSistema.toFixed(2)}</b></p>
              <label class="form-label small mb-1">Efectivo contado en caja (S/)</label>
            </div>`,
          input: 'number',
          inputValue: totSistema.toFixed(2),
          inputAttributes: { min: '0', step: '0.10' },
          showCancelButton: true,
          confirmButtonText: 'Cerrar caja',
          confirmButtonColor: '#dc3545',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => (value === '' || Number(value) < 0) ? 'Ingresa un monto válido' : undefined,
        }).then((res) => {
          if (!res.isConfirmed) return;
          const totCajero = Number(res.value);
          this.http.post<any>(`${this.URL_CAJA}/${idCierreCaja}/cerrar`, { tot_ventas_cajero: totCajero }).subscribe({
            next: () => {
              const diferencia = totCajero - totSistema;
              const cuadrada = Math.abs(diferencia) < 0.01;
              Swal.fire({
                icon: cuadrada ? 'success' : 'warning',
                title: cuadrada ? 'Caja cuadrada' : (diferencia > 0 ? 'Hay sobrante' : 'Hay faltante'),
                text: cuadrada ? 'El monto contado coincide con el sistema.' : `Diferencia: S/ ${Math.abs(diferencia).toFixed(2)}`,
                confirmButtonText: 'Descargar comprobante',
                confirmButtonColor: '#dc3545',
              }).then(() => this.descargarComprobanteCierre(idCierreCaja));
              this.cargarEstadoCaja();
            },
            error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo cerrar la caja', 'error'),
          });
        });
      },
      error: () => Swal.fire('Error', 'No se pudo obtener el resumen de caja', 'error'),
    });
  }

  descargarComprobanteCierre(idCierreCaja: number) {
    this.http.get(`${this.URL_CAJA}/${idCierreCaja}/comprobante`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cierre_Caja_${idCierreCaja}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: () => Swal.fire('Error', 'No se pudo generar el comprobante de cierre', 'error'),
    });
  }

  cargarTodo() {
    this.cargandoTabla = true;

    const params = new HttpParams()
      .set('pagina', '1')
      .set('porPagina', '2000');

    this.http.get<{ ventas: VentaResumen[], totalRegistros: number }>(`${this.URL}/listar`, { params })
      .subscribe({
        next: (res) => {
          this.todasVentas = res.ventas || [];
          this.cargandoTabla = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando ventas:', err);
          this.cargandoTabla = false;
          this.cdr.detectChanges();
        }
      });
  }

  // --- Filtrado en el cliente ---

  get ventasFiltradas(): VentaResumen[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.todasVentas.filter(v => {
      const coincideTexto = !texto ||
        v.cliente?.toLowerCase().includes(texto) ||
        v.dni?.toLowerCase().includes(texto) ||
        String(v.n_orden).includes(texto);

      const fechaVenta = v.fecha ?? '';
      const dentroInicio = !this.fechaInicio || fechaVenta >= this.fechaInicio;
      const dentroFin = !this.fechaFin || fechaVenta <= this.fechaFin;

      return coincideTexto && dentroInicio && dentroFin;
    });
  }

  get ventas(): VentaResumen[] {
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.ventasFiltradas.slice(inicio, inicio + this.porPagina);
  }

  get totalRegistros(): number {
    return this.ventasFiltradas.length;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalRegistros / this.porPagina));
  }

  get resumen(): ResumenHoy {
    const lista = this.ventasFiltradas;
    const totalVentas = lista.length;
    const montoTotalHoy = lista.reduce((sum, v) => sum + (v.total || 0), 0);
    const ticketPromedio = totalVentas > 0 ? montoTotalHoy / totalVentas : 0;
    return { totalVentas, montoTotalHoy, ticketPromedio };
  }

  get cargandoResumen(): boolean {
    return this.cargandoTabla;
  }

  onBusqueda() {
    this.paginaActual = 1;
  }

  get paginas(): number[] {
    const rango = 2;
    const inicio = Math.max(1, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas, this.paginaActual + rango);
    const arr: number[] = [];
    for (let i = inicio; i <= fin; i++) arr.push(i);
    return arr;
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas || p === this.paginaActual) return;
    this.paginaActual = p;
  }

  cambiarPorPagina() { this.paginaActual = 1; }

  nuevaVenta() {
    if (!this.cajaAbierta) {
      Swal.fire('Caja cerrada', 'Debes abrir caja antes de registrar ventas.', 'warning');
      return;
    }
    this.router.navigate(['/sistema/servicio/ventas/crear']);
  }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  // --- Selector de rango de fechas ---

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

  getProductosList(productos: string): string[] {
    if (!productos) return [];
    return productos.split(', ').map(p => p.trim()).filter(Boolean);
  }

  obtenerPrimerNombre(nombreCompleto: string): string {
    if (!nombreCompleto) return '';
    return nombreCompleto.trim().split(' ')[0];
  }

  exportarExcel() {
    const payload = this.ventasFiltradas.map(v => ({
      n_orden: v.n_orden,
      productos: v.productos,
      fecha: v.fecha,
      hora: v.hora,
      cliente: v.cliente,
      dni: v.dni,
      vendedor: v.vendedor,
      metodo_pago: v.metodo_pago,
      total: v.total,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Ventas_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel se ha descargado', 'success');
      },
      error: () => Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error'),
    });
  }

  exportarPDF() {
    const payload = this.ventasFiltradas.map(v => ({
      n_orden: v.n_orden,
      productos: v.productos,
      fecha: v.fecha,
      hora: v.hora,
      cliente: v.cliente,
      dni: v.dni,
      vendedor: v.vendedor,
      metodo_pago: v.metodo_pago,
      total: v.total,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Ventas_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF se ha descargado', 'success');
      },
      error: () => Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF', 'error'),
    });
  }
}
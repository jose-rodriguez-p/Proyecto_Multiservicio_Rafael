import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface OrdenResumen {
  idOrdenServicio:     number;
  hora:                string;
  fechaRegistro:       string;
  fechaServicio:       string;
  fechaCulminacion:    string;
  fecha?:              string;
  cliente:             string;
  dniCliente:          string;
  descripcionVehiculo: string;
  servicios:           string;
  precioManoObra?:     number;
  precioTotal:         number;
  estado:              string;
  tecnicos?:           string;
  nota?:               string;
  usuarioRegistro?:    string;
  detalle?:            any[];
}

interface ResumenMantenimiento {
  totalOrdenes:   number;
  montoTotal:     number;
  ticketPromedio: number;
}

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'año' | '';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './mantenimiento.html',
  styleUrl: './mantenimiento.css',
})
export class Mantenimiento implements OnInit {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/mantenimiento`;

  enCrear = false;
  cargandoTabla = true;

  private todasOrdenes: OrdenResumen[] = [];

  busqueda = '';
  estadoFiltro = 'Todos';

  fechaInicio = '';
  fechaFin = '';
  rangoActivo: RangoFecha = 'mes';

  paginaActual = 1;
  porPagina = 10;

  showModalDetalle = false;
  ordenSeleccionada: OrdenResumen | null = null;
  metodoPagoSeleccionado = 'Efectivo';
  tipoComprobanteSeleccionado = 'Boleta';
  serieSeleccionada = 'B001';

  onTipoComprobanteChange() {
    this.serieSeleccionada = this.tipoComprobanteSeleccionado === 'Boleta' ? 'B001' : 'F001';
  }

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.enCrear = e.urlAfterRedirects.includes('/mantenimiento/crear');
      this.cdr.detectChanges();
      if (isPlatformBrowser(this.platformId) && !this.enCrear) {
        this.cargarTodo();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.enCrear = this.router.url.includes('/mantenimiento/crear');
      if (!this.enCrear) {
        this.cargarTodo();
      }
    }
  }

  cargarTodo() {
    this.cargandoTabla = true;
    const params = new HttpParams()
      .set('pagina', 1)
      .set('porPagina', 2000)
      .set('busqueda', '');

    this.http.get<any>(`${this.URL}/listar`, { params }).subscribe({
      next: (res) => {
        const listaBruta = Array.isArray(res) ? res : (res?.datos || res?.content || []);
        this.todasOrdenes = listaBruta.map((orden: any) => {
          orden.idOrdenServicio = orden.idOrdenServicio || orden.id_orden_servicio;
          orden.fechaServicio = orden.fechaServicio || orden.fecha || orden.fecha_servicio || orden.fechaRegistro;
          orden.fechaRegistro = orden.fechaRegistro || orden.fecha_registro || orden.fecha || orden.fechaServicio;
          orden.fecha = orden.fecha || orden.fechaServicio || orden.fechaRegistro;
          orden.dniCliente = orden.dniCliente || orden.dni;
          orden.descripcionVehiculo = orden.descripcionVehiculo || orden.vehiculo;
          orden.precioManoObra = orden.precioManoObra !== undefined ? orden.precioManoObra : (orden.mano_obra || 0);
          orden.precioTotal = orden.precioTotal !== undefined ? orden.precioTotal : (orden.total || 0);

          if (orden.detalle && typeof orden.detalle === 'string') {
            try {
              orden.detalle = JSON.parse(orden.detalle);
            } catch (e) {
              orden.detalle = [];
            }
          }
          return orden;
        });
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerYYYYMMDD(val: any): string {
    if (!val) return '';
    if (typeof val === 'number') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    if (str.length >= 10 && str.includes('-')) {
      return str.substring(0, 10);
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      try {
        return d.toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    return '';
  }

  get ordenesFiltradas(): OrdenResumen[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.todasOrdenes.filter(o => {
      const coincideTexto = !texto ||
        o.cliente?.toLowerCase().includes(texto) ||
        o.dniCliente?.toLowerCase().includes(texto) ||
        o.descripcionVehiculo?.toLowerCase().includes(texto) ||
        o.tecnicos?.toLowerCase().includes(texto) ||
        String(o.idOrdenServicio).includes(texto);

      const coincideEstado = !this.estadoFiltro || this.estadoFiltro === 'Todos' ||
        o.estado?.toLowerCase() === this.estadoFiltro.toLowerCase();

      const fechaBase = o.fechaRegistro || o.fechaServicio || o.fecha;
      const fechaOrden = this.extraerYYYYMMDD(fechaBase);

      const dentroInicio = !this.fechaInicio || !fechaOrden || fechaOrden >= this.fechaInicio;
      const dentroFin = !this.fechaFin || !fechaOrden || fechaOrden <= this.fechaFin;

      return coincideTexto && coincideEstado && dentroInicio && dentroFin;
    });
  }

  get ordenes(): OrdenResumen[] {
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.ordenesFiltradas.slice(inicio, inicio + this.porPagina);
  }

  get totalRegistros(): number {
    return this.ordenesFiltradas.length;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalRegistros / this.porPagina));
  }

  get resumen(): ResumenMantenimiento {
    const lista = this.ordenesFiltradas;
    const totalOrdenes = lista.length;
    const montoTotal = lista.reduce((sum, o) => sum + (o.precioTotal || 0), 0);
    const ticketPromedio = totalOrdenes > 0 ? montoTotal / totalOrdenes : 0;
    return { totalOrdenes, montoTotal, ticketPromedio };
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

  nuevoMantenimiento() { this.router.navigate(['/sistema/servicio/mantenimiento/crear']); }

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

  getServiciosList(servicios: string): string[] {
    if (!servicios) return [];
    return servicios.split(', ').map(s => s.trim()).filter(Boolean);
  }

  getRepuestosList(detalle: any[] | undefined): { nombre_repuesto: string; cantidad: number; precio_total?: number }[] {
    if (!detalle || !Array.isArray(detalle) || detalle.length === 0) return [];
    const repuestos: { nombre_repuesto: string; cantidad: number; precio_total?: number }[] = [];
    detalle.forEach((item: any) => {
      if (item && item.repuestos && Array.isArray(item.repuestos)) {
        item.repuestos.forEach((rep: any) => {
          if (rep && rep.nombre_repuesto) {
            repuestos.push({
              nombre_repuesto: rep.nombre_repuesto,
              cantidad: rep.cantidad || 1,
              precio_total: rep.precio_total
            });
          }
        });
      }
    });
    return repuestos;
  }

  getPlaca(descripcionVehiculo: string): string {
    if (!descripcionVehiculo) return '';
    const partes = descripcionVehiculo.split(' - ');
    return partes.length > 1 ? partes[partes.length - 1] : descripcionVehiculo;
  }

  getModeloMarca(descripcionVehiculo: string): string {
    if (!descripcionVehiculo) return '';
    const partes = descripcionVehiculo.split(' - ');
    return partes.length > 1 ? partes.slice(0, partes.length - 1).join(' - ') : '';
  }

  formatearServicios(servicios: string): string {
    return servicios ? servicios.split(', ').join('\n') : '-';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '-';
    if (typeof fecha === 'string') {
      const date = new Date(fecha);
      return isNaN(date.getTime()) ? fecha : date.toLocaleDateString('es-PE');
    }
    if (fecha instanceof Date) {
      return fecha.toLocaleDateString('es-PE');
    }
    return '-';
  }

  formatearHora(fechaStr: any): string {
    if (!fechaStr) return '';
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) {
        if (typeof fechaStr === 'string' && fechaStr.includes(':')) {
          return fechaStr.substring(0, 5);
        }
        return '';
      }
      return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  }

  formatearRepuestos(detalle: any[] | undefined): string {
    const list = this.getRepuestosList(detalle);
    if (list.length === 0) return '';
    return list.map(r => `${r.nombre_repuesto} (x${r.cantidad})`).join('\n');
  }

  badgeEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'completado': return 'bg-success';
      case 'en proceso': return 'bg-warning text-dark';
      case 'pendiente':  return 'bg-secondary';
      default:           return 'bg-light text-dark border';
    }
  }

  cambiarEstado(orden: OrdenResumen, event: Event) {
    const select = event.target as HTMLSelectElement;
    const nuevoEstado = select.value;
    const estadoAnterior = orden.estado;

    Swal.fire({
      title: '¿Cambiar estado?',
      html: `La orden <b>#${orden.idOrdenServicio}</b> pasará de <b>${estadoAnterior}</b> a <b>${nuevoEstado}</b>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (!result.isConfirmed) {
        select.value = estadoAnterior;
        return;
      }
      orden.estado = nuevoEstado;
      const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'sistema';
      this.http.put(`${this.URL}/editar-estado`, {
        usuario_logueado: usuario,
        id_orden_servicio: orden.idOrdenServicio,
        nuevo_estado: nuevoEstado
      }).subscribe({
        next: (res: any) => {
          if (res.status === 'OK') {
            Swal.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
            this.cargarTodo();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.mensaje });
            this.cargarTodo();
          }
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado' });
          this.cargarTodo();
        }
      });
    });
  }

  abrirModalDetalleMantenimiento(orden: OrdenResumen) {
    this.ordenSeleccionada = orden;
    this.metodoPagoSeleccionado = 'Efectivo';
    this.showModalDetalle = true;
  }

  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.ordenSeleccionada = null;
  }

  showModalVoucher = false;
  voucherDatos: any = null;
  descargandoPDF = false;

  cerrarVoucher() {
    this.showModalVoucher = false;
  }

  imprimirVoucherHTML() {
    const printContent = document.getElementById('voucher-mantenimiento-imprimir')?.innerHTML;
    if (!printContent) return;

    let iframe = document.getElementById('print-iframe-voucher-mant') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-voucher-mant';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Voucher_Mantenimiento_${this.voucherDatos?.idOrdenServicio || 'Servicio'}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #222; padding: 20px; }
              .voucher-box { border: 2px solid #dc3545; border-radius: 12px; padding: 30px; background: #fff; max-width: 750px; margin: auto; }
              .total-highlight { font-size: 24px; font-weight: bold; color: #dc3545; }
              @media print {
                body { padding: 0; }
                .voucher-box { border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="voucher-box">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  }

  descargarVoucherPDF() {
    const id = this.voucherDatos?.idOrdenServicio;
    this.descargandoPDF = true;

    // Intentar obtener PDF del backend si está disponible o usar ventana/impresión HTML
    this.http.get(`${this.URL}/${id}/comprobante`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.descargandoPDF = false;
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Voucher_Mantenimiento_${id || 'Servicio'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: () => {
        this.descargandoPDF = false;
        // Fallback a impresión HTML si el endpoint dinámico no responde
        this.imprimirVoucherHTML();
        this.cdr.detectChanges();
      }
    });
  }

  cerrarServicio() {
    if (!this.ordenSeleccionada) return;

    const estadoAnterior = this.ordenSeleccionada.estado;
    if (estadoAnterior === 'Completado') {
      this.cerrarModalDetalle();
      return;
    }

    const fechaServicioStr = this.ordenSeleccionada?.fechaServicio || this.ordenSeleccionada?.fecha;
    if (fechaServicioStr) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      let fechaServ: Date | null = null;
      if (typeof fechaServicioStr === 'string' && fechaServicioStr.includes('-')) {
        const partes = fechaServicioStr.split('T')[0].split('-');
        if (partes.length === 3) {
          fechaServ = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        }
      }
      if (!fechaServ) {
        fechaServ = new Date(fechaServicioStr);
      }
      if (fechaServ && !isNaN(fechaServ.getTime())) {
        fechaServ.setHours(0, 0, 0, 0);
        if (hoy.getTime() < fechaServ.getTime()) {
          Swal.fire({
            icon: 'warning',
            title: 'Fecha de servicio no alcanzada',
            text: 'No se puede culminar el servicio antes de la fecha programada de atención.',
            confirmButtonColor: '#dc3545'
          });
          return;
        }
      }
    }

    const nuevoEstado = 'Completado';

    const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'sistema';
    this.http.put(`${this.URL}/editar-estado`, {
      usuario_logueado: usuario,
      id_orden_servicio: this.ordenSeleccionada.idOrdenServicio,
      nuevo_estado: nuevoEstado
    }).subscribe({
      next: (res: any) => {
        if (res.status === 'OK') {
          const total = this.ordenSeleccionada?.precioTotal || 0;
          const valorVenta = total / 1.18;
          const igv = total - valorVenta;

          this.voucherDatos = {
            idOrdenServicio: this.ordenSeleccionada?.idOrdenServicio,
            tipoComprobante: this.tipoComprobanteSeleccionado,
            serie: this.serieSeleccionada,
            cliente: this.ordenSeleccionada?.cliente,
            dniCliente: this.ordenSeleccionada?.dniCliente,
            descripcionVehiculo: this.ordenSeleccionada?.descripcionVehiculo,
            fechaServicio: this.ordenSeleccionada?.fechaServicio || this.ordenSeleccionada?.fecha,
            fechaCulminacion: new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
            tecnicos: this.ordenSeleccionada?.tecnicos,
            metodoPago: this.metodoPagoSeleccionado,
            precioManoObra: this.ordenSeleccionada?.precioManoObra || 0,
            valorVenta: valorVenta,
            igv: igv,
            precioTotal: total,
            detalle: this.ordenSeleccionada?.detalle || []
          };
          this.cargarTodo();
          this.cerrarModalDetalle();
          this.showModalVoucher = true;
          this.cdr.detectChanges();
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: res.mensaje });
          this.cargarTodo();
        }
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el mantenimiento' });
        this.cargarTodo();
      }
    });
  }

  tieneDetalle(): boolean {
    return !!(this.ordenSeleccionada?.detalle && this.ordenSeleccionada.detalle.length > 0);
  }

  exportarExcel() {
    const payload = this.ordenesFiltradas.map(o => ({
      idOrdenServicio: o.idOrdenServicio,
      fechaRegistro: o.fechaRegistro,
      fechaServicio: o.fechaServicio,
      hora: o.hora,
      cliente: o.cliente,
      dniCliente: o.dniCliente,
      descripcionVehiculo: o.descripcionVehiculo,
      servicios: o.servicios,
      tecnicos: o.tecnicos || '',
      precioTotal: o.precioTotal,
      estado: o.estado,
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
        link.download = `Reporte_Mantenimiento_${timestamp}.xlsx`;
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
    const payload = this.ordenesFiltradas.map(o => ({
      idOrdenServicio: o.idOrdenServicio,
      fechaRegistro: o.fechaRegistro,
      fechaServicio: o.fechaServicio,
      hora: o.hora,
      cliente: o.cliente,
      dniCliente: o.dniCliente,
      descripcionVehiculo: o.descripcionVehiculo,
      servicios: o.servicios,
      tecnicos: o.tecnicos || '',
      precioTotal: o.precioTotal,
      estado: o.estado,
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
        link.download = `Reporte_Mantenimiento_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF se ha descargado', 'success');
      },
      error: () => Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF', 'error'),
    });
  }

  descargarComprobanteDirecto(idOrdenServicio?: number) {
    if (!idOrdenServicio) return;
    const tipo = this.tipoComprobanteSeleccionado || 'Boleta';
    const metodo = this.metodoPagoSeleccionado || 'Efectivo';
    this.http.get(`${this.URL}/${idOrdenServicio}/comprobante?tipoComprobante=${tipo}&metodoPago=${metodo}`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Comprobante_Mantenimiento_${idOrdenServicio}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: () => Swal.fire('Error', 'No se pudo descargar el comprobante en PDF', 'error'),
    });
  }
}
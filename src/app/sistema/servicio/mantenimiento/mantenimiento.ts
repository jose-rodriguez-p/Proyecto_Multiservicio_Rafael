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
  fecha?:              string;
  cliente:             string;
  dniCliente:          string;
  descripcionVehiculo: string;
  servicios:           string;
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

  // Traemos TODAS las órdenes una sola vez; todo lo demás se filtra en el cliente.
  // Límite de seguridad: si algún día superas ~2000 órdenes, hay que mover el filtro al backend.
  private todasOrdenes: OrdenResumen[] = [];

  busqueda = '';

  // Filtro de rango de fechas
  fechaInicio = '';
  fechaFin = '';
  rangoActivo: RangoFecha = 'mes';

  paginaActual = 1;
  porPagina = 10;

  // Modal detalle
  showModalDetalle = false;
  ordenSeleccionada: OrdenResumen | null = null;
  nuevoEstadoSeleccionado = '';
  metodoPagoSeleccionado = 'Efectivo';

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
        this.setRango('mes');
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
        console.log('Datos recibidos del backend:', res);
        this.todasOrdenes = (res.datos || []).map((orden: any) => {
          // Parsear detalle si viene como string
          if (orden.detalle && typeof orden.detalle === 'string') {
            try {
              orden.detalle = JSON.parse(orden.detalle);
            } catch (e) {
              console.error('Error parseando detalle:', e);
              orden.detalle = [];
            }
          }
          return orden;
        });
        console.log('Primera orden después de parse:', this.todasOrdenes[0]);
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoTabla = false; this.cdr.detectChanges(); }
    });
  }

  // --- Filtrado en el cliente ---

  get ordenesFiltradas(): OrdenResumen[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.todasOrdenes.filter(o => {
      const coincideTexto = !texto ||
        o.cliente?.toLowerCase().includes(texto) ||
        o.dniCliente?.toLowerCase().includes(texto) ||
        String(o.idOrdenServicio).includes(texto);

      const fechaOrden = o.fecha ?? '';
      const dentroInicio = !this.fechaInicio || fechaOrden >= this.fechaInicio;
      const dentroFin = !this.fechaFin || fechaOrden <= this.fechaFin;

      return coincideTexto && dentroInicio && dentroFin;
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

  formatearServicios(servicios: string): string {
    return servicios ? servicios.split(', ').join('\n') : '-';
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

  // --- Métodos para modal de detalle ---

  abrirModalDetalleMantenimiento(orden: OrdenResumen) {
    this.ordenSeleccionada = orden;
    this.nuevoEstadoSeleccionado = orden.estado;
    this.metodoPagoSeleccionado = 'Efectivo';
    console.log('Orden seleccionada:', orden);
    console.log('Detalle:', orden.detalle);
    this.showModalDetalle = true;
  }

  cerrarModalDetalle() {
    this.showModalDetalle = false;
    this.ordenSeleccionada = null;
    this.nuevoEstadoSeleccionado = '';
  }

  actualizarMantenimiento() {
    if (!this.ordenSeleccionada || !this.nuevoEstadoSeleccionado) return;

    const estadoAnterior = this.ordenSeleccionada.estado;
    const nuevoEstado = this.nuevoEstadoSeleccionado;

    if (estadoAnterior === nuevoEstado) {
      this.cerrarModalDetalle();
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'sistema';
    this.http.put(`${this.URL}/editar-estado`, {
      usuario_logueado: usuario,
      id_orden_servicio: this.ordenSeleccionada.idOrdenServicio,
      nuevo_estado: nuevoEstado
    }).subscribe({
      next: (res: any) => {
        if (res.status === 'OK') {
          Swal.fire({ icon: 'success', title: 'Mantenimiento actualizado', timer: 1500, showConfirmButton: false });
          this.cargarTodo();
          this.cerrarModalDetalle();
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
    console.log('tieneDetalle check:', this.ordenSeleccionada?.detalle);
    return !!(this.ordenSeleccionada?.detalle && this.ordenSeleccionada.detalle.length > 0);
  }
}
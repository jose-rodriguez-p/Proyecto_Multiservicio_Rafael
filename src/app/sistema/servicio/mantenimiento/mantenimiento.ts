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
  precioManoObra:      number;
  precioTotal:         number;
  estado:              string;
  tecnicos?:           string;
}

interface ResumenMantenimiento {
  totalOrdenes:   number;
  montoTotal:     number;
  ticketPromedio: number;
}

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

  resumen: ResumenMantenimiento = { totalOrdenes: 0, montoTotal: 0, ticketPromedio: 0 };
  cargandoResumen = true;
  enCrear = false;

  ordenes: OrdenResumen[] = [];
  cargandoTabla = true;
  busqueda = '';
  fechaFiltro = '';
  paginaActual = 1;
  porPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.enCrear = e.urlAfterRedirects.includes('/mantenimiento/crear');
      this.cdr.detectChanges();
      if (isPlatformBrowser(this.platformId) && !this.enCrear) {
        this.cargarOrdenes();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.enCrear = this.router.url.includes('/mantenimiento/crear');
      if (!this.enCrear) {
        this.cargarResumen();
        this.cargarOrdenes();
      }
    }
  }

  cargarResumen() {
    this.cargandoResumen = true;
    this.http.get<any>(`${this.URL}/listar`, { 
      params: new HttpParams().set('pagina', 1).set('porPagina', 1000).set('busqueda', '')
    }).subscribe({
      next: (res) => {
        const todasLasOrdenes = res.datos || [];
        this.calcularResumen(todasLasOrdenes);
        this.cargandoResumen = false;
      },
      error: () => { this.cargandoResumen = false; }
    });
  }

  calcularResumen(ordenes: any[]) {
    const totalOrdenes = ordenes.length;
    const montoTotal = ordenes.reduce((sum, o) => sum + (o.precioTotal || 0), 0);
    const ticketPromedio = totalOrdenes > 0 ? montoTotal / totalOrdenes : 0;
    this.resumen = { totalOrdenes, montoTotal, ticketPromedio };
  }

  cargarOrdenes() {
    this.cargandoTabla = true;
    const params = new HttpParams()
      .set('pagina',    this.paginaActual)
      .set('porPagina', this.porPagina)
      .set('busqueda',  this.busqueda.trim());

    this.http.get<any>(`${this.URL}/listar`, { params }).subscribe({
      next: (res) => {
        this.ordenes         = res.datos          || [];
        this.totalRegistros  = res.totalRegistros || 0;
        this.totalPaginas    = res.totalPaginas   || 0;
        this.paginaActual    = res.paginaActual   || 1;
        this.cargandoTabla   = false;
        this.calcularResumen(this.ordenes);
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoTabla = false; this.cdr.detectChanges(); }
    });
  }

  onBusqueda() {
    this.paginaActual = 1;
    this.cargarOrdenes();
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
    this.cargarOrdenes();
  }

  get ordenesFiltradas(): OrdenResumen[] {
    if (!this.fechaFiltro) return this.ordenes;
    return this.ordenes.filter(o => o.fecha === this.fechaFiltro);
  }

  cambiarPorPagina() { this.paginaActual = 1; this.cargarOrdenes(); }

  nuevoMantenimiento() { this.router.navigate(['/sistema/servicio/mantenimiento/crear']); }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFechaChange() {
    this.paginaActual = 1;
    this.cargarOrdenes();
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
            this.cargarOrdenes();
          } else {
            Swal.fire({ icon: 'error', title: 'Error', text: res.mensaje });
            this.cargarOrdenes();
          }
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado' });
          this.cargarOrdenes();
        }
      });
    });
  }
}
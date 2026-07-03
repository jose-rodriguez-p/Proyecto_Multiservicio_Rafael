import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface OrdenResumen {
  idOrdenServicio:     number;
  hora:                string;
  cliente:             string;
  dniCliente:          string;
  descripcionVehiculo: string;
  precioManoObra:      number;
  precioTotal:         number;
  estado:              string;
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

  private URL = `${API_BASE_URL}/api/mantenimiento`;

  resumen: ResumenMantenimiento = { totalOrdenes: 0, montoTotal: 0, ticketPromedio: 0 };
  cargandoResumen = true;
  enCrear = false;

  ordenes: OrdenResumen[] = [];
  cargandoTabla = true;
  busqueda = '';
  paginaActual = 1;
  porPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;
  private timerBusqueda: any;

  constructor() {
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.enCrear = e.urlAfterRedirects.includes('/mantenimiento/crear');
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
      this.cargarOrdenes();
    }
  }

  cargarResumen() {
    this.cargandoResumen = true;
    this.http.get<ResumenMantenimiento>(`${this.URL}/resumen`).subscribe({
      next:  (r) => { this.resumen = r; this.cargandoResumen = false; },
      error: ()  => { this.cargandoResumen = false; }
    });
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
      },
      error: () => { this.cargandoTabla = false; }
    });
  }

  onBusqueda() {
    clearTimeout(this.timerBusqueda);
    this.timerBusqueda = setTimeout(() => { this.paginaActual = 1; this.cargarOrdenes(); }, 400);
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

  cambiarPorPagina() { this.paginaActual = 1; this.cargarOrdenes(); }

  nuevoMantenimiento() { this.router.navigate(['/sistema/servicio/mantenimiento/crear']); }

  badgeEstado(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'completado': return 'bg-success';
      case 'en proceso': return 'bg-warning text-dark';
      case 'pendiente':  return 'bg-secondary';
      default:           return 'bg-light text-dark border';
    }
  }
}
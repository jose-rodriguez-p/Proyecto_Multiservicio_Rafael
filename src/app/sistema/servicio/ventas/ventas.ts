import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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

  resumen: ResumenHoy = { totalVentas: 0, montoTotalHoy: 0, ticketPromedio: 0 };
  cargandoResumen = true;
  enCrear = false;

  ventas: VentaResumen[] = [];
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
      this.enCrear = e.urlAfterRedirects.includes('/ventas/crear');
      if (isPlatformBrowser(this.platformId) && !this.enCrear) {
        this.cargarVentas();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarVentas();
    }
  }
  

  cargarVentas() {
    this.cargandoTabla = true;
    
    let params = new HttpParams()
      .set('pagina', this.paginaActual.toString())
      .set('porPagina', this.porPagina.toString());
    
    if (this.busqueda) {
      params = params.set('busqueda', this.busqueda);
    }
    
    this.http.get<{ ventas: VentaResumen[], totalRegistros: number }>(`${this.URL}/listar`, { params })
      .subscribe({
        next: (res) => {
          this.ventas = res.ventas;
          this.totalRegistros = res.totalRegistros;
          this.totalPaginas = Math.ceil(this.totalRegistros / this.porPagina);
          this.cargandoTabla = false;
          this.actualizarResumen();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando ventas:', err);
          this.cargandoTabla = false;
          this.cdr.detectChanges();
        }
      });
  }

  private actualizarResumen() {
    const totalVentas = this.totalRegistros;
    const montoTotalHoy = this.ventas.reduce((sum, v) => sum + v.total, 0);
    const ticketPromedio = totalVentas > 0 ? montoTotalHoy / totalVentas : 0;
    this.resumen = { totalVentas, montoTotalHoy, ticketPromedio };
    this.cargandoResumen = false;
  }

  onBusqueda() {
    this.paginaActual = 1;
    this.cargarVentas();
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
    this.cargarVentas();
  }

  get ventasFiltradas(): VentaResumen[] {
    if (!this.fechaFiltro) return this.ventas;
    return this.ventas.filter(v => v.fecha === this.fechaFiltro);
  }

  cambiarPorPagina() { this.paginaActual = 1; this.cargarVentas(); }

  nuevaVenta() { this.router.navigate(['/sistema/servicio/ventas/crear']); }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFechaChange() {
    this.paginaActual = 1;
    this.cargarVentas();
  }
}
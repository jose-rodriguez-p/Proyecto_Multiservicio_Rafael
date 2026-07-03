import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
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

  private URL = `${API_BASE_URL}/api/ventas`;

  resumen: ResumenHoy = { totalVentas: 0, montoTotalHoy: 0, ticketPromedio: 0 };
  cargandoResumen = true;
  enCrear = false;

  ventas: VentaResumen[] = [];
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
      this.enCrear = e.urlAfterRedirects.includes('/ventas/crear');
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
      this.cargarVentas();
    }
  }
  

  cargarResumen() {
    this.cargandoResumen = true;
    // Por ahora, resumen inicializado en 0, se puede agregar endpoint en backend si necesario
    this.resumen = { totalVentas: 0, montoTotalHoy: 0, ticketPromedio: 0 };
    this.cargandoResumen = false;
  }

  cargarVentas() {
    this.cargandoTabla = true;
    
    // Para el resumen, vamos a traer todas las ventas (sin paginación)
    let paramsResumen = new HttpParams()
      .set('pagina', '1')
      .set('porPagina', '10000'); // Un número grande para traer todas las ventas
    
    this.http.get<{ ventas: VentaResumen[], totalRegistros: number }>(`${this.URL}/listar`, { params: paramsResumen })
      .subscribe({
        next: (resResumen) => {
          // Calcular el resumen a partir de todas las ventas
          const todasLasVentas = resResumen.ventas;
          const totalVentas = todasLasVentas.length;
          const montoTotalHoy = todasLasVentas.reduce((sum, v) => sum + v.total, 0);
          const ticketPromedio = totalVentas > 0 ? montoTotalHoy / totalVentas : 0;
          
          this.resumen = { totalVentas, montoTotalHoy, ticketPromedio };
          this.cargandoResumen = false;
        },
        error: (err) => {
          console.error('Error cargando resumen:', err);
          this.cargandoResumen = false;
        }
      });
    
    // Cargar ventas paginadas para la tabla
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
        },
        error: (err) => {
          console.error('Error cargando ventas:', err);
          this.cargandoTabla = false;
        }
      });
  }

  onBusqueda() {
    clearTimeout(this.timerBusqueda);
    this.timerBusqueda = setTimeout(() => { this.paginaActual = 1; this.cargarVentas(); }, 400);
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

  cambiarPorPagina() { this.paginaActual = 1; this.cargarVentas(); }

  nuevaVenta() { this.router.navigate(['/sistema/servicio/ventas/crear']); }
}
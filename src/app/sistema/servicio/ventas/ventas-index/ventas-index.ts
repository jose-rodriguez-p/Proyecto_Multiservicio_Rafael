import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

interface VentaResumen {
  idOrdenVenta:   number;
  hora:           string;
  cliente:        string;
  dniCliente:     string;
  vendedor:       string;
  precioTotal:    number;
  totalRegistros: number;
}

interface ResumenHoy {
  totalVentas:    number;
  montoTotalHoy:  number;
  ticketPromedio: number;
}

@Component({
  selector: 'app-ventas-index',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas-index.html',
  styleUrl: './ventas-index.css',
})
export class VentasIndex implements OnInit {

  private URL = 'http://localhost:8080/api/ventas';

  // ── Resumen ─────────────────────────────────────────────────────────────────
  resumen: ResumenHoy = { totalVentas: 0, montoTotalHoy: 0, ticketPromedio: 0 };
  cargandoResumen = true;

  // ── Tabla ───────────────────────────────────────────────────────────────────
  ventas: VentaResumen[] = [];
  cargandoTabla = true;

  // ── Paginación ──────────────────────────────────────────────────────────────
  paginaActual   = 1;
  porPagina      = 10;
  totalRegistros = 0;
  totalPaginas   = 0;

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  busqueda       = '';
  private timerBusqueda: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarResumen();
    this.cargarVentas();
  }

  // ── Resumen del día ───────────────────────────────────────────────────────
  cargarResumen() {
    this.cargandoResumen = true;
    this.http.get<ResumenHoy>(`${this.URL}/resumen-hoy`).subscribe({
      next:  (r) => { this.resumen = r; this.cargandoResumen = false; },
      error: ()  => { this.cargandoResumen = false; }
    });
  }

  // ── Tabla paginada ────────────────────────────────────────────────────────
  cargarVentas() {
    this.cargandoTabla = true;
    const params = new HttpParams()
      .set('pagina',     this.paginaActual)
      .set('porPagina',  this.porPagina)
      .set('busqueda',   this.busqueda.trim());

    this.http.get<any>(`${this.URL}/listar`, { params }).subscribe({
      next: (res) => {
        this.ventas          = res.datos          || [];
        this.totalRegistros  = res.totalRegistros || 0;
        this.totalPaginas    = res.totalPaginas   || 0;
        this.paginaActual    = res.paginaActual   || 1;
        this.cargandoTabla   = false;
      },
      error: () => { this.cargandoTabla = false; }
    });
  }

  // ── Búsqueda con debounce (espera 400ms antes de llamar) ──────────────────
  onBusqueda() {
    clearTimeout(this.timerBusqueda);
    this.timerBusqueda = setTimeout(() => {
      this.paginaActual = 1;
      this.cargarVentas();
    }, 400);
  }

  // ── Paginación ────────────────────────────────────────────────────────────
  get paginas(): number[] {
    // Muestra máximo 5 páginas alrededor de la actual
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

  cambiarPorPagina() {
    this.paginaActual = 1;
    this.cargarVentas();
  }

  // ── Navegación ────────────────────────────────────────────────────────────
  nuevaVenta() {
  this.router.navigate(['/sistema/servicio/ventas/crear']);
}
}
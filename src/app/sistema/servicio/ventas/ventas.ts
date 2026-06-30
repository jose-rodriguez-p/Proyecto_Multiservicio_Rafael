import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface VentaResumen {
  idOrdenVenta: number;
  fecha:        string;
  hora:         string;
  cliente:      string;
  dniCliente:   string;
  vendedor:     string;
  metodoPago:   string;
  precioTotal:  number;
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
    // Simulación — reemplazar con: this.http.get<ResumenHoy>(`${this.URL}/resumen-hoy`).subscribe(...)
    this.resumen = { totalVentas: 12, montoTotalHoy: 3450.00, ticketPromedio: 287.50 };
    this.cargandoResumen = false;
  }

  cargarVentas() {
    this.cargandoTabla = true;
    // Simulación — reemplazar con llamada real al back con HttpParams
    this.ventas = [
      { idOrdenVenta: 4, fecha: '27/06/2026', hora: '11:20', cliente: 'Robert Tucto',   dniCliente: '74771893', vendedor: 'admin', metodoPago: 'Yape',         precioTotal: 450.00 },
      { idOrdenVenta: 3, fecha: '27/06/2026', hora: '10:45', cliente: 'Cliente Varios', dniCliente: '00000000', vendedor: 'admin', metodoPago: 'Efectivo',      precioTotal: 95.00  },
      { idOrdenVenta: 2, fecha: '27/06/2026', hora: '09:30', cliente: 'Jose Rodriguez', dniCliente: '74622234', vendedor: 'admin', metodoPago: 'Transferencia', precioTotal: 180.50 },
      { idOrdenVenta: 1, fecha: '27/06/2026', hora: '08:15', cliente: 'Rafael Mendoza', dniCliente: '75481236', vendedor: 'admin', metodoPago: 'Tarjeta',       precioTotal: 320.00 },
    ];
    this.totalRegistros = 4;
    this.totalPaginas   = 1;
    this.cargandoTabla  = false;
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
import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [ChartjsComponent, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private URL_DASHBOARD = `${API_BASE_URL}/api/dashboard`;
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  fechaDesde = '';
  fechaHasta = '';
  filtroActivo = 'mes';
  cargando = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fechaHasta = new Date().toISOString().slice(0, 10);
      const d = new Date();
      d.setDate(1);
      this.fechaDesde = d.toISOString().slice(0, 10);
      this.cargarEstadisticas();
    }
  }

  aplicarFiltroRapido(periodo: string) {
    this.filtroActivo = periodo;
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().slice(0, 10);
    switch (periodo) {
      case 'hoy':
        this.fechaDesde = this.fechaHasta;
        break;
      case 'semana': {
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
        this.fechaDesde = lunes.toISOString().slice(0, 10);
        break;
      }
      case 'mes': {
        const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaDesde = primero.toISOString().slice(0, 10);
        break;
      }
      case 'anio':
        this.fechaDesde = `${hoy.getFullYear()}-01-01`;
        break;
    }
    this.cargarEstadisticas();
  }

  onFechasChange() {
    this.filtroActivo = '';
    if (this.fechaDesde && this.fechaHasta) {
      this.cargarEstadisticas();
    }
  }

  cargarEstadisticas() {
    this.cargando = true;
    const params = `?fechaDesde=${this.fechaDesde}&fechaHasta=${this.fechaHasta}`;
    this.http.get<any>(`${this.URL_DASHBOARD}/estadisticas${params}`).subscribe({
      next: (data) => {
        this.construirResumen(data.resumen);
        this.construirVentasMensuales(data.ventasMensuales);
        this.construirStockPorCategoria(data.stockPorCategoria);
        this.construirOrdenesPorEstado(data.ordenesPorEstado);
        this.construirVentasVServicios(data.ventasVServicios);
        this.topProductos = data.topProductos || [];
        this.topServicios = data.topServicios || [];
        this.topTrabajadores = data.topTrabajadores || [];
        this.productosCriticos = data.productosStockCritico || [];
        this.actividadReciente = data.ultimaActividad || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar dashboard:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  porcentajeVariacion(actual: number, anterior: number): string {
    if (anterior === 0) return actual > 0 ? '+100%' : '0%';
    const pct = ((actual - anterior) / anterior) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  }

  esVariacionPositiva(actual: number, anterior: number): boolean {
    return actual >= anterior;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private construirResumen(r: any) {
    this.stats = [
      {
        title: 'Ventas del Mes',
        value: `S/ ${(r.ventasMesActual ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        icon: 'bi-cash-stack',
        color: 'text-success',
        variacion: this.porcentajeVariacion(r.ventasMesActual ?? 0, r.ventasMesAnterior ?? 0),
        positiva: this.esVariacionPositiva(r.ventasMesActual ?? 0, r.ventasMesAnterior ?? 0),
      },
      {
        title: 'Servicios del Mes',
        value: (r.ordenesServicioMes ?? 0).toString(),
        icon: 'bi-tools',
        color: 'text-primary',
        variacion: this.porcentajeVariacion(r.ordenesServicioMes ?? 0, r.ordenesServicioMesAnterior ?? 0),
        positiva: this.esVariacionPositiva(r.ordenesServicioMes ?? 0, r.ordenesServicioMesAnterior ?? 0),
      },
      {
        title: 'Stock Crítico',
        value: (r.productosBajoStock ?? 0).toString(),
        icon: 'bi-exclamation-triangle',
        color: 'text-danger',
        variacion: '',
        positiva: false,
      },
      {
        title: 'Proveedores Activos',
        value: (r.proveedoresActivos ?? 0).toString(),
        icon: 'bi-building',
        color: 'text-info',
        variacion: '',
        positiva: true,
      },
    ];
  }

  private construirVentasMensuales(data: any[]) {
    if (!data || data.length === 0) {
      this.ventasChartData = { labels: [], datasets: [] };
      return;
    }
    const labels = data.map((d) => {
      const f = new Date(d.mes + 'T00:00:00');
      return f.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
    });
    const valores = data.map((d) => Number(d.total));
    const tendencia = this.calcularTendencia(valores);

    this.ventasChartData = {
      labels,
      datasets: [
        {
          label: 'Tendencia',
          borderColor: '#636f83',
          borderDash: [5, 3],
          borderWidth: 2,
          pointRadius: 0,
          type: 'line',
          fill: false,
          data: tendencia,
        },
        {
          label: 'Ventas (S/)',
          backgroundColor: 'rgba(255, 59, 48, 0.75)',
          borderColor: '#ff3b30',
          borderWidth: 1,
          data: valores,
        },
      ],
    };
  }

  private calcularTendencia(data: number[]): number[] {
    const n = data.length;
    if (n < 2) return data.slice();
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }
    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercepto = (sumY - pendiente * sumX) / n;
    return Array.from({ length: n }, (_, i) => Math.round((pendiente * i + intercepto) * 100) / 100);
  }

  private construirStockPorCategoria(data: any[]) {
    if (!data || data.length === 0) {
      this.stockChartData = { labels: [], datasets: [] };
      return;
    }
    this.stockChartData = {
      labels: data.map((d) => d.categoria),
      datasets: [
        { label: 'Sin Stock', backgroundColor: '#e55353', data: data.map((d) => d.sinStock) },
        { label: 'Bajo Stock', backgroundColor: '#f9b115', data: data.map((d) => d.bajoStock) },
        { label: 'En Stock', backgroundColor: '#2eb85c', data: data.map((d) => d.enStock) },
      ],
    };
  }

  private construirOrdenesPorEstado(data: any[]) {
    if (!data || data.length === 0) {
      this.serviciosChartData = { labels: [], datasets: [] };
      return;
    }
    const colores: Record<string, string> = {
      'Pendiente': '#3399ff',
      'En Proceso': '#f9b115',
      'Completado': '#2eb85c',
    };
    this.serviciosChartData = {
      labels: data.map((d) => d.estado),
      datasets: [
        {
          backgroundColor: data.map((d) => colores[d.estado] || '#636f83'),
          data: data.map((d) => d.total),
        },
      ],
    };
  }

  private construirVentasVServicios(data: any[]) {
    if (!data || data.length === 0) {
      this.ventasVServiciosData = { labels: [], datasets: [] };
      return;
    }
    this.ventasVServiciosData = {
      labels: data.map((d) => {
        const f = new Date(d.mes + 'T00:00:00');
        return f.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
      }),
      datasets: [
        {
          label: 'Ventas (S/)',
          borderColor: '#ff3b30',
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          data: data.map((d) => Number(d.ventas)),
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Servicios (S/)',
          borderColor: '#3399ff',
          backgroundColor: 'rgba(51, 153, 255, 0.1)',
          data: data.map((d) => Number(d.servicios)),
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }

  irAReabastecimiento() {
    this.router.navigate(['/sistema/compra/nueva-compra']);
  }

  stats: any[] = [];
  topProductos: any[] = [];
  topServicios: any[] = [];
  topTrabajadores: any[] = [];
  productosCriticos: any[] = [];
  actividadReciente: any[] = [];

  ventasChartData: any = { labels: [], datasets: [] };
  stockChartData: any = { labels: [], datasets: [] };
  serviciosChartData: any = { labels: [], datasets: [] };
  ventasVServiciosData: any = { labels: [], datasets: [] };

  chartOptionsBar = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (v: any) => 'S/ ' + Number(v).toLocaleString() } },
    },
  };

  chartOptionsPie = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.4,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const } },
  };

  chartOptionsLine = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (v: any) => 'S/ ' + Number(v).toLocaleString() } },
    },
  };

  chartOptionsDoughnut = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.4,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'right' as const } },
  };
}

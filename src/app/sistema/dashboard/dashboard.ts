import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrado una sola vez, a nivel de módulo: el profesor pidió que los
// valores de las gráficas no queden en blanco cuando el mouse no está encima
// (el tooltip por hover puede seguir existiendo, pero además debe verse el
// dato "fijo" todo el tiempo). El plugin se registra de forma global y cada
// gráfica activa/desactiva y da formato a sus propios datalabels por medio
// de "plugins.datalabels" dentro de cada chartOptions de abajo.
Chart.register(ChartDataLabels);

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
        // Antes esto tomaba "el lunes de esta semana" hasta hoy: si hoy es
        // lunes, fechaDesde = fechaHasta = hoy y el rango queda de 1 solo
        // día. El profesor pidió que "semana" muestre siempre la última
        // semana completa (de este lunes al lunes anterior), sin importar
        // qué día de la semana sea hoy.
        const diaSemana = hoy.getDay(); // 0 = domingo
        const lunesActual = new Date(hoy);
        lunesActual.setDate(hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));
        const lunesAnterior = new Date(lunesActual);
        lunesAnterior.setDate(lunesActual.getDate() - 7);
        this.fechaDesde = lunesAnterior.toISOString().slice(0, 10);
        this.fechaHasta = lunesActual.toISOString().slice(0, 10);
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
        this.construirResumen(data.resumen || {});
        this.granularidadTendencia = data.granularidadTendencia || 'mes';
        this.construirVentasMensuales(data.ventasMensuales);
        this.construirStockPorCategoria(data.stockPorCategoria);
        this.construirOrdenesPorEstado(data.ordenesPorEstado);
        this.construirVentasVServicios(data.ventasVServicios);
        this.construirComparativoProductos(data.comparativoProductos);
        this.topProductos = data.topProductos || [];
        this.topServicios = data.topServicios || [];
        this.topTrabajadores = data.topTrabajadores || [];
        this.productosCriticos = data.productosStockCritico || [];
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

  // Comparativo mensual: Ventas vs Compras (a proveedor) vs Utilidad neta
  // (ventas - compras). El backend debe entregar, para cada mes del rango,
  // un objeto { mes: 'YYYY-MM-DD', ventas: number, compras: number }.
  // Se mantiene compatibilidad con el shape viejo { mes, total } por si
  // algún consumidor antiguo del endpoint todavía lo usa (total -> ventas).
  granularidadTendencia: 'hour' | 'day' | 'week' | 'month' | string = 'month';

  // Formatea la etiqueta del eje X de las gráficas de tendencia según la
  // granularidad que decidió el backend para el rango filtrado: hora
  // ("14:00", solo cuando el rango es un único día, p.ej. filtro "Hoy"),
  // día ("16 jul"), semana ("sem. 13 jul") o mes ("jul. 26", como antes).
  private formatearEtiquetaPeriodo(fechaIso: string): string {
    if (this.granularidadTendencia === 'hour') {
      // El backend entrega "YYYY-MM-DD HH:00:00" (con espacio) para horas;
      // se reemplaza por "T" para que el navegador lo parsee como fecha local.
      const f = new Date(fechaIso.replace(' ', 'T'));
      return f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    }
    const f = new Date(fechaIso + 'T00:00:00');
    if (this.granularidadTendencia === 'day') {
      return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    }
    if (this.granularidadTendencia === 'week') {
      return 'sem. ' + f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    }
    return f.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
  }

  private construirVentasMensuales(data: any[]) {
    if (!data || data.length === 0) {
      this.ventasChartData = { labels: [], datasets: [] };
      return;
    }
    const labels = data.map((d) => this.formatearEtiquetaPeriodo(d.mes));
    const ventas = data.map((d) => Number(d.ventas ?? d.total ?? 0));
    const compras = data.map((d) => Number(d.compras ?? 0));
    const utilidad = ventas.map((v, i) => Math.round((v - compras[i]) * 100) / 100);

    this.ventasChartData = {
      labels,
      datasets: [
        {
          label: 'Ventas (S/)',
          borderColor: '#ff3b30',
          backgroundColor: '#ff3b30',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ff3b30',
          fill: false,
          tension: 0.3,
          data: ventas,
        },
        {
          label: 'Compras (S/)',
          borderColor: '#f9b115',
          backgroundColor: '#f9b115',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f9b115',
          fill: false,
          tension: 0.3,
          data: compras,
        },
        {
          label: 'Utilidad neta (S/)',
          borderColor: '#2eb85c',
          backgroundColor: '#2eb85c',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#2eb85c',
          fill: false,
          tension: 0.3,
          data: utilidad,
        },
      ],
    };
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
      'En proceso': '#f9b115',
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
      labels: data.map((d) => this.formatearEtiquetaPeriodo(d.mes)),
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

  // NUEVO: comparativo de productos ingresados (compras a proveedor) vs
  // vendidos, por mes, para ver de un vistazo si el ritmo de reabastecimiento
  // acompaña al de ventas (o si se está comprando de más/de menos).
  private construirComparativoProductos(data: any[]) {
    if (!data || data.length === 0) {
      this.comparativoProductosData = { labels: [], datasets: [] };
      return;
    }
    this.comparativoProductosData = {
      labels: data.map((d) => this.formatearEtiquetaPeriodo(d.mes)),
      datasets: [
        {
          label: 'Ingresados (compras)',
          backgroundColor: 'rgba(46, 184, 92, 0.75)',
          borderColor: '#2eb85c',
          borderWidth: 1,
          data: data.map((d) => Number(d.ingresados)),
        },
        {
          label: 'Vendidos',
          backgroundColor: 'rgba(255, 59, 48, 0.75)',
          borderColor: '#ff3b30',
          borderWidth: 1,
          data: data.map((d) => Number(d.vendidos)),
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

  ventasChartData: any = { labels: [], datasets: [] };
  stockChartData: any = { labels: [], datasets: [] };
  serviciosChartData: any = { labels: [], datasets: [] };
  ventasVServiciosData: any = { labels: [], datasets: [] };
  comparativoProductosData: any = { labels: [], datasets: [] };

  // Formatea un valor en soles para los datalabels de barras/líneas de
  // dinero. Se oculta (string vacío) solo cuando el valor es 0, para no
  // ensuciar la gráfica con "S/ 0.00" en cada período sin movimiento.
  private datalabelSoles = {
    display: 'auto' as const, // Chart.js oculta automáticamente las etiquetas que se solaparían, pero deja ver todas las que sí entran (nunca "todo en blanco")
    color: '#4a4a4a',
    font: { size: 10, weight: 'bold' as const },
    anchor: 'end' as const,
    align: 'top' as const,
    formatter: (v: number) => (v ? 'S/ ' + Number(v).toLocaleString('es-PE', { maximumFractionDigits: 0 }) : ''),
  };

  private datalabelUnidades = {
    display: 'auto' as const,
    color: '#4a4a4a',
    font: { size: 10, weight: 'bold' as const },
    anchor: 'end' as const,
    align: 'top' as const,
    formatter: (v: number) => (v ? Number(v).toLocaleString('es-PE') : ''),
  };

  chartOptionsBar = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const }, datalabels: this.datalabelSoles },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (v: any) => 'S/ ' + Number(v).toLocaleString() } },
    },
  };

  // Igual que chartOptionsBar pero en unidades (no soles) — para el
  // comparativo de productos ingresados vs vendidos.
  chartOptionsBarUnidades = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const }, datalabels: this.datalabelUnidades },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { callback: (v: any) => Number(v).toLocaleString() + ' u.' } },
    },
  };

  // El profesor pidió que la gráfica de pastel muestre el porcentaje de
  // cada porción directamente encima de ella, siempre visible (no solo al
  // pasar el mouse). El % se calcula sobre el total del propio dataset.
  chartOptionsPie = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.4,
    animation: { duration: 0 },
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      datalabels: {
        display: true,
        color: '#fff',
        font: { size: 12, weight: 'bold' as const },
        formatter: (value: number, context: any) => {
          const datos: number[] = context.chart.data.datasets[context.datasetIndex].data;
          const total = datos.reduce((acc, v) => acc + Number(v || 0), 0);
          if (!total) return '';
          return ((Number(value) / total) * 100).toFixed(0) + '%';
        },
      },
    },
  };

  chartOptionsLine = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    animation: { duration: 0 },
    plugins: { legend: { display: true, position: 'bottom' as const }, datalabels: this.datalabelSoles },
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
    plugins: {
      legend: { display: true, position: 'right' as const },
      datalabels: {
        display: true,
        color: '#fff',
        font: { size: 12, weight: 'bold' as const },
        formatter: (value: number, context: any) => {
          const datos: number[] = context.chart.data.datasets[context.datasetIndex].data;
          const total = datos.reduce((acc, v) => acc + Number(v || 0), 0);
          if (!total) return '';
          return ((Number(value) / total) * 100).toFixed(0) + '%';
        },
      },
    },
  };

  // Barras horizontales APILADAS: para "composición" (sin stock / bajo stock /
  // en stock dentro de cada categoría) esto se lee mucho mejor que barras
  // agrupadas — cada categoría es una sola barra, no tres compitiendo por
  // espacio, y no se aprieta aunque haya varias categorías.
  chartOptionsStock = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.1,
    indexAxis: 'y' as const,
    animation: { duration: 0 },
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      datalabels: {
        display: (context: any) => Number(context.dataset.data[context.dataIndex]) > 0, // oculta solo el "0" dentro de un segmento vacío de la barra apilada
        color: '#fff',
        font: { size: 10, weight: 'bold' as const },
        formatter: (v: number) => Number(v).toLocaleString('es-PE'),
      },
    },
    scales: {
      x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
      y: { stacked: true, grid: { display: false } },
    },
  };
}
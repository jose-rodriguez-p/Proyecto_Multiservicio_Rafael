import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { infoTabla, infoAccion } from './auditoria.helpers';

export interface ActividadAuditoria {
  fecha: string;
  tipoAccion: string;
  tabla: string;
  idRegistro: number | null;
  descripcion: string;
  usuario: string;
  nombreTrabajador: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
}

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'año' | '';

@Component({
  selector: 'app-auditoria',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria implements OnInit {
  private URL_AUDITORIA = `${API_BASE_URL}/api/auditoria`;
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  cargando = signal(false);
  mostrarModalRuta = signal(false);
  actividades = signal<ActividadAuditoria[]>([]);
  total = signal(0);
  usuariosDisponibles = signal<{ usuario: string; nombre: string }[]>([]);
  tablasDisponibles = signal<string[]>([]);
  tiposAccionDisponibles = signal<string[]>([]);
  pagina = signal(1);

  fechaDesde = '';
  fechaHasta = '';
  usuarioSeleccionado = '';
  tablaSeleccionada = '';
  tipoAccionSeleccionado = '';
  tamanoPagina = 10;
  rangoActivo: RangoFecha = 'mes';

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamanoPagina)));

  paginas = computed(() => {
    const rango = 2;
    const actual = this.pagina();
    const totalP = this.totalPaginas();
    const inicio = Math.max(1, actual - rango);
    const fin = Math.min(totalP, actual + rango);
    const arr: number[] = [];
    for (let i = inicio; i <= fin; i++) arr.push(i);
    return arr;
  });

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url || '';
        this.mostrarModalRuta.set(url.includes('detalles-auditoria'));
      });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setRango('mes');
      this.cargarFiltros();
      this.cargarActividad();
    }
  }

  cargarFiltros() {
    this.http.get<any>(`${this.URL_AUDITORIA}/filtros`).subscribe({
      next: (data) => {
        this.usuariosDisponibles.set(data.usuarios || []);
        this.tablasDisponibles.set(data.tablas || []);
        this.tiposAccionDisponibles.set(data.tiposAccion || []);
      },
      error: (err) => console.error('Error al cargar filtros de auditoría', err),
    });
  }

  cargarActividad() {
    this.cargando.set(true);
    const params: Record<string, string> = {
      fechaDesde: this.fechaDesde,
      fechaHasta: this.fechaHasta,
      pagina: String(this.pagina()),
      tamanoPagina: String(this.tamanoPagina),
    };
    if (this.usuarioSeleccionado) params['usuario'] = this.usuarioSeleccionado;
    if (this.tablaSeleccionada) params['tabla'] = this.tablaSeleccionada;
    if (this.tipoAccionSeleccionado) params['tipoAccion'] = this.tipoAccionSeleccionado;

    this.http.get<any>(`${this.URL_AUDITORIA}/actividad`, { params }).subscribe({
      next: (data) => {
        this.actividades.set(data.actividades || []);
        this.total.set(data.total || 0);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar actividad de auditoría', err);
        this.actividades.set([]);
        this.total.set(0);
        this.cargando.set(false);
      },
    });
  }

  aplicarFiltros() {
    this.pagina.set(1);
    this.cargarActividad();
  }

  limpiarFiltros() {
    this.usuarioSeleccionado = '';
    this.tablaSeleccionada = '';
    this.tipoAccionSeleccionado = '';
    this.setRango('mes');
  }

  cambiarPorPagina() {
    this.pagina.set(1);
    this.cargarActividad();
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas() || p === this.pagina()) return;
    this.pagina.set(p);
    this.cargarActividad();
  }

  // --- Selector de rango de fechas (mismo cálculo que en Mantenimiento) ---

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

    this.fechaDesde = inicio.toISOString().split('T')[0];
    this.fechaHasta = fin.toISOString().split('T')[0];
    this.rangoActivo = tipo;
    this.aplicarFiltros();
  }

  onFechaManual() {
    this.rangoActivo = '';
    this.aplicarFiltros();
  }

  verDetalles(act: ActividadAuditoria) {
    this.router.navigate(['/sistema/auditoria/detalles-auditoria'], {
      state: { actividad: act },
    });
  }

  infoTabla(tabla: string) {
    return infoTabla(tabla);
  }

  infoAccion(accion: string) {
    return infoAccion(accion);
  }

  etiquetaTabla(tabla: string): string {
    return infoTabla(tabla).etiqueta;
  }

  formatearFecha(fechaIso: string): string {
    const f = new Date(fechaIso);
    return f.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  }
}
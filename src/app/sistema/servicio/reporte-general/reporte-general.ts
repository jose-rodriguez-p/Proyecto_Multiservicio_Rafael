import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface ReporteItem {
  nOrden:   number;
  fecha:    string;
  hora:     string;
  tipo:     string;
  cliente:  string;
  dni:      string;
  carro:    string;
  repuesto: string;
  mecanico: string;
  vendedor: string;
  total:    number;
}

interface ResumenReporte {
  totalRegistros:  number;
  montoTotal:      number;
  ticketPromedio:  number;
}

type RangoFecha = 'hoy' | 'semana' | 'mes' | 'año' | '';

@Component({
  selector: 'app-reporte-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-general.html',
  styleUrl: './reporte-general.css',
})
export class ReporteGeneral implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/reporteVentaMant`;

  cargandoTabla = true;
  todosRegistros: ReporteItem[] = [];

  busqueda = '';

  fechaInicio = '';
  fechaFin = '';
  rangoActivo: RangoFecha = 'mes';

  paginaActual = 1;
  porPagina = 10;

  ngOnInit() {
    this.setRango('mes');
    this.cargarRegistros();
  }

  cargarRegistros() {
    this.cargandoTabla = true;
    this.http.get<ReporteItem[]>(`${this.URL}/listar`).subscribe({
      next: (res) => {
        this.todosRegistros = res || [];
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.todosRegistros = [];
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      },
    });
  }

  get registrosFiltrados(): ReporteItem[] {
    const texto = this.busqueda.trim().toLowerCase();
    return this.todosRegistros.filter(r => {
      const coincideTexto = !texto ||
        String(r.nOrden).includes(texto) ||
        r.cliente?.toLowerCase().includes(texto) ||
        r.dni?.toLowerCase().includes(texto) ||
        r.tipo?.toLowerCase().includes(texto) ||
        r.carro?.toLowerCase().includes(texto) ||
        r.repuesto?.toLowerCase().includes(texto) ||
        r.mecanico?.toLowerCase().includes(texto) ||
        r.vendedor?.toLowerCase().includes(texto);
      const fecha = r.fecha ?? '';
      const dentroInicio = !this.fechaInicio || fecha >= this.fechaInicio;
      const dentroFin = !this.fechaFin || fecha <= this.fechaFin;
      return coincideTexto && dentroInicio && dentroFin;
    });
  }

  get registros(): ReporteItem[] {
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.registrosFiltrados.slice(inicio, inicio + this.porPagina);
  }

  get totalRegistros(): number {
    return this.registrosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalRegistros / this.porPagina));
  }

  get resumen(): ResumenReporte {
    const lista = this.registrosFiltrados;
    const totalRegistros = lista.length;
    const montoTotal = lista.reduce((sum, r) => sum + (r.total || 0), 0);
    const ticketPromedio = totalRegistros > 0 ? montoTotal / totalRegistros : 0;
    return { totalRegistros, montoTotal, ticketPromedio };
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
    const fin = Math.min(this.totalPaginas, this.paginaActual + rango);
    const arr: number[] = [];
    for (let i = inicio; i <= fin; i++) arr.push(i);
    return arr;
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas || p === this.paginaActual) return;
    this.paginaActual = p;
  }

  cambiarPorPagina() { this.paginaActual = 1; }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

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

  exportarExcel() {
    if (!this.registrosFiltrados.length) {
      Swal.fire('Atención', 'No hay registros para exportar', 'info');
      return;
    }
    const payload = this.registrosFiltrados.map(r => ({
      nOrden: r.nOrden, fecha: r.fecha, hora: r.hora, tipo: r.tipo, cliente: r.cliente, dni: r.dni,
      carro: r.carro, repuesto: r.repuesto, mecanico: r.mecanico,
      vendedor: r.vendedor, total: r.total,
    }));
    this.http.post(`${this.URL}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_General_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel se ha descargado', 'success');
      },
      error: () => Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error'),
    });
  }

  exportarPDF() {
    if (!this.registrosFiltrados.length) {
      Swal.fire('Atención', 'No hay registros para exportar', 'info');
      return;
    }
    const payload = this.registrosFiltrados.map(r => ({
      nOrden: r.nOrden, fecha: r.fecha, hora: r.hora, tipo: r.tipo, cliente: r.cliente, dni: r.dni,
      carro: r.carro, repuesto: r.repuesto, mecanico: r.mecanico,
      vendedor: r.vendedor, total: r.total,
    }));
    this.http.post(`${this.URL}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_General_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF se ha descargado', 'success');
      },
      error: () => Swal.fire('Error', 'El servidor no pudo procesar la descarga de PDF', 'error'),
    });
  }
}

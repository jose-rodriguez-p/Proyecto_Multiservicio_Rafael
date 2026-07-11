import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-compra',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './compra.html',
  styleUrl: './compra.css',
})
export class Compra implements OnInit {
  filtroBusqueda = '';
  compras: any[] = [];
  compraSeleccionada: any = null;
  detalleCompra: any[] = [];
  mostrarModalDetalle = false;
  mostrarModalRuta = false;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private URL_API = `${API_BASE_URL}/api/compras`;

  constructor(public router: Router) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url || '';
        this.mostrarModalRuta = url.includes('nueva-compra');
        if (!this.mostrarModalRuta) this.cargarCompras();
      });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCompras();
    }
  }

  cargarCompras() {
    this.http.get<any[]>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        this.compras = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 204) {
          console.error('Error al cargar compras:', err);
        }
        this.compras = [];
        this.cdr.detectChanges();
      },
    });
  }

  get comprasFiltradas() {
    const q = this.filtroBusqueda.trim().toLowerCase();
    if (!q) return this.compras;
    return this.compras.filter(
      (c) =>
        (c.nombre_proveedor || '').toLowerCase().includes(q) ||
        (c.ruc_proveedor || '').toLowerCase().includes(q),
    );
  }

  abrirNuevaCompra() {
    this.router.navigate(['/sistema/compra/nueva-compra']);
  }

  verDetalle(compra: any) {
    this.compraSeleccionada = compra;
    this.detalleCompra = [];
    this.mostrarModalDetalle = true;
    this.http.get<any[]>(`${this.URL_API}/detalle/${compra.id_oper_compra}`).subscribe({
      next: (data) => {
        this.detalleCompra = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 204) {
          Swal.fire('Error', 'No se pudo cargar el detalle de la compra.', 'error');
        }
        this.cdr.detectChanges();
      },
    });
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.compraSeleccionada = null;
    this.detalleCompra = [];
  }

  exportarExcel() {
    const payload = this.comprasFiltradas.map((c) => ({
      fecha: c.fec_compra || '',
      proveedor: c.nombre_proveedor || '',
      ruc: c.ruc_proveedor || '',
      productos: c.cantidad_items || 0,
      total: c.tot_pago || 0,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Compras_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('Éxito', 'El reporte de Excel se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.comprasFiltradas.map((c) => ({
      fecha: c.fec_compra || '',
      proveedor: c.nombre_proveedor || '',
      ruc: c.ruc_proveedor || '',
      productos: c.cantidad_items || 0,
      total: c.tot_pago || 0,
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Compras_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('Éxito', 'El reporte de PDF se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de PDF', 'error');
      },
    });
  }
}
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
  private URL_API = `${API_BASE_URL}/api/compras`;

  constructor(private http: HttpClient, public router: Router) {
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
        (c.ruc_proveedor || '').toLowerCase().includes(q) ||
        (c.usuario || '').toLowerCase().includes(q),
    );
  }

  abrirNuevaCompra() {
    this.router.navigate(['/sistema/compra/nueva-compra']);
  }

  verDetalle(compra: any) {
    this.compraSeleccionada = compra;
    this.detalleCompra = [];
    this.mostrarModalDetalle = true;
    this.http.get<any[]>(`${this.URL_API}/detalle/${compra.id_compra}`).subscribe({
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
}
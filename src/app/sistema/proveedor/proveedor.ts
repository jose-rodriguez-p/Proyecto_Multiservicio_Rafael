import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.css',
})
export class Proveedor implements OnInit {
  mostrarModal = false;
  filtroBusqueda: string = '';
  proveedores: any[] = [];

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  private URL_API = 'http://localhost:8080/api/proveedores';

  constructor() {
    this.router.events.subscribe(() => {
      const url = this.router.url || '';
      if (url.includes('agregar-proveedor') || url.includes('editar-proveedor')) {
        this.mostrarModal = true;
      } else {
        this.mostrarModal = false;
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProveedores();
    }
  }

  cargarProveedores() {
    // LLAMADA AL SERVIDOR
    this.http.get<any>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        console.log('Respuesta del servidor:', data);
        // Si el servidor envía un objeto con una lista dentro, búscala aquí:
        this.proveedores = Array.isArray(data) ? data : data.content || data.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      },
    });
  }

  get proveedoresFiltrados() {
    if (!this.proveedores) return [];
    const q = this.filtroBusqueda.toLowerCase().trim();
    return this.proveedores.filter(
      (p) => p.nombre_empresa?.toLowerCase().includes(q) || p.ruc?.toString().includes(q),
    );
  }

  abrirModal() {
    this.router.navigate(['/sistema/proveedor/agregar-proveedor']);
  }

  abrirModalEdit(proveedor: any) {
    this.router.navigate(['/sistema/proveedor/editar-proveedor', proveedor.ruc], {
      state: {
        proveedor: { ...proveedor },
      },
    });
  }

  eliminarProveedor(ruc: string) {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `RUC: ${ruc}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.URL_API}/eliminar/${ruc}`, { responseType: 'text' }).subscribe({
          next: () => {
            Swal.fire('Eliminado', '', 'success');
            this.cargarProveedores();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error'),
        });
      }
    });
  }
}

import { API_BASE_URL } from '@config';
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
  filtroEstado: string = 'Activo';
  proveedores: any[] = [];

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  private URL_API = `${API_BASE_URL}/api/proveedores`;

  constructor() {
    this.router.events.subscribe(() => {
      const url = this.router.url || '';
      if (url.includes('agregar-proveedor') || url.includes('editar-proveedor')) {
        this.mostrarModal = true;
      } else {
        if (this.mostrarModal === true) {
          this.mostrarModal = false;
          this.cargarProveedores();
        }
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProveedores();
    }
  }

  cargarProveedores() {
    this.http.get<any>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        console.log('Respuesta del servidor:', data);
        this.proveedores = Array.isArray(data) ? data : data.content || data.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      },
    });
  }

  // MODIFICADO: Ahora filtra por el término de búsqueda y por el estado seleccionado
  get proveedoresFiltrados() {
    if (!this.proveedores) return [];
    
    const q = this.filtroBusqueda.toLowerCase().trim();
    const estadoFiltro = this.filtroEstado;

    return this.proveedores.filter((p) => {
      // 1. Validar filtro por Texto (Nombre o RUC)
      const coincideTexto = p.nombre_empresa?.toLowerCase().includes(q) || p.ruc?.toString().includes(q);
      
      // 2. Validar filtro por Estado
      const coincideEstado = estadoFiltro === 'Todos' || p.estado === estadoFiltro;

      return coincideTexto && coincideEstado;
    });
  }

  aplicarFiltros() {
    this.cdr.detectChanges();
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

  exportarExcel() {
    const payload = this.proveedoresFiltrados.map((p) => ({
      ruc: p.ruc,
      nombre_empresa: p.nombre_empresa,
      celular: p.celular || '',
      correo: p.correo || '',
      direccion: p.direccion || '',
      estado: p.estado
    }));

    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    console.log('Enviando datos a:', `${this.URL_API}/export/excel`);
    console.log('Payload:', payload);
    this.http.post(`${this.URL_API}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Proveedores_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel. Verifica que el backend tenga el endpoint /export/excel para proveedores.', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.proveedoresFiltrados.map((p) => ({
      ruc: p.ruc,
      nombre_empresa: p.nombre_empresa,
      celular: p.celular || '',
      correo: p.correo || '',
      direccion: p.direccion || '',
      estado: p.estado
    }));

    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    console.log('Enviando datos a:', `${this.URL_API}/export/pdf`);
    console.log('Payload:', payload);
    this.http.post(`${this.URL_API}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Proveedores_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF. Verifica que el backend tenga el endpoint /export/pdf para proveedores.', 'error');
      },
    });
  }
}
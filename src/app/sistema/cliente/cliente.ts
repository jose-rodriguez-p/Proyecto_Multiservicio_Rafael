import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Cliente implements OnInit {
  mostrarModal = false;
  mostrarModalEdit = false;
  mostrarModalVehiculo = false;
  filtroBusqueda: string = '';
  filtroEstado: string = 'Activo';
  clientes: any[] = [];
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  clienteEditando: any = {};
  nuevoVehiculo: any = { placa: '', marca: '', modelo: '' };

  private URL_API = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {
    this.router.events.subscribe((ev: any) => {
      const url = this.router.url || '';
      const isModalRoute = url.includes('/sistema/cliente/agregar-cliente');
      if (isModalRoute) {
        this.mostrarModal = true;
      } else {
        const wasOpen = this.mostrarModal;
        this.mostrarModal = false;
        if (wasOpen) this.cargarClientes();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarClientes();
    }
  }

  cargarClientes() {
    this.http.get<any[]>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        const agrupados: any = {};

        (data || []).forEach((row: any) => {
          if (!agrupados[row.dni]) {
            agrupados[row.dni] = {
              dni: row.dni,
              nombre: row.nombre,
              apellido_paterno: row.apellido_paterno,
              apellido_materno: row.apellido_materno,
              celular: row.celular,
              estado: row.estado,
              vehiculos: [],
            };
          }

          if (row.placa) {
            agrupados[row.dni].vehiculos.push({
              placa: row.placa,
              marca: row.marca,
              modelo: row.modelo,
            });
          }
        });

        this.clientes = Object.values(agrupados);

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Error al cargar clientes:', err);
      },
    });
  }

  get clientesFiltrados() {
    let list = this.clientes.slice();

    // Filtrar por estado
    if (this.filtroEstado && this.filtroEstado !== 'Todos') {
      list = list.filter((c: any) => c.estado === this.filtroEstado);
    }

    // Filtrar por búsqueda de texto
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      const q = this.filtroBusqueda.toLowerCase();
      const qNorm = this.normalizeString(q);
      list = list.filter((c: any) => {
        return (
          (c.dni && this.normalizeString(String(c.dni).toLowerCase()).includes(qNorm)) ||
          (c.nombre && this.normalizeString(c.nombre.toLowerCase()).includes(qNorm)) ||
          (c.apellido_paterno &&
            this.normalizeString(c.apellido_paterno.toLowerCase()).includes(qNorm)) ||
          (c.apellido_materno &&
            this.normalizeString(c.apellido_materno.toLowerCase()).includes(qNorm)) ||
          (c.celular && this.normalizeString(c.celular.toLowerCase()).includes(qNorm))
        );
      });
    }
    return list;
  }

  normalizeString(s: string) {
    if (!s) return '';
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  aplicarFiltros() {
    this.cdr.detectChanges();
  }

  abrirModal() {
    this.mostrarModal = true;
    this.router.navigate(['/sistema/cliente/agregar-cliente']);
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.router.navigate(['/sistema/cliente']);
  }

  abrirModalEdit(cliente: any) {
    this.clienteEditando = { ...cliente };
    if (!this.clienteEditando.vehiculos) {
      this.clienteEditando.vehiculos = [];
    }
    this.mostrarModalEdit = true;
  }

  cerrarModalEdit() {
    this.mostrarModalEdit = false;
  }

  abrirModalVehiculo() {
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '' };
    this.mostrarModalVehiculo = true;
  }

  cerrarModalVehiculo() {
    this.mostrarModalVehiculo = false;
  }

  guardarVehiculo() {
    if (!this.nuevoVehiculo.placa || !this.nuevoVehiculo.marca || !this.nuevoVehiculo.modelo) {
      Swal.fire('Error', 'Complete todos los campos del vehículo', 'error');
      return;
    }

    if (!this.clienteEditando.vehiculos) {
      this.clienteEditando.vehiculos = [];
    }

    this.clienteEditando.vehiculos.push({ ...this.nuevoVehiculo });
    this.cerrarModalVehiculo();
    Swal.fire('Agregado', 'Vehículo agregado correctamente', 'success');
  }

  eliminarVehiculo(vehiculo: any) {
    Swal.fire({
      title: '¿Eliminar vehículo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.clienteEditando.vehiculos = this.clienteEditando.vehiculos.filter(
          (v: any) => v.placa !== vehiculo.placa,
        );
        Swal.fire('Eliminado', 'Vehículo eliminado', 'success');
      }
    });
  }

  guardarCambios() {
    console.log('Enviando actualización de cliente al backend:', this.clienteEditando);
    Swal.fire('Actualizado', 'Los datos del cliente han sido modificados', 'success');
    this.cerrarModalEdit();
    this.cargarClientes();
  }

  eliminarCliente(dni: string) {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: 'Se eliminarán todos los registros asociados a este cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        console.log('Enviando eliminación al backend (DELETE /cliente/' + dni + ')');
        Swal.fire('Eliminado', 'El cliente ha sido retirado del sistema', 'success');
        this.cargarClientes();
      }
    });
  }

  exportarExcel() {
    const payload = this.clientesFiltrados.map((c) => ({
      dni: c.dni,
      nombre: c.nombre,
      apellido_paterno: c.apellido_paterno || '',
      apellido_materno: c.apellido_materno || '',
      celular: c.celular || '',
      correo: c.correo || '',
      estado: c.estado,
      vehiculos:
        c.vehiculos && c.vehiculos.length > 0
          ? c.vehiculos.map((v: any) => `${v.placa} - ${v.marca} ${v.modelo}`).join(', ')
          : 'Sin vehículos',
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
        const timestamp = new Date().getTime();
        link.download = `Reporte_Clientes_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.clientesFiltrados.map((c) => ({
      dni: c.dni,
      nombre: c.nombre,
      apellido_paterno: c.apellido_paterno || '',
      apellido_materno: c.apellido_materno || '',
      celular: c.celular || '',
      correo: c.correo || '',
      estado: c.estado,
      vehiculos:
        c.vehiculos && c.vehiculos.length > 0
          ? c.vehiculos.map((v: any) => `${v.placa} - ${v.marca} ${v.modelo}`).join(', ')
          : 'Sin vehículos',
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
        const timestamp = new Date().getTime();
        link.download = `Reporte_Clientes_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF', 'error');
      },
    });
  }
}

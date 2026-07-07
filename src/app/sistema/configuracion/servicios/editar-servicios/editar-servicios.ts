import { API_BASE_URL } from '@config';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-servicios.html',
  styleUrl: './editar-servicios.css',
})
export class EditarServicios implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private URL = `${API_BASE_URL}/api/configuracion`;

  nombreOriginal = '';
  nombre = '';
  precio: number | null = null;
  estado = 'Activo';
  estadoOriginal = '';

  ngOnInit() {
    const state = history.state?.datosServicio;
    if (state) {
      this.nombreOriginal = state.nombre || '';
      this.nombre = state.nombre || '';
      this.precio = state.precio || null;
      this.estado = state.estado || 'Activo';
      this.estadoOriginal = state.estado || 'Activo';
    }
  }

  guardar() {
    if (!this.nombre.trim()) {
      Swal.fire('Error', 'El nombre del servicio es obligatorio.', 'warning');
      return;
    }
    if (this.precio === null || this.precio <= 0) {
      Swal.fire('Error', 'El precio debe ser mayor a 0.', 'warning');
      return;
    }

    this.http.put(`${this.URL}/servicios`, {
      nombre_original: this.nombreOriginal,
      nombre: this.nombre.trim(),
      precio: this.precio,
      estado: this.estado,
    }, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'OK') {
          Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 1500, showConfirmButton: false });
          this.router.navigate(['/sistema/configuracion/servicios'], { queryParams: { recargar: 'true' } });
        } else {
          Swal.fire('Error', res || 'No se pudo actualizar.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'No se pudo actualizar el servicio.', 'error');
      },
    });
  }

  cerrar() {
    this.router.navigate(['/sistema/configuracion/servicios']);
  }
}

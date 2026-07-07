import { API_BASE_URL } from '@config';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-servicios.html',
  styleUrl: './agregar-servicios.css',
})
export class AgregarServicios {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private URL = `${API_BASE_URL}/api/configuracion`;

  nombre = '';
  precio: number | null = null;
  estado = 'Activo';
  error = false;
  mensajeError = '';

  validar() {
    const n = this.nombre.trim();
    if (!n) {
      this.error = true;
      this.mensajeError = 'El nombre del servicio es obligatorio.';
      return;
    }
    if (this.precio === null || this.precio <= 0) {
      this.error = true;
      this.mensajeError = 'El precio debe ser mayor a 0.';
      return;
    }
    this.error = false;
  }

  guardar() {
    this.validar();
    if (this.error) return;

    this.http.post(`${this.URL}/servicios`, {
      nombre: this.nombre.trim(),
      precio: this.precio,
      estado: this.estado,
    }, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'OK') {
          Swal.fire({ icon: 'success', title: 'Servicio creado', timer: 1500, showConfirmButton: false });
          this.router.navigate(['/sistema/configuracion/servicios'], { queryParams: { recargar: 'true' } });
        } else {
          Swal.fire('Error', res || 'No se pudo crear el servicio.', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'No se pudo crear el servicio.', 'error');
      },
    });
  }

  cerrar(reload = false) {
    this.router.navigate(['/sistema/configuracion/servicios'], {
      queryParams: reload ? { recargar: 'true' } : {},
    });
  }
}

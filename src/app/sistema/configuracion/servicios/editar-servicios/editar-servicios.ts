import { API_BASE_URL } from '@config';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
  private URL_REPUESTOS = `${API_BASE_URL}/api/productos/listar-repuestos`;

  idServicio = 0;
  nombre = '';
  nombreOriginal = '';
  estado = 'Activo';

  // Repuestos disponibles y seleccionados
  todosRepuestos: any[] = [];
  repuestosSeleccionados: { nombre_repuesto: string; cantidad: number }[] = [];
  repuestoSeleccionadoNombre: string | null = null;
  repuestoCantidad = 1;

  // Servicios existentes para validar nombre duplicado
  serviciosExistentes: { nombre: string }[] = [];

  ngOnInit() {
    const state = history.state?.datosServicio;
    if (state) {
      this.idServicio = state.id_servicio || 0;
      this.nombre = state.nombre || '';
      this.nombreOriginal = state.nombre || '';
      this.estado = state.estado || 'Activo';
      this.repuestosSeleccionados = (state.repuestos || []).map((r: any) => ({
        nombre_repuesto: r.nombre_repuesto,
        cantidad: r.cantidad,
      }));
    }

    this.http.get<any[]>(this.URL_REPUESTOS).subscribe({
      next: (data) => { this.todosRepuestos = data || []; },
    });
    this.http.get<any[]>(`${this.URL}/servicios`).subscribe({
      next: (data) => { this.serviciosExistentes = data || []; },
    });
  }

  get repuestosDisponibles(): any[] {
    const seleccionados = this.repuestosSeleccionados.map(r => r.nombre_repuesto);
    return this.todosRepuestos.filter(r => !seleccionados.includes(r.nombre_repuesto));
  }

  agregarRepuesto() {
    if (!this.repuestoSeleccionadoNombre || this.repuestoCantidad < 1) return;
    const rep = this.todosRepuestos.find(r => r.nombre_repuesto === this.repuestoSeleccionadoNombre);
    if (!rep) return;
    this.repuestosSeleccionados.push({
      nombre_repuesto: rep.nombre_repuesto,
      cantidad: this.repuestoCantidad,
    });
    this.repuestoSeleccionadoNombre = null;
    this.repuestoCantidad = 1;
  }

  quitarRepuesto(idx: number) {
    this.repuestosSeleccionados.splice(idx, 1);
  }

  errorNombreDuplicado = false;

  validarNombre() {
    const n = this.nombre.trim();
    if (!n || n === this.nombreOriginal) {
      this.errorNombreDuplicado = false;
      return;
    }
    this.errorNombreDuplicado = this.serviciosExistentes.some(
      s => s.nombre.toLowerCase() === n.toLowerCase() && s.nombre.toLowerCase() !== this.nombreOriginal.toLowerCase()
    );
  }

  async guardar() {
    if (this.serviciosExistentes.length === 0) {
      try {
        const data = await firstValueFrom(this.http.get<any[]>(`${this.URL}/servicios`));
        this.serviciosExistentes = data || [];
      } catch {}
    }
    const n = this.nombre.trim();
    if (!n) {
      Swal.fire('Error', 'El nombre del servicio es obligatorio.', 'warning');
      return;
    }
    this.validarNombre();
    if (this.errorNombreDuplicado) {
      Swal.fire('Error', 'Ese nombre de servicio ya existe.', 'warning');
      return;
    }
    const payload = {
      id_servicio: this.idServicio,
      nombre: this.nombre.trim(),
      estado: this.estado,
      repuestos: this.repuestosSeleccionados.map(r => ({
        nombre_repuesto: r.nombre_repuesto,
        cantidad: r.cantidad,
      })),
    };

    this.http.put(`${this.URL}/servicios`, payload, { responseType: 'text' }).subscribe({
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

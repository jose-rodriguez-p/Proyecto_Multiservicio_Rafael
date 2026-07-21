import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActividadAuditoria } from '../auditoria';
import { infoTabla, infoAccion, rutaModulo, extraerClaveBusqueda } from '../auditoria.helpers';

@Component({
  selector: 'app-detalles-auditoria',
  imports: [CommonModule],
  templateUrl: './detalles-auditoria.html',
  styleUrl: './detalles-auditoria.css',
})
export class DetallesAuditoria {
  actividad: ActividadAuditoria | null = null;
  private router = inject(Router);

  constructor() {
    const state = history.state?.actividad;
    if (state) {
      this.actividad = state;
    } else {
      this.router.navigate(['/sistema/auditoria']);
    }
  }

  get rutaDestino(): string | null {
    if (!this.actividad) return null;
    return rutaModulo(this.actividad.tabla);
  }

  verRegistro() {
    if (!this.actividad || !this.rutaDestino) return;
    const clave = extraerClaveBusqueda(this.actividad.tabla, this.actividad.descripcion, this.actividad.idRegistro);
    this.router.navigate([this.rutaDestino], {
      queryParams: clave ? { buscar: clave } : {},
    });
  }

  infoTabla(tabla: string) {
    return infoTabla(tabla);
  }

  infoAccion(accion: string) {
    return infoAccion(accion);
  }

  formatearFechaCompleta(fechaIso: string): string {
    const f = new Date(fechaIso);
    return f.toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'medium' });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/auditoria']);
  }
}
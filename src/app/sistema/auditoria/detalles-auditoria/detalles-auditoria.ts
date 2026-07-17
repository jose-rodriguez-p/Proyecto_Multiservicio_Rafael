import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActividadAuditoria } from '../auditoria';
import { infoTabla, infoAccion } from '../auditoria.helpers';

@Component({
  selector: 'app-detalles-auditoria',
  imports: [CommonModule],
  templateUrl: './detalles-auditoria.html',
  styleUrl: './detalles-auditoria.css',
})
export class DetallesAuditoria {
  actividad: ActividadAuditoria | null = null;

  constructor(private router: Router) {
    const state = history.state?.actividad;
    if (state) {
      this.actividad = state;
    } else {
      this.router.navigate(['/sistema/auditoria']);
    }
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
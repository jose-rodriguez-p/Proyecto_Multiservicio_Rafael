import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  showRolOverlay = false;
  showCambiarContrasenaOverlay = false;

  constructor(public router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const anyOpen = this.showRolOverlay || this.showCambiarContrasenaOverlay;
document.body.style.overflow = anyOpen ? 'hidden' : '';
      this.showRolOverlay = event.urlAfterRedirects.includes('/sistema/configuracion/rol');
      this.showCambiarContrasenaOverlay = event.urlAfterRedirects.includes('/sistema/configuracion/actualizar-contrasena');
    });
  }

  // Métodos para manejar los formularios mediante SweetAlert2 (Modales dinámicos)

  abrirRoles() {
    this.router.navigate(['/sistema/configuracion/rol']);
  }

  abrirCambiarContrasena() {
    this.router.navigate(['/sistema/configuracion/actualizar-contrasena']);
  }

  abrirCategoriasProductos() {
    Swal.fire({
      title: 'Gestionar Categorías',
      input: 'text',
      inputLabel: 'Nueva Categoría de Producto',
      inputPlaceholder: 'Ej: Lubricantes Especiales',
      showCancelButton: true,
      confirmButtonText: 'Agregar'
    });
  }

  abrirAgregarTipoDocumento() {
    Swal.fire({
      title: 'Tipo de Documento',
      html: `
        <input type="text" id="doc_name" class="swal2-input" placeholder="Nombre (DNI, RUC, etc.)">
        <input type="number" id="doc_len" class="swal2-input" placeholder="Longitud de caracteres">
      `,
      confirmButtonText: 'Registrar',
      showCancelButton: true
    });
  }

  abrirEditarTipoDocumento() {
    Swal.fire({
      title: 'Editar Tipo de Documento',
      html: `
        <select id="doc_select" class="swal2-input">
          <option value="1">DNI</option>
          <option value="2">RUC</option>
        </select>
        <input type="text" id="doc_name_edit" class="swal2-input" placeholder="Nuevo Nombre">
      `,
      confirmButtonText: 'Guardar Cambios',
      showCancelButton: true
    });
  }
}

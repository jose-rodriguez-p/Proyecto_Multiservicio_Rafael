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
  showCategoriasOverlay = false;

  constructor(public router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const anyOpen = this.showRolOverlay || this.showCambiarContrasenaOverlay;
      document.body.style.overflow = anyOpen ? 'hidden' : '';
      this.showRolOverlay = event.urlAfterRedirects.includes('/sistema/configuracion/rol');
      this.showCambiarContrasenaOverlay = event.urlAfterRedirects.includes('/sistema/configuracion/actualizar-contrasena');
      this.showCategoriasOverlay = event.urlAfterRedirects.includes('/sistema/configuracion/categorias');
      
    });
  }

  // Métodos para manejar los formularios mediante SweetAlert2 (Modales dinámicos)

  abrirRoles() {
    this.router.navigate(['/sistema/configuracion/rol']);
  }

  abrirCambiarContrasena() {
    this.router.navigate(['/sistema/configuracion/actualizar-contrasena']);
  }

  abrirCategorias() {
  this.router.navigate(['/sistema/configuracion/categorias']);
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
}

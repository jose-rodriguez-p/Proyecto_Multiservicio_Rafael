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
  showMarcasOverlay = false;

  constructor(public router: Router) {
    // 1) Evaluar la URL ACTUAL de inmediato (cubre navegación directa por código,
    //    por ejemplo router.navigate(['/sistema/configuracion/actualizar-contrasena'])
    //    que dispara su NavigationEnd antes de que este componente termine de construirse).
    this.actualizarOverlays(this.router.url);

    // 2) Seguir escuchando cambios de ruta posteriores (clicks dentro de Configuración).
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.actualizarOverlays(event.urlAfterRedirects);
    });
  }

  private actualizarOverlays(url: string) {
    this.showRolOverlay = url.includes('/sistema/configuracion/rol');
    this.showCambiarContrasenaOverlay = url.includes('/sistema/configuracion/actualizar-contrasena');
    this.showCategoriasOverlay = url.includes('/sistema/configuracion/categorias');
    this.showMarcasOverlay = url.includes('/sistema/configuracion/marcas');

    const anyOpen = this.showRolOverlay || this.showCambiarContrasenaOverlay
      || this.showCategoriasOverlay || this.showMarcasOverlay;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
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

  abrirMarcas() {
    this.router.navigate(['/sistema/configuracion/marcas']);
  }

}
import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
})
export class Configuracion {
  public router = inject(Router);

  // Señal reactiva con la URL actual: arranca con this.router.url y se actualiza
  // en cada NavigationEnd. A diferencia de una suscripción manual + asignación de
  // booleanos, un signal se propaga al template de forma inmediata y consistente,
  // sin depender de zone.js ni de en qué callback/tick ocurrió el cambio. Esto es
  // lo que elimina de raíz el NG0100 y los overlays que se quedaban "atorados".
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Cada overlay es un valor DERIVADO de la URL, no un estado mutado a mano.
  // Angular garantiza que estos 4 son siempre consistentes entre sí porque se
  // recalculan todos juntos a partir de la misma lectura de this.url().
  showRolOverlay = computed(() => this.url().includes('/sistema/configuracion/rol'));
  showCambiarContrasenaOverlay = computed(() => this.url().includes('/sistema/configuracion/actualizar-contrasena'));
  showCategoriasOverlay = computed(() => this.url().includes('/sistema/configuracion/categorias'));
  showMarcasOverlay = computed(() => this.url().includes('/sistema/configuracion/marcas'));

  anyOverlayOpen = computed(() =>
    this.showRolOverlay() || this.showCambiarContrasenaOverlay()
    || this.showCategoriasOverlay() || this.showMarcasOverlay(),
  );

  constructor() {
    // Efecto secundario aparte (bloquear scroll del body): se ejecuta cada vez
    // que anyOverlayOpen cambia, de forma reactiva y automática.
    effect(() => {
      document.body.style.overflow = this.anyOverlayOpen() ? 'hidden' : '';
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

  abrirMarcas() {
    this.router.navigate(['/sistema/configuracion/marcas']);
  }

}
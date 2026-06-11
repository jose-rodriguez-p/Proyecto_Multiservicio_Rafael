import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rol',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './rol.html',
  styleUrl: './rol.css',
})
export class Rol implements OnInit {
  filtroBusqueda = '';
  roles: any[] = [];
  mostrarModal = false;

  private URL = 'http://localhost:8080/api/configuracion';
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const esRutaModal = /\/rol\/(agregar-rol|editar-rol)/.test(e.urlAfterRedirects);

        this.mostrarModal = esRutaModal;

        if (!esRutaModal) {
          this.cargarRoles();

          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';

          document.querySelectorAll('.modal-backdrop').forEach((x) => x.remove());

          this.cdr.detectChanges();
        }
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarRoles();
    }
  }

  cargarRoles() {
    this.http.get<any[]>(`${this.URL}/roles/listar`).subscribe({
      next: (data) => {
        this.roles = data.map((rol) => ({
          id: rol.id,
          nombre: rol.nombre,
          menus: rol.menus,
          descripcion: 'Rol del sistema',
          activo: rol.estado === 'Activo',
        }));
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error al cargar roles:', e),
    });
  }

  get rolesFiltrados() {
    return this.roles.filter((r) => {
      const txt = `${r.nombre} ${r.menus}`.toLowerCase();
      return txt.includes(this.filtroBusqueda.toLowerCase());
    });
  }

  abrirModal() {
    this.router.navigate(['/sistema', 'configuracion', 'rol', 'agregar-rol']);
  }

  abrirModalEdit(rol: any) {
    this.router.navigate(['/sistema', 'configuracion', 'rol', 'editar-rol', rol.id], {
      state: { datosRol: rol },
    });
  }

  eliminarRol(id: number) {
    Swal.fire({
      title: 'Eliminar',
      text: '¿Desea continuar?',
      icon: 'warning',
      showCancelButton: true,
    });
  }
}

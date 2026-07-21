import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-rol.html',
  styleUrl: './editar-rol.css',
})
export class EditarRol implements OnInit {
  availableMenus: string[] = [];
  rol: any = {
    nombre: '',
    activo: true,
    menus: [],
  };

  private rolOriginalString = '';

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  private URL_API = `${API_BASE_URL}/api/menus`;
  private URL_MENUS = `${API_BASE_URL}/api/menus/lista-menus`;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.cargarMenus();

    const rolRecibido = history.state?.datosRol;

    if (rolRecibido) {
      this.rol = {
        ...rolRecibido,
        menus: [...rolRecibido.menus],
      };

      this.rolOriginalString = JSON.stringify(this.rol);

      this.cdr.detectChanges();
    }
  }

  cargarMenus() {
    this.http.post<string[]>(this.URL_MENUS, {}).subscribe({
      next: (data) => {
        this.availableMenus = data;
        this.cdr.detectChanges();
      },
    });
  }

  toggleMenu(menu: string) {
    const pos = this.rol.menus.indexOf(menu);

    if (pos >= 0) {
      this.rol.menus.splice(pos, 1);
    } else {
      this.rol.menus.push(menu);
    }
  }

  actualizarRol() {
    const actual = JSON.stringify(this.rol);
    if (actual === this.rolOriginalString) {
      this.cerrarModal();
      return;
    }

    const nombreOriginal = JSON.parse(this.rolOriginalString).nombre;

    // AÑADE ESTO PARA OBTENER EL USUARIO LOGUEADO
    const usuarioLogueado = JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'sistema';

    const payload = {
      estado: this.rol.activo ? 'Activo' : 'Inactivo',
      menus: this.rol.menus,
      usuarioLogueado: usuarioLogueado // <--- ESTO ES LO QUE FALTA
    };

    this.http.put(`${this.URL_API}/actualizar/${nombreOriginal}`, payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'Actualizado',
          text: 'Rol actualizado correctamente',
          icon: 'success',
        }).then(() => {
          this.cerrarModal();
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire('Error', 'No se pudo actualizar', 'error');
      },
    });
  }

  cerrarModal() {
    document.body.classList.remove('modal-open');

    document.body.style.removeProperty('overflow');

    document.querySelectorAll('.modal-backdrop').forEach((x) => x.remove());

    this.router.navigate(['/sistema/configuracion/rol'], {
      replaceUrl: true,
    });
  }

  regresar() {
    this.cerrarModal();
  }
}

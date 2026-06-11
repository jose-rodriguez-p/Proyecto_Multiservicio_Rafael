import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-rol',
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-rol.html',
  styleUrl: './agregar-rol.css',
})
export class AgregarRol implements OnInit {
  availableMenus: string[] = [];

  newRole = {
    nombre: '',
    activo: true,
    menus: [] as string[],
  };

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // CORRECCIÓN: La ruta debe coincidir con el @RequestMapping("/api/configuracion")
  // y el @PostMapping("/roles/crear") de tu controlador Java.
  private URL_BASE = 'http://localhost:8080/api/configuracion';
  private URL_MENUS = 'http://localhost:8080/api/menus/lista-menus';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarMenus();
    }
  }

  cargarMenus() {
    this.http.post<string[]>(this.URL_MENUS, {}).subscribe({
      next: (data) => {
        this.availableMenus = data;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error cargando menús:', e);
      },
    });
  }

  toggleMenu(menu: string) {
    const index = this.newRole.menus.indexOf(menu);
    if (index >= 0) {
      this.newRole.menus.splice(index, 1);
    } else {
      this.newRole.menus.push(menu);
    }
  }

  guardarRol() {
    if (!this.newRole.nombre.trim()) {
      Swal.fire('Error', 'Ingrese nombre', 'warning');
      return;
    }
    this.http.post<boolean>(`${this.URL_BASE}/roles/crear`, this.newRole).subscribe({
      next: (exito) => {
        if (exito) {
          Swal.fire('Correcto', 'Rol guardado con éxito', 'success').then(() => {
            setTimeout(() => {
              this.router.navigate(['/sistema', 'configuracion', 'rol']);
            }, 0);
          });
        } else {
          Swal.fire('Error', 'No se pudo registrar el rol', 'error');
        }
      },
      error: (err) => {
        console.error('Error del servidor:', err);
        Swal.fire('Error', 'Ocurrió un error en el servidor', 'error');
      },
    });
  }

  cancelar() {
    this.router.navigate(['/sistema', 'configuracion', 'rol']);
  }
}

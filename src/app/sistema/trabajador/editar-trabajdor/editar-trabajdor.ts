import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-trabajdor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-trabajdor.html',
  styleUrl: './editar-trabajdor.css',
})
export class EditarTrabajdor implements OnInit {
  URL_API = 'http://localhost:8080/api/trabajadores';
  trabajadorEditando: any = {};
  cargos: any[] = [];
  // Menús para asignar
  menus: any[] = [];
  selectedMenus: any[] = [];
  mostrarModalMenus = false;

  private cdr = inject(ChangeDetectorRef);
  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const st: any = history.state || {};
    if (st.trabajador) {
      this.trabajadorEditando = {
        ...st.trabajador,
      };
    }
    this.cargarCargos();
  }

  cargarMenus(callback?: () => void) {
    this.http.post<string[]>('http://localhost:8080/api/menus/lista-menus', {}).subscribe({
      next: (data) => {
        this.menus = data || [];
        this.cdr.detectChanges();
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  abrirModalMenus() {
    this.selectedMenus = Array.isArray(this.trabajadorEditando.menuIds)
      ? [...this.trabajadorEditando.menuIds]
      : [];

    if (this.menus.length === 0) {
      this.cargarMenus(() => {
        setTimeout(() => {
          this.mostrarModalMenus = true;

          this.cdr.detectChanges();
        });
      });
    } else {
      this.mostrarModalMenus = true;

      this.cdr.detectChanges();
    }
  }

  cerrarModalMenus() {
    this.mostrarModalMenus = false;
  }

  toggleMenuSeleccion(menu: string) {
    const idx = this.selectedMenus.indexOf(menu);
    if (idx === -1) {
      this.selectedMenus.push(menu);
    } else {
      this.selectedMenus.splice(idx, 1);
    }
  }

  guardarMenusAsignados() {
    const id = this.trabajadorEditando.numeroDocumento || this.trabajadorEditando.id;
    const url = `${this.URL_API}/${id}/menus`;
    this.http.post(url, { menuIds: this.selectedMenus }).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Permisos de menú actualizados', 'success');
        this.cerrarModalMenus();
        this.router.navigate(['/sistema/trabajador']);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudieron guardar los permisos', 'error');
      },
    });
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (data) => {
        this.cargos = data || [];

        if (this.trabajadorEditando && this.trabajadorEditando.id_cargo != null) {
          const cargo = this.cargos.find(
            (c) => Number(c.id) === Number(this.trabajadorEditando.id_cargo),
          );

          if (cargo) {
            this.trabajadorEditando.id_cargo = cargo.id;
          }
        }

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
      },
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }

  actualizarTrabajador() {
    const id = this.trabajadorEditando.numeroDocumento || this.trabajadorEditando.id;
    this.http.put(`${this.URL_API}/actualizar/${id}`, this.trabajadorEditando).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'Datos actualizados', 'success');
        this.router.navigate(['/sistema/trabajador']);
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar', 'error');
      },
    });
  }
}

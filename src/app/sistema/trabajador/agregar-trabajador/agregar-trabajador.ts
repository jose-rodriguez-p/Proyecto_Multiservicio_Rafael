import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-trabajador',
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-trabajador.html',
  styleUrl: './agregar-trabajador.css',
})
export class AgregarTrabajador implements OnInit {
  URL_API = 'http://localhost:8080/api/trabajadores';
  documentos: any[] = [];
  cargos: any[] = [];

  nuevoTrabajador: any = {
    id_documento: 1,
    numeroDocumento: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    correo: '',
    direccion: '',
    id_cargo: 1,
    estado: 'Activo',
    usuario: '',
    contrasena: '',
  };

  private cdr = inject(ChangeDetectorRef);
  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  // Menús para asignar y selección temporal
  menus: any[] = [];
  selectedMenus: any[] = [];
  mostrarModalMenus = false;

  onCargoChange() {
    // mostrar campos de usuario solo para cargos 2 y 3
  }

  ngOnInit() {
    this.cargarDocumentos();
    this.cargarCargos();
  }

  cargarDocumentos() {
    this.http.get<any[]>(`${this.URL_API}/documentos`).subscribe({
      next: (data) => {
        this.documentos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (data) => {
        this.cargos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err),
    });
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
    this.selectedMenus = Array.isArray(this.nuevoTrabajador.menuIds)
      ? this.nuevoTrabajador.menuIds.slice()
      : [];
    if (!this.menus || this.menus.length === 0) this.cargarMenus();
    this.mostrarModalMenus = true;
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

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }

  guardarTrabajador() {
    this.nuevoTrabajador.menuIds = [...this.selectedMenus];
    console.log(this.nuevoTrabajador);

    this.http.post(`${this.URL_API}/crear`, this.nuevoTrabajador).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Trabajador registrado', 'success');
        this.router.navigate(['/sistema/trabajador']);
      },
    });
  }
}

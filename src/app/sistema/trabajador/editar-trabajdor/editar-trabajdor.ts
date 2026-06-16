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
  trabajadorOriginal: any = {};
  cargos: any[] = [];

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const st: any = history.state || {};

    if (st.trabajador) {
      this.trabajadorEditando = { ...st.trabajador };
      this.trabajadorOriginal = { ...st.trabajador };
    }

    this.cargarCargos();
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (data) => {
        this.cargos = data || [];

        if (this.trabajadorEditando.cargo) {
          const existe = this.cargos.some(
            (c) => c.nombre?.toLowerCase() === this.trabajadorEditando.cargo?.toLowerCase(),
          );

          if (!existe) {
            this.cargos.unshift({
              id: 0,
              nombre: this.trabajadorEditando.cargo,
            });
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', err.error || 'Revisa la consola F12', 'error');
      },
    });
  }

  hayCambios(): boolean {
    const camposAComparar = [
      'nombre',
      'apellido_paterno',
      'apellido_materno',
      'celular',
      'correo',
      'direccion',
      'cargo',
      'estado',
    ];

    for (const campo of camposAComparar) {
      if (this.trabajadorEditando[campo] !== this.trabajadorOriginal[campo]) {
        return true;
      }
    }

    return false;
  }

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }

  actualizarTrabajador() {
    if (!this.hayCambios()) {
      Swal.fire('Sin cambios', 'No se ha modificado ningún dato.', 'warning');
      return;
    }
    const dni = this.trabajadorEditando.numeroDocumento;
    const payload = {
      nombre: this.trabajadorEditando.nombre,
      apellido_paterno: this.trabajadorEditando.apellido_paterno,
      apellido_materno: this.trabajadorEditando.apellido_materno,
      celular: this.trabajadorEditando.celular,
      correo: this.trabajadorEditando.correo,
      direccion: this.trabajadorEditando.direccion,
      cargo: this.trabajadorEditando.cargo,
      estado: this.trabajadorEditando.estado,
    };
    this.http
      .put(`${this.URL_API}/actualizar/${dni}`, payload, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          Swal.fire('Actualizado', 'Datos actualizados con éxito', 'success');
          this.router.navigate(['/sistema/trabajador']);
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', err.error || 'No se pudo actualizar', 'error');
        },
      });
  }
}
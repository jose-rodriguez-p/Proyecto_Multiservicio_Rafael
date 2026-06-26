import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-categorias.html',
  styleUrl: './agregar-categorias.css',
})
export class AgregarCategorias implements OnInit {

  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/configuracion/categorias`;

  nombre = '';
  estado = 'Activo';

  error = false;
  mensajeError = '';

  categoriasExistentes: string[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarExistentes();
    }
  }

  cargarExistentes() {
    this.http
      .get<any[]>(`${API_BASE_URL}/api/configuracion/listar-categorias`)
      .subscribe({
        next: (data) => {
          this.categoriasExistentes = (data || []).map(c => c.nombre);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar categorías:', err);
        }
      });
  }

  validar() {
    const valor = this.nombre.trim();

    if (!valor) {
      this.error = true;
      this.mensajeError = 'El nombre no puede estar vacío.';
      return;
    }

    const existe = this.categoriasExistentes.some(
      c => c.toLowerCase() === valor.toLowerCase()
    );

    if (existe) {
      this.error = true;
      this.mensajeError = 'Ya existe una categoría con ese nombre.';
      return;
    }

    this.error = false;
    this.mensajeError = '';
  }

  guardar() {

    this.validar();

    if (this.error || !this.nombre.trim()) {
      return;
    }

    const payload = {
      nombre: this.nombre.trim(),
      estado: this.estado
    };

    this.http.post(
      `${this.URL}/crear`,
      payload,
      { responseType: 'text' }
    ).subscribe({

      next: (respuesta: string) => {

        if (respuesta === 'OK') {

          Swal.fire({
            icon: 'success',
            title: '¡Categoría agregada!',
            text: `"${this.nombre.trim()}" fue registrada correctamente.`,
            confirmButtonColor: '#b91c1c',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.cerrar();
          });

        } else {

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: respuesta
          });

        }

      },

      error: (err) => {

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error || 'No se pudo registrar la categoría.'
        });

      }

    });

  }

  cancelar() {
    this.cerrar();
  }

  cerrar() {
    this.router.navigate(['/sistema/configuracion/categorias']);
  }

}
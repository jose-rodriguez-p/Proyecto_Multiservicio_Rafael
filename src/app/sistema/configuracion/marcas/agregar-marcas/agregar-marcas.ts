import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@config';

@Component({
  selector: 'app-agregar-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-marcas.html',
  styleUrl: './agregar-marcas.css',
})
export class AgregarMarcas implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private URL_API = `${API_BASE_URL}/api/configuracion`;

  nombre = '';
  estado = 'Activo';
  errorNombre = false;
  mensajeError = '';
  categoriasSeleccionadas: string[] = [];
  loading = false;
  loadingCategorias = false;
  error = '';

  categorias: any[] = [];
  marcasExistentes: string[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarCategorias();
      this.cargarMarcas();
    }
  }

  cargarCategorias() {
    this.loadingCategorias = true;
    this.http.get<any[]>(`${this.URL_API}/listar-categorias`).subscribe({
      next: (data) => {
        // Filtrar solo categorías activas
        this.categorias = (data || []).filter(cat => cat.estado === 'Activo');
        this.loadingCategorias = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loadingCategorias = false;
        this.cdr.detectChanges();
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      }
    });
  }

  cargarMarcas() {
    this.http.get<any[]>(`${this.URL_API}/marcas-categorias`).subscribe({
      next: (data) => {
        this.marcasExistentes = data.map(m => m.nombre) || [];
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
      }
    });
  }

  validar() {
    const v = this.nombre.trim();
    if (!v) {
      this.errorNombre = true;
      this.mensajeError = 'El nombre no puede estar vacío.';
      return;
    }
    if (v.length < 2) {
      this.errorNombre = true;
      this.mensajeError = 'El nombre debe tener al menos 2 caracteres.';
      return;
    }
    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ0-9\s\-\.&]+$/.test(v)) {
      this.errorNombre = true;
      this.mensajeError = 'Solo se permiten letras, números, espacios, guiones y puntos.';
      return;
    }
    if (this.marcasExistentes.some(m => m.toLowerCase() === v.toLowerCase())) {
      this.errorNombre = true;
      this.mensajeError = 'Ya existe una marca con ese nombre.';
      return;
    }
    this.errorNombre = false;
    this.mensajeError = '';
  }

  toggleCategoria(nombre: string) {
    const idx = this.categoriasSeleccionadas.indexOf(nombre);
    if (idx === -1) this.categoriasSeleccionadas.push(nombre);
    else this.categoriasSeleccionadas.splice(idx, 1);
  }

  isSeleccionada(nombre: string): boolean {
    return this.categoriasSeleccionadas.includes(nombre);
  }

  get formularioValido(): boolean {
    return !!this.nombre.trim() && !this.errorNombre && this.categoriasSeleccionadas.length > 0;
  }

  guardar() {
    this.validar();
    if (!this.formularioValido) return;

    this.loading = true;

    const datos = {
      marcaNombre: this.nombre.trim(),
      marcaEstado: this.estado,
      categoriasNombres: this.categoriasSeleccionadas
    };

    this.http.post(`${this.URL_API}/marcas/crear`, datos).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.cerrar(true);
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: '¡Marca agregada!',
            text: `"${this.nombre.trim()}" fue registrada correctamente.`,
            confirmButtonColor: '#b91c1c',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true,
          });
        }, 150);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al crear marca:', err);
        Swal.fire('Error', err.error || 'No se pudo crear la marca', 'error');
      }
    });
  }

  cancelar() { this.cerrar(false); }
  cerrar(recargar: boolean = false) {
    if (recargar) {
      this.router.navigate(['/sistema/configuracion/marcas'], { queryParams: { recargar: 'true' } });
    } else {
      this.router.navigate(['/sistema/configuracion/marcas']);
    }
  }
}
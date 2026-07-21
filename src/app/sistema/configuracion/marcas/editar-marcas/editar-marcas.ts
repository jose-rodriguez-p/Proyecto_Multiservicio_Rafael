import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@config';

@Component({
  selector: 'app-editar-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-marcas.html',
  styleUrl: './editar-marcas.css',
})
export class EditarMarcas implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private URL_API = `${API_BASE_URL}/api/configuracion`;

  nombre = '';
  nombreOriginal = '';
  estado = 'Activo';
  errorNombre = false;
  mensajeError = '';
  categoriasSeleccionadas: string[] = [];
  marcaNombre: string = '';
  loading = false;
  loadingCategorias = false;

  categorias: any[] = [];
  todasMarcas: any[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.marcaNombre = this.route.snapshot.paramMap.get('id') || '';
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
        this.todasMarcas = data || [];
        this.cargarMarcaSeleccionada();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
        Swal.fire('Error', 'No se pudieron cargar las marcas', 'error');
      }
    });
  }

  cargarMarcaSeleccionada() {
    const marca = this.todasMarcas.find(m => m.nombre === this.marcaNombre);
    if (marca) {
      this.nombre = marca.nombre;
      this.nombreOriginal = marca.nombre;
      this.estado = marca.estado;
      // Cargar las categorías de la marca
      if (marca.categorias && Array.isArray(marca.categorias)) {
        this.categoriasSeleccionadas = marca.categorias
          .filter((cat: any) => cat.estado === 'Activo')
          .map((cat: any) => cat.nombre);
      }
    }
  }

  validar() {
    // El nombre no se puede editar, así que no es necesario validar
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
    return this.categoriasSeleccionadas.length > 0;
  }

  guardar() {
    this.validar();
    if (!this.formularioValido) {
      Swal.fire('Error', 'Selecciona al menos una categoría', 'error');
      return;
    }

    this.loading = true;

    const datos = {
      marcaNombre: this.nombreOriginal,
      marcaEstadoNuevo: this.estado,
      categoriasNombres: this.categoriasSeleccionadas
    };

    console.log('Enviando datos para editar marca:', datos);

    // Importante: responseType 'text' porque el backend devuelve String plano (ej. "OK"),
    // no JSON. Si no se especifica, Angular intenta parsear como JSON y falla aunque
    // el backend haya respondido 200 OK.
    this.http.put(`${this.URL_API}/marcas/editar`, datos, {
      observe: 'response',
      responseType: 'text'
    }).subscribe({
      next: (res) => {
        console.log('Respuesta del backend:', res.body);
        this.loading = false;
        this.cerrar(true);
        setTimeout(() => {
          Swal.fire({
            icon: 'success',
            title: '¡Marca actualizada!',
            text: `"${this.nombre.trim()}" fue guardada correctamente.`,
            confirmButtonColor: '#b91c1c',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true,
          });
        }, 150);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al actualizar marca:', err);
        console.error('Error status:', err.status);
        console.error('Error body:', err.error);
        Swal.fire('Error', err.error || 'No se pudo actualizar la marca', 'error');
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
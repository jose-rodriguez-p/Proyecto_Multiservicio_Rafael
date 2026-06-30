import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '@config';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './marcas.html',
  styleUrl: './marcas.css',
})
export class Marcas implements OnInit {
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private URL_API = `${API_BASE_URL}/api/configuracion`;

  filtroNombre = '';
  filtroEstado = 'Activo';
  showAgregarOverlay = false;
  showEditarOverlay = false;

  // Estructura del backend: Marca tiene nombre, estado y lista de categorías
  marcas: any[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      ).subscribe((e) => {
        this.showAgregarOverlay = e.urlAfterRedirects.includes('/agregar-marcas');
        this.showEditarOverlay  = e.urlAfterRedirects.includes('/editar-marcas');

        // Recargar marcas solo cuando se regresa de agregar/editar con queryParams.recargar = true
        const esRutaMarcas = e.urlAfterRedirects.includes('/sistema/configuracion/marcas') &&
                           !e.urlAfterRedirects.includes('/agregar-marcas') &&
                           !e.urlAfterRedirects.includes('/editar-marcas');
        if (esRutaMarcas) {
          const recargar = this.route.snapshot.queryParams['recargar'];
          if (recargar === 'true') {
            this.cargarMarcas();
            // Limpiar el queryParams después de usarlo
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { recargar: null },
              queryParamsHandling: 'merge'
            });
          }
        }

        this.cdr.markForCheck();
      });
      this.cargarMarcas();
    }
  }

  cargarMarcas() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.http.get(`${this.URL_API}/marcas-categorias`).subscribe({
      next: (data: any) => {
        this.marcas = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar marcas:', err);
        this.error = 'Error al cargar las marcas';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get marcasFiltradas() {
    return this.marcas.filter(m => {
      const coincideNombre = m.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const coincideEstado = this.filtroEstado === 'Todos' || m.estado === this.filtroEstado;
      return coincideNombre && coincideEstado;
    });
  }

  get categoriasActivas() {
    // Retorna todas las categorías únicas de todas las marcas que están activas
    const todasCategorias = new Set<string>();
    this.marcas.forEach(marca => {
      if (marca.categorias && Array.isArray(marca.categorias)) {
        marca.categorias.forEach((cat: any) => {
          if (cat.estado === 'Activo') {
            todasCategorias.add(cat.nombre);
          }
        });
      }
    });
    return Array.from(todasCategorias);
  }

  // Obtiene los nombres de las categorías de una marca específica
  nombresCategoriasDeMarca(marca: any): string {
    if (!marca.categorias || !Array.isArray(marca.categorias)) return '—';
    return marca.categorias
      .filter((cat: any) => cat.estado === 'Activo')
      .map((cat: any) => cat.nombre)
      .join(', ') || '—';
  }

  cerrar() { this.router.navigate(['/sistema/configuracion']); }
}
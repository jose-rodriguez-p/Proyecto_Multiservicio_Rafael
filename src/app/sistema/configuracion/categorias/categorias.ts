import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias implements OnInit {

  private http = inject(HttpClient);
  public router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/configuracion/listar-categorias`;

  showAgregarOverlay = false;
  showEditarOverlay = false;

  categorias: any[] = [];
  filtro = '';
  estadoFiltro = 'Activos';

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {

      this.showAgregarOverlay = e.urlAfterRedirects.includes('/agregar-categorias');
      this.showEditarOverlay = e.urlAfterRedirects.includes('/editar-categorias');

      const esRutaModal =
        /\/categorias\/(agregar-categorias|editar-categorias)/.test(e.urlAfterRedirects);

      if (!esRutaModal) {
        this.cargar();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargar();
    }
  }

  // 🔥 LISTAR
  cargar() {
    this.http.get<any[]>(this.URL).subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      }
    });
  }

  // 🔥 FILTRO
  get categoriasFiltradas() {
    let list = this.categorias;

    if (this.estadoFiltro === 'Activos') {
      list = list.filter(c => c.estado === 'Activo');
    } else if (this.estadoFiltro === 'Inactivos') {
      list = list.filter(c => c.estado === 'Inactivo');
    }

    if (this.filtro.trim()) {
      const q = this.filtro.toLowerCase();
      list = list.filter(c => c.nombre.toLowerCase().includes(q));
    }

    return list;
  }

  // 🔥 EDITAR
  abrirModalEdit(cat: any) {
    this.router.navigate(
      ['/sistema/configuracion/categorias/editar-categorias', cat.nombre],
      {
        state: { datosCategoria: cat },
      }
    );
  }

  // 🔥 CAMBIAR ESTADO (BACKEND @RequestParam)
  cambiarEstadoCategoria(cat: any) {

    const nuevoEstado = cat.estado === 'Activo' ? 'Inactivo' : 'Activo';

    const params = new HttpParams()
      .set('nombreCategoria', cat.nombre)
      .set('nuevoEstado', nuevoEstado);

    this.http.put(
      `${API_BASE_URL}/api/configuracion/categorias/estado`,
      {},
      { params }
    ).subscribe({
      next: (res) => {
        Swal.fire('OK', 'Estado actualizado correctamente', 'success');
        this.cargar();
      },
      error: (err) => {
        console.log('ERROR BACKEND:', err.error);
        Swal.fire('Error', err.error || 'No se pudo actualizar', 'error');
      }
    });
  }

  // 🔥 SALIR
  cerrar() {
    this.router.navigate(['/sistema/configuracion']);
  }
}
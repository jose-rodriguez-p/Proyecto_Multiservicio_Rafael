import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './marcas.html',
  styleUrl: './marcas.css',
})
export class Marcas implements OnInit {
  public router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  filtroNombre = '';
  filtroEstado = 'Activo';
  showAgregarOverlay = false;
  showEditarOverlay = false;

  // ── Datos simulados — reemplazar con http.get cuando el back esté listo ──
  categorias: any[] = [
    { id: 1, nombre: 'Lubricantes',   estado: 'Activo' },
    { id: 2, nombre: 'Frenos',        estado: 'Activo' },
    { id: 3, nombre: 'Filtros',       estado: 'Activo' },
    { id: 4, nombre: 'Llantas',       estado: 'Activo' },
    { id: 5, nombre: 'Baterías',      estado: 'Activo' },
    { id: 6, nombre: 'Suspensión',    estado: 'Activo' },
    { id: 7, nombre: 'Electricidad',  estado: 'Inactivo' },
  ];

  marcas: any[] = [
    { id: 1, nombre: 'Castrol',    id_categoria: 1, estado: 'Activo'   },
    { id: 2, nombre: 'Mobil',      id_categoria: 1, estado: 'Activo'   },
    { id: 3, nombre: 'Shell',      id_categoria: 1, estado: 'Activo'   },
    { id: 4, nombre: 'Brembo',     id_categoria: 2, estado: 'Activo'   },
    { id: 5, nombre: 'Bosch',      id_categoria: 2, estado: 'Activo'   },
    { id: 6, nombre: 'Mann',       id_categoria: 3, estado: 'Activo'   },
    { id: 7, nombre: 'Fram',       id_categoria: 3, estado: 'Inactivo' },
    { id: 8, nombre: 'Bridgestone',id_categoria: 4, estado: 'Activo'   },
    { id: 9, nombre: 'Michelin',   id_categoria: 4, estado: 'Activo'   },
    { id: 10,nombre: 'Bosch',      id_categoria: 5, estado: 'Activo'   },
    { id: 11,nombre: 'Monroe',     id_categoria: 6, estado: 'Inactivo' },
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      ).subscribe((e) => {
        this.showAgregarOverlay = e.urlAfterRedirects.includes('/agregar-marcas');
        this.showEditarOverlay  = e.urlAfterRedirects.includes('/editar-marcas');
      });
    }
  }

  get categoriasFiltradas() {
    return this.categorias.filter(c => c.estado === 'Activo');
  }

  get marcasFiltradas() {
    return this.marcas.filter(m => {
      const coincideNombre = m.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
      const coincideEstado = this.filtroEstado === 'Todos' || m.estado === this.filtroEstado;
      return coincideNombre && coincideEstado;
    });
  }

  nombreCategoria(id: number): string {
    return this.categorias.find(c => c.id === id)?.nombre ?? '—';
  }

  cerrar() { this.router.navigate(['/sistema/configuracion']); }
}
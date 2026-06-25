import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  private URL = `${API_BASE_URL}/api/productos/categorias`;
  showAgregarOverlay = false;
  showEditarOverlay = false;

  categorias: any[] = [];
  filtro = '';

  constructor() {
  inject(Router).events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd)
  ).subscribe((e) => {
    this.showAgregarOverlay = e.urlAfterRedirects.includes('/agregar-categorias');
    this.showEditarOverlay  = e.urlAfterRedirects.includes('/editar-categorias');
  });
}


  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.cargar();
  }

  cargar() {
    this.http.get<any[]>(this.URL).subscribe({
      next: (data) => this.categorias = data || [],
      error: () => Swal.fire('Error', 'No se pudieron cargar las categorías.', 'error'),
    });
  }

  get categoriasFiltradas() {
    if (!this.filtro.trim()) return this.categorias;
    const q = this.filtro.toLowerCase();
    return this.categorias.filter(c => c.nombre.toLowerCase().includes(q));
  }

  cerrar() { this.router.navigate(['/sistema/configuracion']); }
}
import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css',
})
export class ServiciosConf implements OnInit {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);

  private URL = `${API_BASE_URL}/api/configuracion`;

  servicios: any[] = [];
  cargando = true;
  filtroNombre = '';
  filtroEstado = '';

  showAgregarOverlay = false;
  showEditarOverlay = false;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e) => {
      this.showAgregarOverlay = e.urlAfterRedirects.includes('/servicios/agregar-servicios');
      this.showEditarOverlay  = e.urlAfterRedirects.includes('/servicios/editar-servicios');
      const recargar = new URL(e.urlAfterRedirects, window.location.origin).searchParams.get('recargar');
      if (recargar === 'true' && isPlatformBrowser(this.platformId)) {
        this.cargar();
      }
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargar();
    }
  }

  cargar() {
    this.cargando = true;
    this.http.get<any[]>(`${this.URL}/servicios`).subscribe({
      next: (data) => {
        this.servicios = data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.servicios = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get serviciosFiltrados(): any[] {
    let lista = this.servicios;
    if (this.filtroEstado) {
      lista = lista.filter(s => s.estado === this.filtroEstado);
    }
    if (this.filtroNombre.trim()) {
      const q = this.filtroNombre.toLowerCase().trim();
      lista = lista.filter(s => s.nombre?.toLowerCase().includes(q));
    }
    return lista;
  }

  abrirAgregar() {
    this.router.navigate(['/sistema/configuracion/servicios/agregar-servicios']);
  }

  abrirEditar(s: any) {
    this.router.navigate(['/sistema/configuracion/servicios/editar-servicios', s.nombre], {
      state: { datosServicio: s },
    });
  }

  cerrar() {
    this.router.navigate(['/sistema/configuracion']);
  }
}

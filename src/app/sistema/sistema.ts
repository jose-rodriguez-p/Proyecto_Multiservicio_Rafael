import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sistema',
  imports: [RouterOutlet, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './sistema.html',
  styleUrl: './sistema.css',
})
export class Sistema implements OnInit {

  nombreRutaActual = 'Panel';

  private rutaNombres: { [key: string]: string } = {
    'dashboard':        'Dashboard',
    'cliente':          'Clientes',
    'producto':         'Productos',
    'reabastecimiento': 'Reabastecimiento',
    'proveedor':        'Proveedores',
    'trabajador':       'Trabajadores',
    'configuracion':    'Configuración',
    'venta':            'Servicios — Venta',
    'mantenimiento':    'Servicios — Mantenimiento',
    'ventas':           'Servicios — Ventas',
    'crear':            'Servicios — Nueva Venta',
    'rol':              'Configuración — Roles',
    'agregar-rol':      'Configuración — Agregar Rol',
    'editar-rol':       'Configuración — Editar Rol',
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Actualizar al iniciar
    this.actualizarNombre(this.router.url);

    // Actualizar cada vez que cambia la ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.actualizarNombre(event.urlAfterRedirects || event.url);
        this.cdr.detectChanges();
      });
  }

  private actualizarNombre(url: string) {
    const segmentos = url.split('/').filter(s => Boolean(s) && !s.includes('?'));
    const ultimo = segmentos[segmentos.length - 1];
    this.nombreRutaActual = this.rutaNombres[ultimo] ?? 'Panel';
  }

  getNombreRuta(): string {
    return this.nombreRutaActual;
  }

  cerrarSesion() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
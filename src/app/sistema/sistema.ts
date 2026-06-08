import { Component } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators'; 

@Component({
  selector: 'app-sistema',
  imports: [RouterOutlet, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './sistema.html',
  styleUrl: './sistema.css',
})
export class Sistema {

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
  };

  constructor(private router: Router) {}

  getNombreRuta(): string {
    const segmentos = this.router.url.split('/').filter(Boolean);
    const ultimo = segmentos[segmentos.length - 1];
    return this.rutaNombres[ultimo] ?? 'Panel';
  }

  cerrarSesion() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
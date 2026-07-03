import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sistema',
  imports: [CommonModule, RouterOutlet, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './sistema.html',
  styleUrl: './sistema.css',
})
export class Sistema implements OnInit {
  nombreRutaActual = 'Panel';
  menusAutorizados: string[] = [];
  usuarioActual: any = null;
  private platformId = inject(PLATFORM_ID);

  private rutaNombres: { [key: string]: string } = {
    'dashboard':        'Dashboard',
    'cliente':          'Clientes',
    'producto':         'Productos',
    'reabastecimiento': 'Reabastecimiento',
    'compra':           'Compras',
    'nueva-compra':     'Compras — Nueva Compra',
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
    this.cargarUsuario();
    this.actualizarNombre(this.router.url);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.actualizarNombre(event.urlAfterRedirects || event.url);
        this.cdr.detectChanges();
      });
  }

  cargarUsuario() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.usuarioActual = JSON.parse(userStr);
      this.menusAutorizados = this.usuarioActual.menus || this.usuarioActual.accesoMenu || [];
    }
  }

  tieneAcceso(menu: string): boolean {
    if (this.menusAutorizados.some(m => m.toLowerCase() === menu.toLowerCase())) {
      return true;
    }
    
    if (menu === 'Venta' || menu === 'Mantenimiento') {
      return this.menusAutorizados.some(m => m.toLowerCase() === 'servicios');
    }
    
    return false;
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
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.router.navigate(['/login']);
  }
}
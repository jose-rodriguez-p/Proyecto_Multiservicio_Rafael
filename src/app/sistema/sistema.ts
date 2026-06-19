import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
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
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.usuarioActual = JSON.parse(userStr);
      this.menusAutorizados = this.usuarioActual.accesoMenu || [];
      console.log('Usuario completo:', this.usuarioActual);
      console.log('Menús autorizados:', this.menusAutorizados);
    } else {
      console.log('No se encontró usuario en localStorage');
    }
  }

  tieneAcceso(menu: string): boolean {
    console.log(`Verificando acceso a: "${menu}"`);
    console.log(`Menús autorizados:`, this.menusAutorizados);
    
    // Si el menú está directamente en la lista autorizada (case-insensitive)
    const found = this.menusAutorizados.some(m => m.toLowerCase() === menu.toLowerCase());
    console.log(`Coincidencia directa: ${found}`);
    
    if (found) {
      return true;
    }
  
    if (menu === 'Venta' || menu === 'Mantenimiento') {
      const hasServicios = this.menusAutorizados.some(m => m.toLowerCase() === 'servicios');
      console.log(`Verificando submenú ${menu}, tiene Servicios: ${hasServicios}`);
      return hasServicios;
    }
    
    console.log(`Acceso denegado para: ${menu}`);
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
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
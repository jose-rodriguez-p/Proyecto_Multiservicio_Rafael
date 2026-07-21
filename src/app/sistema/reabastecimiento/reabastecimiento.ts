import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ProveedorProducto {
  nombre: string;
  precio: number;
  stockDisponible: number;
  tiempoEntrega: string;
}

interface ProductoReabastecimiento {
  id: number;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  proveedores: ProveedorProducto[];
}

@Component({
  selector: 'app-reabastecimiento',
  imports: [CommonModule, FormsModule],
  templateUrl: './reabastecimiento.html',
  styleUrl: './reabastecimiento.css',
})
export class Reabastecimiento {
  productos: ProductoReabastecimiento[] = [
    {
      id: 1,
      nombre: 'Aceite Motor 10W40',
      categoria: 'Lubricantes',
      stockActual: 5,
      stockMinimo: 10,
      proveedores: [
        { nombre: 'Distribuidora Norte', precio: 25.50, stockDisponible: 100, tiempoEntrega: '24h' },
        { nombre: 'Lubricantes S.A.', precio: 24.90, stockDisponible: 50, tiempoEntrega: '48h' },
        { nombre: 'Mecánica Pro', precio: 26.00, stockDisponible: 200, tiempoEntrega: '12h' }
      ]
    },
    {
      id: 2,
      nombre: 'Pastillas de Freno Delanteras',
      categoria: 'Repuestos',
      stockActual: 2,
      stockMinimo: 8,
      proveedores: [
        { nombre: 'Repuestos Express', precio: 45.00, stockDisponible: 20, tiempoEntrega: '24h' },
        { nombre: 'Frenos Rafael', precio: 42.50, stockDisponible: 15, tiempoEntrega: '72h' }
      ]
    },
    {
      id: 3,
      nombre: 'Filtro de Aire Premium',
      categoria: 'Filtros',
      stockActual: 15,
      stockMinimo: 12,
      proveedores: [
        { nombre: 'Filtros Todo', precio: 12.00, stockDisponible: 500, tiempoEntrega: '24h' },
        { nombre: 'Distribuidora Norte', precio: 11.50, stockDisponible: 100, tiempoEntrega: '48h' }
      ]
    }
  ];

  productoSeleccionado: ProductoReabastecimiento | null = null;
  filtroBusqueda: string = '';

  get productosFiltrados() {
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
    );
  }

  seleccionarProducto(producto: ProductoReabastecimiento) {
    this.productoSeleccionado = producto;
  }
}

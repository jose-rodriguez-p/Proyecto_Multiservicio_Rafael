import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface ProductoDisponible {
  nombre_repuesto: string;
  nombre_categoria: string;
  nombre_marca: string;
  cantidad: number;
  precio_compra: number;
}

interface ItemCompra {
  nombre_repuesto: string;
  cantidad: number | null;
  precio_compra: number | null;
  busqueda: string;
  resultados: ProductoDisponible[];
  mostrarDropdown: boolean;
  errorCantidad: boolean;
  errorPrecio: boolean;
}

@Component({
  selector: 'app-nueva-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-compra.html',
  styleUrl: './nueva-compra.css',
})
export class NuevaCompra implements OnInit {
  private URL_COMPRAS = `${API_BASE_URL}/api/compras`;
  private URL_PRODUCTOS = `${API_BASE_URL}/api/productos`;
  private URL_PROVEEDORES = `${API_BASE_URL}/api/proveedores`;

  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  proveedores: any[] = [];
  productosDisponibles: ProductoDisponible[] = [];
  rucProveedor = '';
  errorProveedor = false;

  items: ItemCompra[] = [];
  guardando = false;

  ngOnInit() {
    this.http.get<any>(`${this.URL_PROVEEDORES}/listar`).subscribe({
      next: (data) => {
        const arr = Array.isArray(data) ? data : data.content || data.data || [];
        this.proveedores = arr.filter((p: any) => p.estado === 'Activo');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar proveedores:', err),
    });

    this.http.get<any[]>(`${this.URL_PRODUCTOS}/listar-repuestos`).subscribe({
      next: (data) => {
        this.productosDisponibles = Array.isArray(data) ? data : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 204) console.error('Error al cargar productos:', err);
      },
    });

    this.agregarItem();
  }

  nuevoItem(): ItemCompra {
    return {
      nombre_repuesto: '',
      cantidad: null,
      precio_compra: null,
      busqueda: '',
      resultados: [],
      mostrarDropdown: false,
      errorCantidad: false,
      errorPrecio: false,
    };
  }

  agregarItem() {
    this.items.push(this.nuevoItem());
  }

  quitarItem(index: number) {
    this.items.splice(index, 1);
    if (this.items.length === 0) this.agregarItem();
  }

  buscarProducto(item: ItemCompra) {
    item.nombre_repuesto = '';
    const q = item.busqueda.trim().toLowerCase();
    if (!q) {
      item.resultados = [];
      item.mostrarDropdown = false;
      return;
    }
    item.resultados = this.productosDisponibles.filter((p) =>
      p.nombre_repuesto.toLowerCase().includes(q),
    );
    item.mostrarDropdown = true;
  }

  seleccionarProducto(item: ItemCompra, producto: ProductoDisponible) {
    item.nombre_repuesto = producto.nombre_repuesto;
    item.busqueda = producto.nombre_repuesto;
    item.precio_compra = producto.precio_compra ?? null;
    item.mostrarDropdown = false;
    this.validarPrecio(item);
  }

  cerrarDropdown(item: ItemCompra) {
    // pequeño delay para permitir el click en la opción antes de cerrar
    setTimeout(() => (item.mostrarDropdown = false), 150);
  }

  validarCantidad(item: ItemCompra) {
    const v = Number(item.cantidad);
    item.errorCantidad = item.cantidad === null || !Number.isInteger(v) || v <= 0 || v > 99999;
  }

  validarPrecio(item: ItemCompra) {
    const v = Number(item.precio_compra);
    item.errorPrecio = item.precio_compra === null || v <= 0 || v > 99999.99;
  }

  subtotal(item: ItemCompra): number {
    const c = Number(item.cantidad) || 0;
    const p = Number(item.precio_compra) || 0;
    return c * p;
  }

  get total(): number {
    return this.items.reduce((acc, item) => acc + this.subtotal(item), 0);
  }

  itemsValidos(): boolean {
    const itemsConProducto = this.items.filter((i) => i.nombre_repuesto);
    if (itemsConProducto.length === 0) return false;

    // No permitir el mismo producto repetido dos veces en la misma compra
    const nombres = itemsConProducto.map((i) => i.nombre_repuesto);
    const sinDuplicados = new Set(nombres).size === nombres.length;

    return (
      sinDuplicados &&
      itemsConProducto.every((i) => {
        this.validarCantidad(i);
        this.validarPrecio(i);
        return !i.errorCantidad && !i.errorPrecio;
      })
    );
  }

  datosValidos(): boolean {
    this.errorProveedor = !this.rucProveedor;
    return !this.errorProveedor && this.itemsValidos();
  }

  registrarCompra() {
    if (!this.datosValidos()) {
      Swal.fire('Atención', 'Corrige los campos marcados en rojo antes de continuar.', 'warning');
      return;
    }

    const items = this.items
      .filter((i) => i.nombre_repuesto)
      .map((i) => ({
        nombre_repuesto: i.nombre_repuesto,
        cantidad: Number(i.cantidad),
        precio_compra: Number(i.precio_compra),
      }));

    this.guardando = true;

    this.http
      .post(
        `${this.URL_COMPRAS}/registrar`,
        { ruc_proveedor: this.rucProveedor, items },
        { responseType: 'text' },
      )
      .subscribe({
        next: (res) => {
          this.guardando = false;
          if (res === 'COMPRA_REGISTRADA') {
            Swal.fire({
              icon: 'success',
              title: 'Compra registrada',
              text: 'El stock de los productos fue actualizado.',
              timer: 2000,
              showConfirmButton: false,
            });
            this.router.navigate(['/sistema/compra']);
          } else {
            Swal.fire('Error', res, 'error');
          }
        },
        error: (err) => {
          this.guardando = false;
          Swal.fire('Error', err.error || 'No se pudo registrar la compra.', 'error');
        },
      });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/compra']);
  }
}
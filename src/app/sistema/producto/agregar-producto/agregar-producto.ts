import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-producto.html',
  styleUrl: './agregar-producto.css',
})
export class AgregarProducto implements OnInit {
  private URL_API = `${API_BASE_URL}/api/productos`;
  private URL_PROVEEDORES = `${API_BASE_URL}/api/proveedores`;

  categorias: string[] = [];
  categoriasConMarcas: any[] = [];
  proveedores: any[] = [];
  marcasDisponibles: string[] = [];

  errorNombre = false;
  errorCantidad = false;
  errorStockMinimo = false;
  errorPrecioCompra = false;
  errorPrecioVenta = false;
  errorPrecioVentaMenor = false;

  nuevoProducto: any = {
    nombre: '',
    marca: '',
    id_categoria: 0,
    nombre_categoria: '',
    cantidad: null,
    precio_compra: null,
    precio_venta: null,
    stock_minimo: 5,
    estado: 'Activo',
    nombre_proveedor: '',
  };

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
    this.http.get<string[]>(`${this.URL_API}/categorias`).subscribe({
      next: (data) => {
        this.categorias = data || [];
        if (this.categorias.length > 0) {
          this.nuevoProducto.nombre_categoria = this.categorias[0];
        }
        this.actualizarMarcas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      },
    });

    this.http.get<any[]>(`${this.URL_API}/categorias-marcas`).subscribe({
      next: (data) => {
        console.log('Datos recibidos de categorías-marcas:', data);
        this.categoriasConMarcas = data || [];
        this.actualizarMarcas();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar categorías con marcas:', err);
      },
    });

    this.http.get<any>(`${this.URL_PROVEEDORES}/listar`).subscribe({
      next: (data) => {
        const arr = Array.isArray(data) ? data : data.content || data.data || [];
        this.proveedores = arr.filter((p: any) => p.estado === 'Activo');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
      },
    });
  }

  onCategoriaChange() {
    this.nuevoProducto.marca = '';
    this.actualizarMarcas();
  }

  actualizarMarcas() {
    console.log('Categoría seleccionada:', this.nuevoProducto.nombre_categoria);

    if (!this.nuevoProducto.nombre_categoria) {
      this.marcasDisponibles = [];
      return;
    }

    const categoriaConMarcas = this.categoriasConMarcas.find(
      (c: any) => c.nombre_categoria === this.nuevoProducto.nombre_categoria,
    );

    console.log('Resultado encontrado:', categoriaConMarcas);
    this.marcasDisponibles = categoriaConMarcas?.marcas || [];
    console.log('Marcas disponibles:', this.marcasDisponibles);
  }

  validarNombre() {
    const v = this.nuevoProducto.nombre?.trim();
    this.errorNombre = !v || v.length < 2 || v.length > 100;
  }

  validarCantidad() {
    const v = Number(this.nuevoProducto.cantidad);
    this.errorCantidad =
      this.nuevoProducto.cantidad === null || v < 0 || v > 999 || !Number.isInteger(v);
    this.validarStockMinimo();
  }

  validarStockMinimo() {
    const sm = Number(this.nuevoProducto.stock_minimo);
    const cant = Number(this.nuevoProducto.cantidad);
    this.errorStockMinimo = sm < 0 || sm > 999 || (!isNaN(cant) && sm > cant);
  }

  validarPrecioCompra() {
    const v = Number(this.nuevoProducto.precio_compra);
    this.errorPrecioCompra = !v || v <= 0 || v > 9999.99;
    this.validarPrecioVenta();
  }

  validarPrecioVenta() {
    const v = Number(this.nuevoProducto.precio_venta);
    this.errorPrecioVenta = !v || v <= 0 || v > 9999.99;
    this.errorPrecioVentaMenor =
      !this.errorPrecioVenta &&
      this.nuevoProducto.precio_compra > 0 &&
      v <= Number(this.nuevoProducto.precio_compra);
  }

  datosValidos(): boolean {
    return (
      !this.errorNombre &&
      !this.errorCantidad &&
      !this.errorStockMinimo &&
      !this.errorPrecioCompra &&
      !this.errorPrecioVenta &&
      !this.errorPrecioVentaMenor &&
      !!this.nuevoProducto.nombre?.trim() &&
      this.nuevoProducto.cantidad !== null &&
      this.nuevoProducto.precio_compra !== null &&
      this.nuevoProducto.precio_venta !== null
    );
  }

  guardarProducto() {
    this.validarNombre();
    this.validarCantidad();
    this.validarPrecioCompra();
    this.validarPrecioVenta();

    if (!this.datosValidos()) {
      Swal.fire('Atención', 'Corrige los campos marcados en rojo antes de continuar.', 'warning');
      return;
    }

    this.http
      .post(`${this.URL_API}/agregar-repuesto`, this.nuevoProducto, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          if (res === 'REPUESTO_REGISTRADO') {
            Swal.fire({
              icon: 'success',
              title: 'Producto registrado',
              timer: 1800,
              showConfirmButton: false,
            });
            this.router.navigate(['/sistema/producto']);
          } else {
            Swal.fire('Error', res, 'error');
          }
        },
        error: (err) => {
          Swal.fire('Error', err.error || 'No se pudo registrar el producto.', 'error');
        },
      });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/producto']);
  }
}

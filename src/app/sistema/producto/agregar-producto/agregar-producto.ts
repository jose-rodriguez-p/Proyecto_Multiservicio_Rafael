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
  private URL_API = 'http://localhost:8080/api/productos';
  private URL_PROVEEDORES = 'http://localhost:8080/api/proveedores';

  categorias: any[] = [];
  proveedores: any[] = [];

  // Errores en tiempo real
  errorCodigo = false;
  errorNombre = false;
  errorCantidad = false;
  errorPrecioCompra = false;
  errorPrecioVenta = false;
  errorPrecioVentaMenor = false;

  nuevoProducto: any = {
    codigo: '',
    nombre: '',
    marca: '',
    id_categoria: 0,
    cantidad: null,
    precio_compra: null,
    precio_venta: null,
    stock_minimo: 5,
    estado: 'Activo',
    ruc_proveedor: ''
  };

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
    this.http.get<any[]>(`${this.URL_API}/categorias`).subscribe({
      next: (data) => {
        this.categorias = data;
        if (data.length > 0) this.nuevoProducto.id_categoria = data[0].id;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });

    this.http.get<any>(`${this.URL_PROVEEDORES}/listar`).subscribe({
      next: (data) => {
        const proveedoresArray = Array.isArray(data) ? data : data.content || data.data || [];
        this.proveedores = proveedoresArray.filter((p: any) => p.estado === 'Activo');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar proveedores:', err)
    });
  }

  // ── Validaciones en tiempo real ──────────────────────────────────────────
  validarCodigo() {
    this.errorCodigo = !this.nuevoProducto.codigo?.trim() ||
      !/^[A-Za-z0-9\-]{2,20}$/.test(this.nuevoProducto.codigo.trim());
  }

  validarNombre() {
    this.errorNombre = !this.nuevoProducto.nombre?.trim() ||
      this.nuevoProducto.nombre.trim().length < 2;
  }

  validarCantidad() {
    this.errorCantidad = this.nuevoProducto.cantidad === null ||
      this.nuevoProducto.cantidad < 0;
  }

  validarPrecioCompra() {
    this.errorPrecioCompra = this.nuevoProducto.precio_compra === null ||
      this.nuevoProducto.precio_compra < 0;
    this.validarPrecioVenta();
  }

  validarPrecioVenta() {
    this.errorPrecioVenta = !this.nuevoProducto.precio_venta ||
      this.nuevoProducto.precio_venta <= 0;
    this.errorPrecioVentaMenor =
      !this.errorPrecioVenta &&
      this.nuevoProducto.precio_compra > 0 &&
      Number(this.nuevoProducto.precio_venta) <= Number(this.nuevoProducto.precio_compra);
  }

  datosValidos(): boolean {
    return !this.errorCodigo && !this.errorNombre &&
           !this.errorCantidad && !this.errorPrecioCompra &&
           !this.errorPrecioVenta && !this.errorPrecioVentaMenor &&
           !!this.nuevoProducto.codigo?.trim() &&
           !!this.nuevoProducto.nombre?.trim();
  }

  guardarProducto() {
    // Dispara todas las validaciones antes de intentar guardar
    this.validarCodigo();
    this.validarNombre();
    this.validarCantidad();
    this.validarPrecioCompra();
    this.validarPrecioVenta();

    if (!this.datosValidos()) {
      Swal.fire('Atención', 'Corrige los campos marcados en rojo antes de continuar.', 'warning');
      return;
    }

    this.http.post(`${this.URL_API}/agregar`, this.nuevoProducto, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'PRODUCTO_REGISTRADO') {
          Swal.fire({ icon: 'success', title: 'Producto registrado', timer: 1800, showConfirmButton: false });
          this.router.navigate(['/sistema/producto']);
        } else {
          Swal.fire('Error', res, 'error');
        }
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo registrar el producto.', 'error')
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/producto']);
  }
}
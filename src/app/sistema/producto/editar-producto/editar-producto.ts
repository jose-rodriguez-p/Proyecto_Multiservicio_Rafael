import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css',
})
export class EditarProducto implements OnInit {
  private URL_API = `${API_BASE_URL}/api/productos`;
  private URL_PROVEEDORES = `${API_BASE_URL}/api/proveedores`;

  errorNombre = false;
  errorCantidad = false;
  errorPrecioCompra = false;
  errorPrecioVenta = false;
  errorPrecioVentaMenor = false;
  errorStockMinimo = false;

  productoEditando: any = {};
  proveedores: any[] = [];

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const state = history.state?.producto;
    if (state) {
      this.productoEditando = {
        nombre_repuesto: state.nombre,
        nombre_categoria: state.categoria,
        nombre_marca: state.marca,
        nombre_proveedor: state.nombre_proveedor,
        cantidad: state.stock,
        precio_compra: state.precio_compra,
        precio_venta: state.precio_venta,
        stock_minimo: state.stock_minimo,
        estado: state.estado
      };
    } else {
      this.router.navigate(['/sistema/producto']);
    }

    this.http.get<any>(`${this.URL_PROVEEDORES}/listar`).subscribe({
      next: (data) => {
        const proveedoresArray = Array.isArray(data) ? data : data.content || data.data || [];
        this.proveedores = proveedoresArray.filter((p: any) => p.estado === 'Activo');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar proveedores:', err)
    });
  }

  validarNombre() {
    this.errorNombre = !this.productoEditando.nombre_repuesto?.trim() ||
      this.productoEditando.nombre_repuesto.trim().length < 2;
  }

  validarCantidad() {
    this.errorCantidad = this.productoEditando.cantidad === null ||
      this.productoEditando.cantidad === undefined ||
      this.productoEditando.cantidad < 0;
  }

  validarPrecioCompra() {
    const v = Number(this.productoEditando.precio_compra);
    this.errorPrecioCompra = !v || v <= 0 || v > 9999.99;
    this.validarPrecioVenta();
  }

  validarPrecioVenta() {
    const v = Number(this.productoEditando.precio_venta);
    this.errorPrecioVenta = !v || v <= 0 || v > 9999.99;
    this.errorPrecioVentaMenor =
      !this.errorPrecioVenta &&
      this.productoEditando.precio_compra > 0 &&
      v <= Number(this.productoEditando.precio_compra);
  }

  validarStockMinimo() {
    const sm = Number(this.productoEditando.stock_minimo);
    const cant = Number(this.productoEditando.cantidad);
    this.errorStockMinimo = sm < 0 || sm > 999 || (!isNaN(cant) && sm > cant);
  }

  datosValidos(): boolean {
    return !this.errorNombre && !this.errorCantidad &&
           !this.errorPrecioCompra && !this.errorPrecioVenta &&
           !this.errorPrecioVentaMenor && !this.errorStockMinimo &&
           !!this.productoEditando.nombre_repuesto?.trim() &&
           this.productoEditando.cantidad !== null &&
           this.productoEditando.precio_compra !== null &&
           this.productoEditando.precio_venta !== null;
  }

  guardarCambios() {
    this.validarNombre();
    this.validarCantidad();
    this.validarPrecioCompra();
    this.validarPrecioVenta();
    this.validarStockMinimo();

    if (!this.datosValidos()) {
      Swal.fire('Atención', 'Corrige los campos marcados en rojo antes de continuar.', 'warning');
      return;
    }

    this.http.put(`${this.URL_API}/editar-repuesto`, this.productoEditando, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'REPUESTO_ACTUALIZADO') {
          Swal.fire({ icon: 'success', title: 'Repuesto actualizado', timer: 1800, showConfirmButton: false });
          this.router.navigate(['/sistema/producto']);
        } else {
          Swal.fire('Error', res, 'error');
        }
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo actualizar el repuesto.', 'error')
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/producto']);
  }
}
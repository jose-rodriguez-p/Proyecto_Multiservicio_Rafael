import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css',
})
export class EditarProducto implements OnInit {
  private URL_API = 'http://localhost:8080/api/productos';
  private URL_PROVEEDORES = 'http://localhost:8080/api/proveedores';

  errorNombre = false;
  errorCantidad = false;
  errorPrecioVenta = false;

  productoEditando: any = {};
  proveedores: any[] = [];

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const state = history.state?.producto;
    if (state) {
      this.productoEditando = { ...state };
      // El backend usa 'cantidad' pero el JSON devuelve 'stock'
      if (this.productoEditando.stock !== undefined && this.productoEditando.cantidad === undefined) {
        this.productoEditando.cantidad = this.productoEditando.stock;
      }
    } else {
      // Si no hay state (recarga), volver a la lista
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

  // ── Validaciones en tiempo real ──────────────────────────────────────────
  validarNombre() {
    this.errorNombre = !this.productoEditando.nombre?.trim() ||
      this.productoEditando.nombre.trim().length < 2;
  }

  validarCantidad() {
    this.errorCantidad = this.productoEditando.cantidad === null ||
      this.productoEditando.cantidad === undefined ||
      this.productoEditando.cantidad < 0;
  }

  validarPrecioVenta() {
    this.errorPrecioVenta = !this.productoEditando.precio_venta ||
      this.productoEditando.precio_venta <= 0;
  }

  datosValidos(): boolean {
    return !this.errorNombre && !this.errorCantidad && !this.errorPrecioVenta &&
           !!this.productoEditando.nombre?.trim();
  }

  guardarCambios() {
    this.validarNombre();
    this.validarCantidad();
    this.validarPrecioVenta();

    if (!this.datosValidos()) {
      Swal.fire('Atención', 'Corrige los campos marcados en rojo antes de continuar.', 'warning');
      return;
    }

    this.http.put(`${this.URL_API}/actualizar`, this.productoEditando, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'PRODUCTO_ACTUALIZADO') {
          Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1800, showConfirmButton: false });
          this.router.navigate(['/sistema/producto']);
        } else if (res === 'SIN_CAMBIOS') {
          Swal.fire('Sin cambios', 'No se ha modificado ningún dato.', 'warning');
        } else {
          Swal.fire('Error', res, 'error');
        }
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo actualizar el producto.', 'error')
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/producto']);
  }
}
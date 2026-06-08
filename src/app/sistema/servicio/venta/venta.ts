import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venta.html',
  styleUrl: './venta.css',
})
export class Venta {
  filtroBusqueda: string = '';
  categoriaSeleccionada: string = 'Todos';
  mostrarModal: boolean = false;
  metodoPago: string = 'Efectivo';

  categorias: string[] = ['Todos', 'Lubricantes', 'Filtros', 'Frenos', 'Neumáticos', 'Repuestos'];

  productos = [
    { codigo: 'ACE-001', nombre: 'Aceite Motor 10W40', marca: 'Castrol', categoria: 'Lubricantes', stock: 15, stock_minimo: 10, precio_venta: 35.50, cantidad: 0 },
    { codigo: 'FIL-002', nombre: 'Filtro de Aire Premium', marca: 'Bosch', categoria: 'Filtros', stock: 5, stock_minimo: 12, precio_venta: 18.00, cantidad: 0 },
    { codigo: 'PAS-003', nombre: 'Pastillas de Freno', marca: 'Brembo', categoria: 'Frenos', stock: 20, stock_minimo: 8, precio_venta: 120.00, cantidad: 0 },
    { codigo: 'FIL-004', nombre: 'Filtro de Aceite', marca: 'Mann', categoria: 'Filtros', stock: 30, stock_minimo: 10, precio_venta: 22.00, cantidad: 0 },
    { codigo: 'NEU-005', nombre: 'Neumático 185/65 R15', marca: 'Michelin', categoria: 'Neumáticos', stock: 8, stock_minimo: 4, precio_venta: 280.00, cantidad: 0 },
    { codigo: 'ACE-006', nombre: 'Aceite Caja 75W90', marca: 'Mobil', categoria: 'Lubricantes', stock: 12, stock_minimo: 5, precio_venta: 45.00, cantidad: 0 },
  ];

  clienteModal = {
    dni: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    correo: '',
    vehiculo: ''
  };

  clienteEncontrado: boolean = false;
  buscandoCliente: boolean = false;

  clientesDB: any[] = [
    { dni: '74622233', nombre: 'Jose Manuel', apellido_paterno: 'Rodriguez', apellido_materno: 'Peña', celular: '987654321', correo: 'jose@gmail.com', vehiculo: 'Toyota Corolla ABC-123' }
  ];

  get productosFiltrados() {
    return this.productos.filter(p => {
      const matchBusqueda = p.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
                            p.codigo.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      const matchCategoria = this.categoriaSeleccionada === 'Todos' || p.categoria === this.categoriaSeleccionada;
      return matchBusqueda && matchCategoria;
    });
  }

  get productosSeleccionados() {
    return this.productos.filter(p => p.cantidad > 0);
  }

  get subtotal(): number {
    return this.productosSeleccionados.reduce((acc, p) => acc + (p.precio_venta * p.cantidad), 0);
  }

  get igv(): number {
    return this.subtotal * 0.18;
  }

  get total(): number {
    return this.subtotal + this.igv;
  }

  agregarProducto(producto: any) {
    if (producto.cantidad < producto.stock) {
      producto.cantidad++;
    }
  }

  quitarProducto(producto: any) {
    if (producto.cantidad > 0) {
      producto.cantidad--;
    }
  }

  toggleProducto(producto: any) {
    if (producto.cantidad === 0) {
      producto.cantidad = 1;
    } else {
      producto.cantidad = 0;
    }
  }

  abrirModal() {
    if (this.productosSeleccionados.length === 0) {
      Swal.fire('Sin productos', 'Selecciona al menos un producto para continuar.', 'warning');
      return;
    }
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.resetCliente();
  }

  buscarCliente() {
    const dni = this.clienteModal.dni;
    if (dni.length < 8) return;

    this.buscandoCliente = true;
    setTimeout(() => {
      const encontrado = this.clientesDB.find(c => c.dni === dni);
      if (encontrado) {
        this.clienteModal = { ...encontrado };
        this.clienteEncontrado = true;
      } else {
        this.clienteEncontrado = false;
        this.clienteModal = { ...this.clienteModal, nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '', vehiculo: '' };
      }
      this.buscandoCliente = false;
    }, 300);
  }

  confirmarVenta() {
    if (!this.clienteModal.dni || !this.clienteModal.nombre || !this.clienteModal.apellido_paterno) {
      Swal.fire('Datos incompletos', 'DNI, nombre y apellido paterno son requeridos.', 'warning');
      return;
    }

    const venta = {
      cliente: { ...this.clienteModal },
      productos: this.productosSeleccionados.map(p => ({ codigo: p.codigo, nombre: p.nombre, cantidad: p.cantidad, precio: p.precio_venta })),
      subtotal: this.subtotal,
      igv: this.igv,
      total: this.total,
      metodo_pago: this.metodoPago
    };

    console.log('POST /venta:', venta);

    Swal.fire({
      title: '¡Venta registrada!',
      html: `<strong>Total: S/ ${this.total.toFixed(2)}</strong><br>Cliente: ${this.clienteModal.nombre} ${this.clienteModal.apellido_paterno}`,
      icon: 'success',
      confirmButtonColor: '#ff3b30'
    });

    this.limpiar();
    this.cerrarModal();
  }

  limpiar() {
    this.productos.forEach(p => p.cantidad = 0);
    this.resetCliente();
    this.metodoPago = 'Efectivo';
  }

  resetCliente() {
    this.clienteModal = { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '', vehiculo: '' };
    this.clienteEncontrado = false;
    this.buscandoCliente = false;
  }
}
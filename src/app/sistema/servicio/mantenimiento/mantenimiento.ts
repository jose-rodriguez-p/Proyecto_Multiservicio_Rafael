import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mantenimiento.html',
  styleUrls: ['./mantenimiento.css'],
})
export class Mantenimiento {
  filtroBusqueda: string = '';
  filtroProducto: string = '';
  mostrarModal: boolean = false;
  metodoPago: string = 'Efectivo';
  servicioSeleccionado: any = null;

  servicios = [
    { id: 1, nombre: 'Cambio de Aceite', descripcion: 'Incluye filtro de aceite', precio: 80.00, icono: 'bi-droplet-fill' },
    { id: 2, nombre: 'Revisión de Frenos', descripcion: 'Inspección completa del sistema de frenos', precio: 120.00, icono: 'bi-hexagon-fill' },
    { id: 3, nombre: 'Diagnóstico General', descripcion: 'Escáner OBD + revisión completa', precio: 60.00, icono: 'bi-cpu-fill' },
    { id: 4, nombre: 'Alineación y Balanceo', descripcion: 'Para los 4 neumáticos', precio: 90.00, icono: 'bi-arrow-repeat' },
    { id: 5, nombre: 'Cambio de Filtros', descripcion: 'Aire, aceite y combustible', precio: 50.00, icono: 'bi-funnel-fill' },
    { id: 6, nombre: 'Revisión Eléctrica', descripcion: 'Sistema eléctrico y batería', precio: 70.00, icono: 'bi-lightning-fill' },
  ];

  productos = [
    { codigo: 'ACE-001', nombre: 'Aceite Motor 10W40', marca: 'Castrol', stock: 15, precio_venta: 35.50, cantidad: 0 },
    { codigo: 'FIL-002', nombre: 'Filtro de Aire Premium', marca: 'Bosch', stock: 5, precio_venta: 18.00, cantidad: 0 },
    { codigo: 'PAS-003', nombre: 'Pastillas de Freno', marca: 'Brembo', stock: 20, precio_venta: 120.00, cantidad: 0 },
    { codigo: 'FIL-004', nombre: 'Filtro de Aceite', marca: 'Mann', stock: 30, precio_venta: 22.00, cantidad: 0 },
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

  get serviciosFiltrados() {
    return this.servicios.filter(s =>
      s.nombre.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
    );
  }

  get productosFiltrados() {
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(this.filtroProducto.toLowerCase()) ||
      p.codigo.toLowerCase().includes(this.filtroProducto.toLowerCase())
    );
  }

  get productosSeleccionados() {
    return this.productos.filter(p => p.cantidad > 0);
  }

  get subtotalProductos(): number {
    return this.productosSeleccionados.reduce((acc, p) => acc + (p.precio_venta * p.cantidad), 0);
  }

  get subtotal(): number {
    return (this.servicioSeleccionado?.precio ?? 0) + this.subtotalProductos;
  }

  get igv(): number {
    return this.subtotal * 0.18;
  }

  get total(): number {
    return this.subtotal + this.igv;
  }

  seleccionarServicio(servicio: any) {
    this.servicioSeleccionado = this.servicioSeleccionado?.id === servicio.id ? null : servicio;
  }

  agregarProducto(producto: any) {
    if (producto.cantidad < producto.stock) producto.cantidad++;
  }

  quitarProducto(producto: any) {
    if (producto.cantidad > 0) producto.cantidad--;
  }

  toggleProducto(producto: any) {
    producto.cantidad = producto.cantidad === 0 ? 1 : 0;
  }

  abrirModal() {
    if (!this.servicioSeleccionado) {
      Swal.fire('Sin servicio', 'Selecciona un servicio técnico para continuar.', 'warning');
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

  confirmarMantenimiento() {
    if (!this.clienteModal.dni || !this.clienteModal.nombre || !this.clienteModal.apellido_paterno) {
      Swal.fire('Datos incompletos', 'DNI, nombre y apellido paterno son requeridos.', 'warning');
      return;
    }

    const registro = {
      cliente: { ...this.clienteModal },
      servicio: this.servicioSeleccionado,
      productos: this.productosSeleccionados.map(p => ({ codigo: p.codigo, nombre: p.nombre, cantidad: p.cantidad, precio: p.precio_venta })),
      subtotal: this.subtotal,
      igv: this.igv,
      total: this.total,
      metodo_pago: this.metodoPago
    };

    console.log('POST /mantenimiento:', registro);

    Swal.fire({
      title: '¡Mantenimiento registrado!',
      html: `<strong>Total: S/ ${this.total.toFixed(2)}</strong><br>Servicio: ${this.servicioSeleccionado.nombre}`,
      icon: 'success',
      confirmButtonColor: '#ff3b30'
    });

    this.limpiar();
    this.cerrarModal();
  }

  limpiar() {
    this.servicioSeleccionado = null;
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

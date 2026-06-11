import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Repuesto {
  id_repuesto: number;
  codigo: string;
  nombre: string;
  marca: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  precio_venta: number;
}

interface ItemDetalle {
  repuesto: Repuesto;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  descuento: number;
}

interface Cliente {
  id_cliente?: number;
  dni: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  celular: string;
  correo: string;
}

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-venta.html',
  styleUrl: './crear-venta.css',
})
export class Venta implements OnInit {

  private URL_VENTAS   = 'http://localhost:8080/api/ventas';
  private URL_CLIENTES = 'http://localhost:8080/api/clientes';

  // ── Cabecera del comprobante ───
  tipoComprobante = 'Boleta';
  serie = 'B001';
  estado = 'Pagado';
  fechaEmision: string = new Date().toISOString().split('T')[0];

  // ── Vendedor (usuario logueado) ───
  vendedor = { nombre: '', cargo: '', años: '', codigo: '' };

  // ── Cliente ──
  clienteVarios: Cliente = {
    dni: '00000000', nombre: 'Cliente', apellido_paterno: 'Varios',
    apellido_materno: '', celular: '000000000', correo: 'sin-correo@correo.com'
  };
  cliente: Cliente = { ...this.clienteVarios };
  dniBusqueda = '';
  buscandoCliente = false;
  clienteEncontrado = false;
  mostrarPanelCliente = false;

  // ── Detalle (ítems) ──
  items: ItemDetalle[] = [];

  // ── Buscador de repuestos ──
  repuestos: Repuesto[] = [];
  repuestosFiltrados: Repuesto[] = [];
  busquedaRepuesto = '';
  mostrarDropdown = false;
  cargandoRepuestos = false;

  // ── Totales ─────────────────────────────────────────────────────────────────
  descuentoGlobal = 0;
  descuentoTipo: '%' | 'S/' = '%';
  nota = '';

  // ── Estado UI ───────────────────────────────────────────────────────────────
  guardando = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarVendedor();
    this.cargarRepuestos();
    this.agregarItem(); // inicia con una fila vacía
  }

  // ── Vendedor ─────────────────────────────────────────────────────────────────
  cargarVendedor() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.vendedor = {
        nombre:  user.trabajadorCompleto || user.username || 'Sin nombre',
        cargo:   user.rolNombre || '',
        años:    '',
        codigo:  user.username || ''
      };
    } catch {
      this.vendedor = { nombre: 'Sin nombre', cargo: '', años: '', codigo: '' };
    }
  }

  cambiarVendedor() {
    Swal.fire('Info', 'El vendedor es el usuario actualmente logueado.', 'info');
  }

  // ── Cliente ──────────────────────────────────────────────────────────────────
  abrirPanelCliente() {
    this.mostrarPanelCliente = true;
    this.dniBusqueda = this.cliente.dni === '00000000' ? '' : this.cliente.dni;
  }

  cerrarPanelCliente() {
    this.mostrarPanelCliente = false;
    this.dniBusqueda = '';
    this.clienteEncontrado = false;
    this.buscandoCliente = false;
  }

  buscarClientePorDni() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    if (dni.length < 8) {
      this.clienteEncontrado = false;
      return;
    }
    this.buscandoCliente = true;
    this.http.get<any>(`${this.URL_VENTAS}/buscar-cliente/${dni}`).subscribe({
      next: (res) => {
        this.buscandoCliente = false;
        this.clienteEncontrado = true;
        this.cliente = {
          dni:              res.dni,
          nombre:           res.nombre,
          apellido_paterno: res.apellido_paterno,
          apellido_materno: res.apellido_materno,
          celular:          res.celular,
          correo:           res.correo
        };
      },
      error: () => {
        this.buscandoCliente = false;
        this.clienteEncontrado = false;
        // No encontrado — deja campos en blanco para llenado manual
        this.cliente = {
          dni: dni, nombre: '', apellido_paterno: '',
          apellido_materno: '', celular: '', correo: ''
        };
      }
    });
  }

  confirmarCliente() {
    if (!this.cliente.nombre) {
      Swal.fire('Datos incompletos', 'El nombre del cliente es requerido.', 'warning');
      return;
    }
    this.mostrarPanelCliente = false;
  }

  usarClienteVarios() {
    this.cliente = { ...this.clienteVarios };
    this.mostrarPanelCliente = false;
  }

  get nombreCompletoCliente(): string {
    if (this.cliente.dni === '00000000') return 'Cliente Varios';
    const parts = [this.cliente.nombre, this.cliente.apellido_paterno, this.cliente.apellido_materno];
    return parts.filter(Boolean).join(' ') || 'Sin nombre';
  }

  // ── Repuestos / ítems ─────────────────────────────────────────────────────────
  cargarRepuestos() {
    this.cargandoRepuestos = true;
    this.http.get<Repuesto[]>(`${this.URL_VENTAS}/repuestos`).subscribe({
      next: (r) => { this.repuestos = r || []; this.cargandoRepuestos = false; },
      error: () => { this.cargandoRepuestos = false; }
    });
  }

  filtrarRepuestos(busqueda: string, itemIdx: number) {
    const q = busqueda.toLowerCase().trim();
    if (!q) { this.repuestosFiltrados = []; this.mostrarDropdown = false; return; }
    this.repuestosFiltrados = this.repuestos
      .filter(r => r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q))
      .slice(0, 8);
    this.mostrarDropdown = this.repuestosFiltrados.length > 0;
  }

  seleccionarRepuesto(rep: Repuesto, item: ItemDetalle) {
    item.repuesto    = rep;
    item.precio_unit = rep.precio_venta;
    item.cantidad    = 1;
    item.descripcion = '';
    this.mostrarDropdown = false;
    this.busquedaRepuesto = '';
  }

  agregarItem() {
    this.items.push({
      repuesto:    { id_repuesto: 0, codigo: '', nombre: '', marca: '', categoria: '', stock: 0, stock_minimo: 0, precio_venta: 0 },
      descripcion: '',
      cantidad:    1,
      precio_unit: 0,
      descuento:   0
    });
  }

  eliminarItem(idx: number) {
    this.items.splice(idx, 1);
  }

  importeItem(item: ItemDetalle): number {
    const bruto = item.cantidad * item.precio_unit;
    return bruto - (bruto * item.descuento / 100);
  }

  // ── Totales ──────────────────────────────────────────────────────────────────
  get subtotal(): number {
    return this.items.reduce((sum, it) => sum + this.importeItem(it), 0);
  }

  get descuentoMonto(): number {
    if (this.descuentoTipo === '%') return this.subtotal * this.descuentoGlobal / 100;
    return this.descuentoGlobal;
  }

  get igv(): number {
    return (this.subtotal - this.descuentoMonto) * 0.18;
  }

  get total(): number {
    return this.subtotal - this.descuentoMonto + this.igv;
  }

  // ── On tipo comprobante change ────────────────────────────────────────────────
  onTipoChange() {
    this.serie = this.tipoComprobante === 'Boleta' ? 'B001' : 'F001';
  }

  // ── Guardar ──────────────────────────────────────────────────────────────────
  itemsValidos(): boolean {
    return this.items.length > 0 &&
           this.items.every(it => it.repuesto.id_repuesto > 0 && it.cantidad > 0);
  }

  confirmarVenta() {
    if (!this.itemsValidos()) {
      Swal.fire('Sin ítems válidos', 'Agregue al menos un repuesto con cantidad válida.', 'warning');
      return;
    }

    let idUsuario = 0;
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      idUsuario = user.id || user.id_usuario || 0;
    } catch {}

    const payload = {
      id_usuario:   idUsuario,
      cliente: {
        dni:              this.cliente.dni,
        nombre:           this.cliente.nombre,
        apellido_paterno: this.cliente.apellido_paterno,
        apellido_materno: this.cliente.apellido_materno,
        celular:          this.cliente.celular,
        correo:           this.cliente.correo
      },
      items: this.items.map(it => ({
        id_repuesto:     it.repuesto.id_repuesto,
        cantidad:        it.cantidad,
        precio_subtotal: this.importeItem(it)
      })),
      precio_total: this.total
    };

    this.guardando = true;
    this.http.post<any>(`${this.URL_VENTAS}/registrar`, payload).subscribe({
      next: (res) => {
        this.guardando = false;
        Swal.fire({
          title: '¡Venta registrada!',
          html: `<b>Total: S/ ${this.total.toFixed(2)}</b><br>Orden N° ${res.id_orden_venta}<br>Cliente: ${this.nombreCompletoCliente}`,
          icon: 'success',
          confirmButtonColor: '#dc3545'
        }).then(() => this.limpiar());
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error || 'No se pudo registrar la venta', 'error');
      }
    });
  }

  limpiar() {
    this.cliente = { ...this.clienteVarios };
    this.items = [];
    this.agregarItem();
    this.descuentoGlobal = 0;
    this.descuentoTipo = '%';
    this.nota = '';
    this.fechaEmision = new Date().toISOString().split('T')[0];
    this.tipoComprobante = 'Boleta';
    this.serie = 'B001';
  }
}
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Repuesto {
  id_repuesto:  number;
  codigo:       string;
  nombre:       string;
  marca:        string;
  categoria:    string;
  stock:        number;
  stock_minimo: number;
  precio_venta: number;
}

interface ItemDetalle {
  repuesto:        Repuesto;
  descripcion:     string;
  cantidad:        number;
  precio_unit:     number;
  descuento:       number;
  busqueda:        string;
  resultados:      Repuesto[];
  mostrarDropdown: boolean;
}

interface Cliente {
  id_cliente?:      number;
  dni:              string;
  nombre:           string;
  apellido_paterno: string;
  apellido_materno: string;
  celular:          string;
  correo:           string;
}

type ModoPanel = 'buscar' | 'lista' | 'nuevo';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-venta.html',
  styleUrl: './crear-venta.css',
})
export class CrearVenta implements OnInit {

  private URL_VENTAS   = 'http://localhost:8080/api/ventas';
  private URL_CLIENTES = 'http://localhost:8080/api/clientes';
  private URL_PRODUCTOS = 'http://localhost:8080/api/productos';

  tipoComprobante = 'Boleta';
  serie           = 'B001';
  estado          = 'Pagado';
  fechaEmision: string = new Date().toISOString().split('T')[0];

  vendedor = { nombre: '', cargo: '', años: '', codigo: '' };

  readonly clienteVarios: Cliente = {
    dni: '00000000', nombre: 'Cliente', apellido_paterno: 'Varios',
    apellido_materno: '', celular: '000000000', correo: 'sin-correo@correo.com',
  };
  cliente: Cliente = { ...this.clienteVarios };

  mostrarPanelCliente = false;
  modoPanel: ModoPanel = 'buscar';

  dniBusqueda       = '';
  buscandoCliente   = false;
  clienteEncontrado = false;

  // Validaciones en tiempo real para nuevo cliente
  errorDniNuevo      = false;
  errorNombreNuevo   = false;
  errorApPaternoNuevo = false;
  errorCelularNuevo  = false;
  errorCorreoNuevo   = false;

  listaClientes:         any[] = [];
  listaClientesFiltrada: any[] = [];
  cargandoLista          = false;
  filtroBusquedaLista    = '';

  nuevoCliente: Cliente = this.clienteVacioFactory();
  guardandoCliente      = false;

  items: ItemDetalle[] = [];

  repuestos:        Repuesto[] = [];
  cargandoRepuestos = false;

  descuentoGlobal           = 0;
  descuentoTipo: '%' | 'S/' = '%';
  nota                      = '';
  guardando                 = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarVendedor();
    this.cargarRepuestos();
    this.agregarItem();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.celda-repuesto')) {
      this.items.forEach(it => it.mostrarDropdown = false);
    }
  }

  cargarVendedor() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.vendedor = {
        nombre: user.trabajadorCompleto || user.username || 'Sin nombre',
        cargo:  user.rolNombre || '',
        años:   '',
        codigo: user.username || '',
      };
    } catch {
      this.vendedor = { nombre: 'Sin nombre', cargo: '', años: '', codigo: '' };
    }
  }

  cambiarVendedor() {
    Swal.fire('Info', 'El vendedor es el usuario actualmente logueado.', 'info');
  }

  // ── Panel cliente ────────────────────────────────────────────────────────────

  abrirPanelCliente(modo: ModoPanel = 'buscar') {
    this.modoPanel = modo;
    this.mostrarPanelCliente = true;
    this.dniBusqueda = this.cliente.dni === '00000000' ? '' : this.cliente.dni;
    this.clienteEncontrado = false;
    if (modo === 'lista') this.cargarListaClientes();
  }

  cerrarPanelCliente() {
    this.mostrarPanelCliente = false;
    this.dniBusqueda = '';
    this.clienteEncontrado = false;
    this.buscandoCliente = false;
    this.filtroBusquedaLista = '';
    this.nuevoCliente = this.clienteVacioFactory();
    this.resetErroresNuevoCliente();
  }

  cambiarModo(modo: ModoPanel) {
    this.modoPanel = modo;
    if (modo === 'lista') this.cargarListaClientes();
    if (modo === 'nuevo') {
      this.nuevoCliente = this.clienteVacioFactory();
      // Si venía del buscador con un DNI, prellenar
      if (this.dniBusqueda.length === 8) {
        this.nuevoCliente.dni = this.dniBusqueda;
      }
      this.resetErroresNuevoCliente();
    }
  }

  // ── Buscar por DNI ───────────────────────────────────────────────────────────

  buscarClientePorDni() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    if (dni.length < 8) { this.clienteEncontrado = false; return; }

    this.buscandoCliente = true;
    this.http.get<any>(`${this.URL_VENTAS}/buscar-cliente/${dni}`).subscribe({
      next: (res) => {
        this.buscandoCliente   = false;
        this.clienteEncontrado = true;
        this.cliente = {
          id_cliente:       res.id_cliente,
          dni:              res.dni,
          nombre:           res.nombre,
          apellido_paterno: res.apellido_paterno,
          apellido_materno: res.apellido_materno,
          celular:          res.celular,
          correo:           res.correo,
        };
      },
      error: () => {
        this.buscandoCliente   = false;
        this.clienteEncontrado = false;
        this.cliente = {
          dni, nombre: '', apellido_paterno: '',
          apellido_materno: '', celular: '', correo: '',
        };
      },
    });
  }

  confirmarCliente() {
    if (!this.cliente.nombre.trim()) {
      Swal.fire('Datos incompletos', 'El nombre del cliente es requerido.', 'warning');
      return;
    }
    this.cerrarPanelCliente();
  }

  usarClienteVarios() {
    this.cliente = { ...this.clienteVarios };
    this.cerrarPanelCliente();
  }

  // ── Lista de clientes ────────────────────────────────────────────────────────

  cargarListaClientes() {
    if (this.listaClientes.length > 0) {
      this.aplicarFiltroLista();
      return;
    }
    this.cargandoLista = true;
    this.http.get<any[]>(`${this.URL_CLIENTES}/listar`).subscribe({
      next: (data) => {
        this.listaClientes = data || [];
        this.aplicarFiltroLista();
        this.cargandoLista = false;
      },
      error: () => { this.cargandoLista = false; },
    });
  }

  aplicarFiltroLista() {
    const q = this.filtroBusquedaLista.toLowerCase().trim();
    // El backend devuelve campos con mayúsculas: 'Nombre', 'Apellido Paterno', etc.
    // Normalizamos para mostrar correctamente
    this.listaClientesFiltrada = !q
      ? [...this.listaClientes]
      : this.listaClientes.filter(c => {
          const dni      = (c.dni || c['DNI'] || '').toLowerCase();
          const nombre   = (c.nombre || c['Nombre'] || '').toLowerCase();
          const apPat    = (c.apellido_paterno || c['Apellido Paterno'] || '').toLowerCase();
          const celular  = (c.celular || c['Celular'] || '').toLowerCase();
          return dni.includes(q) || nombre.includes(q) || apPat.includes(q) || celular.includes(q);
        });
  }

  seleccionarDeListaClientes(c: any) {
    // Normalizar nombres de campos independientemente de cómo los devuelva el backend
    this.cliente = {
      id_cliente:       c.id_cliente || c['ID'] || undefined,
      dni:              c.dni        || c['DNI'] || '',
      nombre:           c.nombre     || c['Nombre'] || '',
      apellido_paterno: c.apellido_paterno || c['Apellido Paterno'] || '',
      apellido_materno: c.apellido_materno || c['Apellido Materno'] || '',
      celular:          c.celular    || c['Celular'] || '',
      correo:           c.correo     || c['Correo']  || '',
    };
    this.cerrarPanelCliente();
  }

  // ── Nuevo cliente ────────────────────────────────────────────────────────────

  private clienteVacioFactory(): Cliente {
    return { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
  }

  private resetErroresNuevoCliente() {
    this.errorDniNuevo       = false;
    this.errorNombreNuevo    = false;
    this.errorApPaternoNuevo = false;
    this.errorCelularNuevo   = false;
    this.errorCorreoNuevo    = false;
  }

  // Validaciones en tiempo real
  validarDniNuevo() {
    this.errorDniNuevo = !/^\d{8}$/.test(this.nuevoCliente.dni.trim());
  }

  validarNombreNuevo() {
    this.errorNombreNuevo = !this.nuevoCliente.nombre.trim() ||
      this.nuevoCliente.nombre.trim().length < 2;
  }

  validarApPaternoNuevo() {
    this.errorApPaternoNuevo = !this.nuevoCliente.apellido_paterno.trim();
  }

  validarCelularNuevo() {
    this.errorCelularNuevo = !/^9\d{8}$/.test(this.nuevoCliente.celular.trim());
  }

  validarCorreoNuevo() {
    this.errorCorreoNuevo = !!this.nuevoCliente.correo.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo.trim());
  }

  nuevoClienteValido(): boolean {
    return !this.errorDniNuevo && !this.errorNombreNuevo &&
           !this.errorApPaternoNuevo && !this.errorCelularNuevo &&
           !this.errorCorreoNuevo &&
           !!this.nuevoCliente.dni.trim() &&
           !!this.nuevoCliente.nombre.trim() &&
           !!this.nuevoCliente.apellido_paterno.trim() &&
           !!this.nuevoCliente.celular.trim();
  }

  guardarNuevoCliente() {
    this.validarDniNuevo();
    this.validarNombreNuevo();
    this.validarApPaternoNuevo();
    this.validarCelularNuevo();
    this.validarCorreoNuevo();

    if (!this.nuevoClienteValido()) {
      Swal.fire('Datos incompletos', 'Corrige los campos marcados antes de continuar.', 'warning');
      return;
    }

    this.guardandoCliente = true;
    this.http.post<Cliente>(`${this.URL_CLIENTES}/registrar`, this.nuevoCliente).subscribe({
      next: (res) => {
        this.guardandoCliente = false;
        this.listaClientes    = [];
        this.cliente          = { ...res };
        Swal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1500, showConfirmButton: false });
        this.cerrarPanelCliente();
      },
      error: (err) => {
        this.guardandoCliente = false;
        Swal.fire('Error', err?.error || 'No se pudo registrar el cliente.', 'error');
      },
    });
  }

  // ── Nombre completo ──────────────────────────────────────────────────────────

  get nombreCompletoCliente(): string {
    if (this.cliente.dni === '00000000') return 'Cliente Varios';
    const parts = [this.cliente.nombre, this.cliente.apellido_paterno, this.cliente.apellido_materno];
    return parts.filter(Boolean).join(' ') || 'Sin nombre';
  }

  // ── Repuestos ────────────────────────────────────────────────────────────────

  cargarRepuestos() {
    this.cargandoRepuestos = true;
    // Usamos el endpoint de productos que ya existe y funciona
    this.http.get<any[]>(`${this.URL_PRODUCTOS}/listar`).subscribe({
      next: (data) => {
        // Normalizamos para que coincida con la interfaz Repuesto
        this.repuestos = (data || []).map(p => ({
          id_repuesto:  p.id_repuesto || 0,
          codigo:       p.codigo      || '',
          nombre:       p.nombre      || '',
          marca:        p.marca       || '',
          categoria:    p.categoria   || '',
          stock:        p.stock       || p.cantidad || 0,
          stock_minimo: p.stock_minimo || p.stockMinimo || 5,
          precio_venta: p.precio_venta || p.precioVenta || 0,
        }));
        this.cargandoRepuestos = false;
      },
      error: () => { this.cargandoRepuestos = false; },
    });
  }

  filtrarRepuestosItem(item: ItemDetalle) {
    const q = item.busqueda.toLowerCase().trim();
    if (!q) { item.resultados = []; item.mostrarDropdown = false; return; }
    item.resultados      = this.repuestos
      .filter(r => r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q))
      .slice(0, 8);
    item.mostrarDropdown = item.resultados.length > 0 || !!q;
  }

  seleccionarRepuesto(rep: Repuesto, item: ItemDetalle) {
    item.repuesto        = rep;
    item.precio_unit     = rep.precio_venta;
    item.cantidad        = 1;
    item.descripcion     = '';
    item.busqueda        = '';
    item.resultados      = [];
    item.mostrarDropdown = false;
  }

  limpiarRepuesto(item: ItemDetalle) {
    item.repuesto        = this.repuestoVacioFactory();
    item.busqueda        = '';
    item.resultados      = [];
    item.mostrarDropdown = false;
  }

  private repuestoVacioFactory(): Repuesto {
    return { id_repuesto: 0, codigo: '', nombre: '', marca: '', categoria: '', stock: 0, stock_minimo: 0, precio_venta: 0 };
  }

  agregarItem() {
    this.items.push({
      repuesto:        this.repuestoVacioFactory(),
      descripcion:     '',
      cantidad:        1,
      precio_unit:     0,
      descuento:       0,
      busqueda:        '',
      resultados:      [],
      mostrarDropdown: false,
    });
  }

  eliminarItem(idx: number) { this.items.splice(idx, 1); }

  importeItem(item: ItemDetalle): number {
    const bruto = item.cantidad * item.precio_unit;
    return bruto - (bruto * item.descuento / 100);
  }

  // ── Totales ──────────────────────────────────────────────────────────────────

  get subtotal(): number {
    return this.items.reduce((sum, it) => sum + this.importeItem(it), 0);
  }

  get descuentoMonto(): number {
    return this.descuentoTipo === '%'
      ? this.subtotal * this.descuentoGlobal / 100
      : this.descuentoGlobal;
  }

  get igv(): number {
    return (this.subtotal - this.descuentoMonto) * 0.18;
  }

  get total(): number {
    return this.subtotal - this.descuentoMonto + this.igv;
  }

  onTipoChange() {
    this.serie = this.tipoComprobante === 'Boleta' ? 'B001' : 'F001';
  }

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
      id_usuario: idUsuario,
      cliente: {
        dni:              this.cliente.dni,
        nombre:           this.cliente.nombre,
        apellido_paterno: this.cliente.apellido_paterno,
        apellido_materno: this.cliente.apellido_materno,
        celular:          this.cliente.celular,
        correo:           this.cliente.correo,
      },
      items: this.items.map(it => ({
        id_repuesto:     it.repuesto.id_repuesto,
        cantidad:        it.cantidad,
        precio_subtotal: this.importeItem(it),
      })),
      precio_total: this.total,
    };

    this.guardando = true;
    this.http.post<any>(`${this.URL_VENTAS}/registrar`, payload).subscribe({
      next: (res) => {
        this.guardando = false;
        Swal.fire({
          title: '¡Venta registrada!',
          html:  `<b>Total: S/ ${this.total.toFixed(2)}</b><br>Orden N° ${res.id_orden_venta}<br>Cliente: ${this.nombreCompletoCliente}`,
          icon:  'success',
          confirmButtonColor: '#dc3545',
        }).then(() => this.limpiar());
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error || 'No se pudo registrar la venta', 'error');
      },
    });
  }

  limpiar() {
    this.cliente         = { ...this.clienteVarios };
    this.items           = [];
    this.descuentoGlobal = 0;
    this.descuentoTipo   = '%';
    this.nota            = '';
    this.fechaEmision    = new Date().toISOString().split('T')[0];
    this.tipoComprobante = 'Boleta';
    this.serie           = 'B001';
    this.agregarItem();
  }
}

import { API_BASE_URL } from '@config';
import { Component, OnInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import Swal from 'sweetalert2';

interface VentaResumen {
  idOrdenVenta: number;
  fecha:        string;
  hora:         string;
  cliente:      string;
  dniCliente:   string;
  vendedor:     string;
  metodoPago:   string;
  precioTotal:  number;
}

interface ResumenHoy {
  totalVentas:   number;
  montoTotalHoy: number;
  ticketPromedio: number;
}

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
type Vista = 'lista' | 'crear';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private URL_VENTAS   = `${API_BASE_URL}/api/ventas`;
  private URL_CLIENTES = `${API_BASE_URL}/api/clientes`;
  private URL_PRODUCTOS = `${API_BASE_URL}/api/productos`;

  // ── Vista activa ─────────────────────────────────────────────────────────────
  vista: Vista = 'lista';

  // ── Resumen ──────────────────────────────────────────────────────────────────
  resumen: ResumenHoy = { totalVentas: 0, montoTotalHoy: 0, ticketPromedio: 0 };
  cargandoResumen = true;

  // ── Tabla ────────────────────────────────────────────────────────────────────
  ventas: VentaResumen[] = [];
  cargandoTabla = true;
  busqueda = '';
  paginaActual = 1;
  porPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;
  private timerBusqueda: any;

  // ── Formulario crear venta ───────────────────────────────────────────────────
  tipoComprobante = 'Boleta';
  serie           = 'B001';
  estado          = 'Pagado';
  metodoPago      = 'Efectivo';
  fechaEmision: string = new Date().toISOString().split('T')[0];
  vendedor = { nombre: '', cargo: '', codigo: '' };
  nota     = '';
  guardando = false;

  readonly metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin'];

  // ── Cliente ──────────────────────────────────────────────────────────────────
  readonly clienteVarios: Cliente = {
    dni: '00000000', nombre: 'Cliente', apellido_paterno: 'Varios',
    apellido_materno: '', celular: '000000000', correo: 'sin-correo@correo.com',
  };
  cliente: Cliente = { ...this.clienteVarios };
  mostrarPanelCliente = false;
  modoPanel: ModoPanel = 'buscar';
  dniBusqueda = '';
  buscandoCliente = false;
  clienteEncontrado = false;
  listaClientes: any[] = [];
  listaClientesFiltrada: any[] = [];
  cargandoLista = false;
  filtroBusquedaLista = '';
  nuevoCliente: Cliente = this.clienteVacioFactory();
  guardandoCliente = false;
  errorDniNuevo = false;
  errorNombreNuevo = false;
  errorApPaternoNuevo = false;
  errorCelularNuevo = false;
  errorCorreoNuevo = false;

  // ── Items ────────────────────────────────────────────────────────────────────
  items: ItemDetalle[] = [];
  repuestos: Repuesto[] = [];
  cargandoRepuestos = false;
  descuentoGlobal = 0;
  descuentoTipo: '%' | 'S/' = '%';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarResumen();
      this.cargarVentas();
      this.cargarVendedor();
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────────
  cargarResumen() {
    this.cargandoResumen = true;
    // Simulación — reemplazar con: this.http.get<ResumenHoy>(`${this.URL_VENTAS}/resumen-hoy`).subscribe(...)
    this.resumen = { totalVentas: 12, montoTotalHoy: 3450.00, ticketPromedio: 287.50 };
    this.cargandoResumen = false;
  }

  cargarVentas() {
    this.cargandoTabla = true;
    // Simulación — reemplazar con llamada real al back
    this.ventas = [
      { idOrdenVenta: 4, fecha: '27/06/2026', hora: '11:20', cliente: 'Robert Tucto',    dniCliente: '74771893', vendedor: 'admin', metodoPago: 'Yape',         precioTotal: 450.00 },
      { idOrdenVenta: 3, fecha: '27/06/2026', hora: '10:45', cliente: 'Cliente Varios',  dniCliente: '00000000', vendedor: 'admin', metodoPago: 'Efectivo',      precioTotal: 95.00  },
      { idOrdenVenta: 2, fecha: '27/06/2026', hora: '09:30', cliente: 'Jose Rodriguez',  dniCliente: '74622234', vendedor: 'admin', metodoPago: 'Transferencia', precioTotal: 180.50 },
      { idOrdenVenta: 1, fecha: '27/06/2026', hora: '08:15', cliente: 'Rafael Mendoza',  dniCliente: '75481236', vendedor: 'admin', metodoPago: 'Tarjeta',       precioTotal: 320.00 },
    ];
    this.totalRegistros = 4;
    this.totalPaginas   = 1;
    this.cargandoTabla  = false;
  }

  onBusqueda() {
    clearTimeout(this.timerBusqueda);
    this.timerBusqueda = setTimeout(() => { this.paginaActual = 1; this.cargarVentas(); }, 400);
  }

  get paginas(): number[] {
    const rango = 2;
    const inicio = Math.max(1, this.paginaActual - rango);
    const fin    = Math.min(this.totalPaginas, this.paginaActual + rango);
    const arr: number[] = [];
    for (let i = inicio; i <= fin; i++) arr.push(i);
    return arr;
  }

  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas || p === this.paginaActual) return;
    this.paginaActual = p;
    this.cargarVentas();
  }

  cambiarPorPagina() { this.paginaActual = 1; this.cargarVentas(); }

  // ── Navegación entre vistas ───────────────────────────────────────────────────
  nuevaVenta() {
    this.vista = 'crear';
    this.cargarVendedor();
    this.cargarRepuestos();
    this.agregarItem();
  }

  volverLista() {
    this.vista = 'lista';
    this.limpiar();
    this.cargarVentas();
  }

  // ── Vendedor ──────────────────────────────────────────────────────────────────
  cargarVendedor() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.vendedor = {
        nombre: user.trabajadorCompleto || user.username || 'Sin nombre',
        cargo:  user.rolNombre || '',
        codigo: user.username || '',
      };
    } catch {
      this.vendedor = { nombre: 'Sin nombre', cargo: '', codigo: '' };
    }
  }

  onTipoChange() { this.serie = this.tipoComprobante === 'Boleta' ? 'B001' : 'F001'; }

  // ── Panel cliente ─────────────────────────────────────────────────────────────
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
      if (this.dniBusqueda.length === 8) this.nuevoCliente.dni = this.dniBusqueda;
      this.resetErroresNuevoCliente();
    }
  }

  buscarClientePorDni() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    if (dni.length < 8) { this.clienteEncontrado = false; return; }
    this.buscandoCliente = true;
    this.http.get<any>(`${this.URL_VENTAS}/buscar-cliente/${dni}`).subscribe({
      next: (res) => {
        this.buscandoCliente = false;
        this.clienteEncontrado = true;
        this.cliente = { id_cliente: res.id_cliente, dni: res.dni, nombre: res.nombre,
          apellido_paterno: res.apellido_paterno, apellido_materno: res.apellido_materno,
          celular: res.celular, correo: res.correo };
      },
      error: () => {
        this.buscandoCliente = false;
        this.clienteEncontrado = false;
        this.cliente = { dni, nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
      },
    });
  }

  confirmarCliente() {
    if (!this.cliente.nombre.trim()) { Swal.fire('Datos incompletos', 'El nombre del cliente es requerido.', 'warning'); return; }
    this.cerrarPanelCliente();
  }

  usarClienteVarios() { this.cliente = { ...this.clienteVarios }; this.cerrarPanelCliente(); }

  cargarListaClientes() {
    if (this.listaClientes.length > 0) { this.aplicarFiltroLista(); return; }
    this.cargandoLista = true;
    this.http.get<any[]>(`${this.URL_CLIENTES}/listar`).subscribe({
      next: (data) => { this.listaClientes = data || []; this.aplicarFiltroLista(); this.cargandoLista = false; },
      error: () => { this.cargandoLista = false; },
    });
  }

  aplicarFiltroLista() {
    const q = this.filtroBusquedaLista.toLowerCase().trim();
    this.listaClientesFiltrada = !q ? [...this.listaClientes]
      : this.listaClientes.filter(c => {
          const dni    = (c.dni || '').toLowerCase();
          const nombre = (c.nombre || '').toLowerCase();
          const apPat  = (c.apellido_paterno || '').toLowerCase();
          const cel    = (c.celular || '').toLowerCase();
          return dni.includes(q) || nombre.includes(q) || apPat.includes(q) || cel.includes(q);
        });
  }

  seleccionarDeListaClientes(c: any) {
    this.cliente = { id_cliente: c.id_cliente, dni: c.dni || '', nombre: c.nombre || '',
      apellido_paterno: c.apellido_paterno || '', apellido_materno: c.apellido_materno || '',
      celular: c.celular || '', correo: c.correo || '' };
    this.cerrarPanelCliente();
  }

  private clienteVacioFactory(): Cliente {
    return { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
  }

  private resetErroresNuevoCliente() {
    this.errorDniNuevo = this.errorNombreNuevo = this.errorApPaternoNuevo =
    this.errorCelularNuevo = this.errorCorreoNuevo = false;
  }

  validarDniNuevo()      { this.errorDniNuevo      = !/^\d{8}$/.test(this.nuevoCliente.dni.trim()); }
  validarNombreNuevo()   { this.errorNombreNuevo   = !this.nuevoCliente.nombre.trim() || this.nuevoCliente.nombre.trim().length < 2; }
  validarApPaternoNuevo(){ this.errorApPaternoNuevo= !this.nuevoCliente.apellido_paterno.trim(); }
  validarCelularNuevo()  { this.errorCelularNuevo  = !/^9\d{8}$/.test(this.nuevoCliente.celular.trim()); }
  validarCorreoNuevo()   { this.errorCorreoNuevo   = !!this.nuevoCliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo.trim()); }

  nuevoClienteValido(): boolean {
    return !this.errorDniNuevo && !this.errorNombreNuevo && !this.errorApPaternoNuevo &&
           !this.errorCelularNuevo && !this.errorCorreoNuevo &&
           !!this.nuevoCliente.dni.trim() && !!this.nuevoCliente.nombre.trim() &&
           !!this.nuevoCliente.apellido_paterno.trim() && !!this.nuevoCliente.celular.trim();
  }

  guardarNuevoCliente() {
    this.validarDniNuevo(); this.validarNombreNuevo(); this.validarApPaternoNuevo();
    this.validarCelularNuevo(); this.validarCorreoNuevo();
    if (!this.nuevoClienteValido()) { Swal.fire('Datos incompletos', 'Corrige los campos marcados.', 'warning'); return; }
    this.guardandoCliente = true;
    this.http.post<Cliente>(`${this.URL_CLIENTES}/registrar`, this.nuevoCliente).subscribe({
      next: (res) => { this.guardandoCliente = false; this.listaClientes = []; this.cliente = { ...res };
        Swal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1500, showConfirmButton: false });
        this.cerrarPanelCliente(); },
      error: (err) => { this.guardandoCliente = false; Swal.fire('Error', err?.error || 'No se pudo registrar.', 'error'); },
    });
  }

  get nombreCompletoCliente(): string {
    if (this.cliente.dni === '00000000') return 'Cliente Varios';
    return [this.cliente.nombre, this.cliente.apellido_paterno, this.cliente.apellido_materno]
      .filter(Boolean).join(' ') || 'Sin nombre';
  }

  // ── Repuestos ────────────────────────────────────────────────────────────────
  cargarRepuestos() {
    this.cargandoRepuestos = true;
    this.http.get<any[]>(`${this.URL_PRODUCTOS}/listar`).subscribe({
      next: (data) => {
        this.repuestos = (data || []).map(p => ({
          id_repuesto: p.id_repuesto || 0, codigo: p.codigo || '', nombre: p.nombre || '',
          marca: p.marca || '', categoria: p.categoria || '',
          stock: p.stock || p.cantidad || 0, stock_minimo: p.stock_minimo || 5,
          precio_venta: p.precio_venta || 0,
        }));
        this.cargandoRepuestos = false;
      },
      error: () => { this.cargandoRepuestos = false; },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.celda-repuesto')) this.items.forEach(it => it.mostrarDropdown = false);
  }

  filtrarRepuestosItem(item: ItemDetalle) {
    const q = item.busqueda.toLowerCase().trim();
    if (!q) { item.resultados = []; item.mostrarDropdown = false; return; }
    item.resultados = this.repuestos.filter(r => r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)).slice(0, 8);
    item.mostrarDropdown = item.resultados.length > 0 || !!q;
  }

  seleccionarRepuesto(rep: Repuesto, item: ItemDetalle) {
    item.repuesto = rep; item.precio_unit = rep.precio_venta; item.cantidad = 1;
    item.descripcion = ''; item.busqueda = ''; item.resultados = []; item.mostrarDropdown = false;
  }

  limpiarRepuesto(item: ItemDetalle) {
    item.repuesto = this.repuestoVacioFactory(); item.busqueda = ''; item.resultados = []; item.mostrarDropdown = false;
  }

  private repuestoVacioFactory(): Repuesto {
    return { id_repuesto: 0, codigo: '', nombre: '', marca: '', categoria: '', stock: 0, stock_minimo: 0, precio_venta: 0 };
  }

  agregarItem() {
    this.items.push({ repuesto: this.repuestoVacioFactory(), descripcion: '', cantidad: 1,
      precio_unit: 0, descuento: 0, busqueda: '', resultados: [], mostrarDropdown: false });
  }

  eliminarItem(idx: number) { this.items.splice(idx, 1); }

  importeItem(item: ItemDetalle): number {
    const bruto = item.cantidad * item.precio_unit;
    return bruto - (bruto * item.descuento / 100);
  }

  get subtotal(): number { return this.items.reduce((s, it) => s + this.importeItem(it), 0); }
  get descuentoMonto(): number { return this.descuentoTipo === '%' ? this.subtotal * this.descuentoGlobal / 100 : this.descuentoGlobal; }
  get igv(): number { return (this.subtotal - this.descuentoMonto) * 0.18; }
  get total(): number { return this.subtotal - this.descuentoMonto + this.igv; }

  itemsValidos(): boolean { return this.items.length > 0 && this.items.every(it => it.repuesto.id_repuesto > 0 && it.cantidad > 0); }

  confirmarVenta() {
    if (!this.itemsValidos()) { Swal.fire('Sin ítems válidos', 'Agregue al menos un repuesto con cantidad válida.', 'warning'); return; }
    let idUsuario = 0;
    try { const user = JSON.parse(localStorage.getItem('currentUser') || '{}'); idUsuario = user.id || user.id_usuario || 0; } catch {}

    const payload = {
      id_usuario: idUsuario, metodo_pago: this.metodoPago,
      cliente: { dni: this.cliente.dni, nombre: this.cliente.nombre, apellido_paterno: this.cliente.apellido_paterno,
        apellido_materno: this.cliente.apellido_materno, celular: this.cliente.celular, correo: this.cliente.correo },
      items: this.items.map(it => ({ id_repuesto: it.repuesto.id_repuesto, cantidad: it.cantidad, precio_subtotal: this.importeItem(it) })),
      precio_total: this.total,
    };

    this.guardando = true;
    this.http.post<any>(`${this.URL_VENTAS}/registrar`, payload).subscribe({
      next: (res) => {
        this.guardando = false;
        Swal.fire({ title: '¡Venta registrada!',
          html: `<b>Total: S/ ${this.total.toFixed(2)}</b><br>Orden N° ${res.id_orden_venta}<br>Cliente: ${this.nombreCompletoCliente}`,
          icon: 'success', confirmButtonColor: '#dc3545' }).then(() => this.volverLista());
      },
      error: (err) => { this.guardando = false; Swal.fire('Error', err.error || 'No se pudo registrar la venta', 'error'); },
    });
  }

  limpiar() {
    this.cliente = { ...this.clienteVarios }; this.items = []; this.descuentoGlobal = 0;
    this.descuentoTipo = '%'; this.nota = ''; this.metodoPago = 'Efectivo';
    this.fechaEmision = new Date().toISOString().split('T')[0];
    this.tipoComprobante = 'Boleta'; this.serie = 'B001';
  }
}
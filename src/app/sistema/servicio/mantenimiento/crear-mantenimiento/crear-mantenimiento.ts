import { API_BASE_URL } from '@config';
import { Component, OnInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Servicio {
  id_servicio: number;
  nombre:      string;
  precio:      number;
}

interface Tecnico {
  id_trabajador:   number;
  nombre_completo: string;
  cargo:           string;
}

interface ItemServicio {
  servicio:        Servicio;
  id_trabajador:   number;
  cantidad:        number;
  precio_subtotal: number;
  // Estado local del buscador — no se envía al backend
  busqueda:        string;
  resultados:      Servicio[];
  mostrarDropdown: boolean;
}

interface Cliente {
  id_cliente?:       number;
  dni:               string;
  nombre:            string;
  apellido_paterno:  string;
  apellido_materno:  string;
  celular:           string;
  correo:            string;
}

type ModoPanel = 'buscar' | 'lista' | 'nuevo';

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-crear-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-mantenimiento.html',
  styleUrl: './crear-mantenimiento.css',
})
export class CrearMantenimiento implements OnInit {

  private http        = inject(HttpClient);
  private router      = inject(Router);
  private platformId  = inject(PLATFORM_ID);

  private URL         = `${API_BASE_URL}/api/mantenimiento`;
  private URL_CLIENTES = `${API_BASE_URL}/api/clientes`;

  // ── Cabecera ─────────────────────────────────────────────────────────────────
  fechaEmision: string = new Date().toISOString().split('T')[0];
  descripcionVehiculo  = '';
  precioManoObra       = 0;
  idEstado             = 1;
  nota                 = '';

  // ── Técnico responsable (usuario logueado) ────────────────────────────────
  tecnicoLogueado = { nombre: '', cargo: '', codigo: '' };

  // ── Cliente seleccionado ─────────────────────────────────────────────────────
  cliente: Cliente = this.clienteVacioFactory();

  // ── Panel lateral de cliente ─────────────────────────────────────────────────
  mostrarPanelCliente  = false;
  modoPanel: ModoPanel = 'buscar';

  // Modo buscar por DNI
  dniBusqueda       = '';
  buscandoCliente   = false;
  clienteEncontrado = false;

  // Modo lista
  listaClientes:         Cliente[] = [];
  listaClientesFiltrada: Cliente[] = [];
  cargandoLista          = false;
  filtroBusquedaLista    = '';

  // Modo nuevo
  nuevoCliente: Cliente = this.clienteVacioFactory();
  guardandoCliente      = false;

  // ── Catálogos ────────────────────────────────────────────────────────────────
  servicios:        Servicio[] = [];
  tecnicos:         Tecnico[]  = [];
  cargandoCatalogos = false;

  // ── Ítems de la orden ────────────────────────────────────────────────────────
  items: ItemServicio[] = [];

  // ── Estado UI ───────────────────────────────────────────────────────────────
  guardando = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarTecnicoLogueado();
      this.cargarCatalogos();
      this.agregarItem();
    }
  }

  // ── Cerrar dropdowns al hacer clic fuera ────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.celda-servicio')) {
      this.items.forEach(it => it.mostrarDropdown = false);
    }
  }

  // ── Técnico logueado ─────────────────────────────────────────────────────────
  cargarTecnicoLogueado() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.tecnicoLogueado = {
        nombre: user.trabajadorCompleto || user.username || 'Sin nombre',
        cargo:  user.rolNombre || '',
        codigo: user.username || '',
      };
    } catch {
      this.tecnicoLogueado = { nombre: 'Sin nombre', cargo: '', codigo: '' };
    }
  }

  // ── Catálogos ────────────────────────────────────────────────────────────────
  cargarCatalogos() {
    this.cargandoCatalogos = true;
    this.http.get<Servicio[]>(`${this.URL}/servicios`).subscribe({
      next: (r) => { this.servicios = r || []; this.cargandoCatalogos = false; },
      error: ()  => { this.cargandoCatalogos = false; },
    });
    this.http.get<Tecnico[]>(`${this.URL}/tecnicos`).subscribe({
      next: (r) => { this.tecnicos = r || []; },
    });
  }

  // ── Panel cliente ────────────────────────────────────────────────────────────

  abrirPanelCliente(modo: ModoPanel = 'buscar') {
    this.modoPanel = modo;
    this.mostrarPanelCliente = true;
    this.dniBusqueda = this.cliente.dni || '';
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
  }

  cambiarModo(modo: ModoPanel) {
    this.modoPanel = modo;
    if (modo === 'lista') this.cargarListaClientes();
    if (modo === 'nuevo') this.nuevoCliente = this.clienteVacioFactory();
  }

  // ── Buscar por DNI ───────────────────────────────────────────────────────────

  buscarClientePorDni() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    if (dni.length < 8) { this.clienteEncontrado = false; return; }

    this.buscandoCliente = true;
    this.http.get<any>(`${this.URL}/buscar-cliente/${dni}`).subscribe({
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
        this.cliente = { dni, nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
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

  // ── Lista de clientes ────────────────────────────────────────────────────────

  cargarListaClientes() {
    if (this.listaClientes.length > 0) { this.aplicarFiltroLista(); return; }
    this.cargandoLista = true;
    this.http.get<Cliente[]>(`${this.URL_CLIENTES}/listar`).subscribe({
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
    this.listaClientesFiltrada = !q
      ? [...this.listaClientes]
      : this.listaClientes.filter(c =>
          c.dni.includes(q) ||
          c.nombre.toLowerCase().includes(q) ||
          c.apellido_paterno.toLowerCase().includes(q) ||
          c.celular?.includes(q)
        );
  }

  seleccionarDeListaClientes(c: Cliente) {
    this.cliente = { ...c };
    this.cerrarPanelCliente();
  }

  // ── Nuevo cliente ────────────────────────────────────────────────────────────

  private clienteVacioFactory(): Cliente {
    return { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
  }

  guardarNuevoCliente() {
    const { dni, nombre, apellido_paterno, celular } = this.nuevoCliente;
    if (!dni.trim() || !nombre.trim() || !apellido_paterno.trim() || !celular.trim()) {
      Swal.fire('Datos incompletos', 'DNI, nombre, apellido paterno y celular son requeridos.', 'warning');
      return;
    }
    if (dni.replace(/\D/g, '').length !== 8) {
      Swal.fire('DNI inválido', 'El DNI debe tener exactamente 8 dígitos.', 'warning');
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
    const parts = [this.cliente.nombre, this.cliente.apellido_paterno, this.cliente.apellido_materno];
    return parts.filter(Boolean).join(' ') || '—';
  }

  // ── Filtro servicios por fila ────────────────────────────────────────────────

  filtrarServiciosItem(item: ItemServicio) {
    const q = item.busqueda.toLowerCase().trim();
    if (!q) { item.resultados = []; item.mostrarDropdown = false; return; }
    item.resultados      = this.servicios
      .filter(s => s.nombre.toLowerCase().includes(q))
      .slice(0, 8);
    item.mostrarDropdown = item.resultados.length > 0;
  }

  seleccionarServicio(serv: Servicio, item: ItemServicio) {
    item.servicio        = serv;
    item.precio_subtotal = serv.precio * item.cantidad;
    item.busqueda        = '';
    item.resultados      = [];
    item.mostrarDropdown = false;
  }

  limpiarServicio(item: ItemServicio) {
    item.servicio        = { id_servicio: 0, nombre: '', precio: 0 };
    item.busqueda        = '';
    item.resultados      = [];
    item.mostrarDropdown = false;
    item.precio_subtotal = 0;
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  agregarItem() {
    this.items.push({
      servicio:        { id_servicio: 0, nombre: '', precio: 0 },
      id_trabajador:   0,
      cantidad:        1,
      precio_subtotal: 0,
      busqueda:        '',
      resultados:      [],
      mostrarDropdown: false,
    });
  }

  eliminarItem(idx: number) {
    this.items.splice(idx, 1);
  }

  recalcularSubtotal(item: ItemServicio) {
    item.precio_subtotal = item.servicio.precio * item.cantidad;
  }

  // ── Totales ──────────────────────────────────────────────────────────────────

  get subtotalServicios(): number {
    return this.items.reduce((s, it) => s + it.precio_subtotal, 0);
  }

  get igv(): number {
    return (this.subtotalServicios + this.precioManoObra) * 0.18;
  }

  get total(): number {
    return this.subtotalServicios + this.precioManoObra + this.igv;
  }

  // ── Validación ───────────────────────────────────────────────────────────────

  itemsValidos(): boolean {
    return this.items.length > 0 &&
           this.items.every(it => it.servicio.id_servicio > 0 && it.id_trabajador > 0 && it.cantidad > 0);
  }

  formularioValido(): boolean {
    return !!this.cliente.nombre.trim() && !!this.descripcionVehiculo.trim() && this.itemsValidos();
  }

  // ── Registrar ────────────────────────────────────────────────────────────────

  confirmarMantenimiento() {
    if (!this.formularioValido()) {
      Swal.fire('Datos incompletos', 'Complete el cliente, el vehículo y al menos un servicio con técnico asignado.', 'warning');
      return;
    }

    const payload = {
      cliente:              { ...this.cliente },
      descripcion_vehiculo: this.descripcionVehiculo,
      precio_mano_obra:     this.precioManoObra,
      precio_total:         this.total,
      id_estado:            this.idEstado,
      items: this.items.map(it => ({
        id_servicio:     it.servicio.id_servicio,
        id_trabajador:   it.id_trabajador,
        cantidad:        it.cantidad,
        precio_subtotal: it.precio_subtotal,
      })),
    };

    this.guardando = true;
    this.http.post<any>(`${this.URL}/registrar`, payload).subscribe({
      next: (res) => {
        this.guardando = false;
        Swal.fire({
          title: '¡Orden registrada!',
          html:  `<b>Total: S/ ${this.total.toFixed(2)}</b><br>Orden N° ${res.id_orden_servicio}<br>Cliente: ${this.nombreCompletoCliente}`,
          icon:  'success',
          confirmButtonColor: '#dc3545',
        }).then(() => this.router.navigate(['/sistema/servicio/mantenimiento']));
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error || 'No se pudo registrar la orden', 'error');
      },
    });
  }

  limpiar() {
    this.cliente             = this.clienteVacioFactory();
    this.descripcionVehiculo = '';
    this.precioManoObra      = 0;
    this.nota                = '';
    this.items               = [];
    this.agregarItem();
  }

  volver() {
    this.router.navigate(['/sistema/servicio/mantenimiento']);
  }
}
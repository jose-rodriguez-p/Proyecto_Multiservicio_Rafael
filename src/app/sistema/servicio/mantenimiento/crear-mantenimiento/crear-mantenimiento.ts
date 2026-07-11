import { API_BASE_URL } from '@config';
import { Component, OnInit, HostListener, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RepuestoServicio {
  nombre_repuesto: string;
  cantidad:        number;
  cantidad_usar:   number;
  precio_unitario: number;
  subtotal:        number;
}

interface Servicio {
  id_servicio: number;
  nombre:      string;
  estado:      string;
  precio?:     number;
  repuestos?:  RepuestoServicio[];
}

interface Producto {
  nombre: string;
  precio_venta: number;
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
  busqueda:        string;
  resultados:      Servicio[];
  mostrarDropdown: boolean;
  repuestos:      RepuestoServicio[];
}

interface Vehiculo {
  placa:  string;
  marca:  string;
  modelo: string;
  anio:   string;
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
  private cdr         = inject(ChangeDetectorRef);

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

  // ── Cliente ──────────────────────────────────────────────────────────────────
  cliente: Cliente = this.clienteVacioFactory();
  dniBusqueda       = '';
  buscandoCliente   = false;
  clienteEncontrado = false;
  dniBuscado        = false;

  // ── Vehículos del cliente ────────────────────────────────────────────────────
  clientVehicles:      Vehiculo[] = [];
  showVehicleModal     = false;
  mostrandoFormVehiculo = false;
  vehiculoSeleccionado: Vehiculo | null = null;

  // ── Formulario nuevo vehículo (modal selección) ──────────────────────────────
  nuevoVehiculo: Vehiculo = this.vehiculoVacioFactory();

  marcaTexto = '';
  modeloTexto = '';
  mostrarSugerenciasMarca = false;
  mostrarSugerenciasModelo = false;
  errorPlaca = false;
  errorPlacaDuplicada = false;

  // ── Registro de nuevo cliente ────────────────────────────────────────────────
  showRegistroModal      = false;
  registroCliente: any   = null;
  dniValidadoRegistro    = false;
  consultandoDniRegistro = false;
  registroVehiculos: any[] = [];
  errorCelularRegistro   = false;

  regVehiculo: any = this.regVehiculoVacioFactory();
  regMarcaTexto = '';
  regModeloTexto = '';
  regMostrarSugerenciasMarca = false;
  regMostrarSugerenciasModelo = false;
  regErrorPlaca = false;
  regErrorPlacaDuplicada = false;
  regErrorPlacaDuplicadaMensaje = '';

  readonly catalogoMarcas: Record<string, string[]> = {
    'Toyota':        ['Avanza', 'Camry', 'Corolla', 'FJ Cruiser', 'Fortuner', 'Hiace', 'Hilux', 'Innova', 'Land Cruiser', 'Land Cruiser Prado', 'RAV4', 'Rush', 'Yaris'],
    'Hyundai':       ['Accent', 'Creta', 'Elantra', 'Grand i10', 'H1', 'HD65', 'HD78', 'Ioniq 5', 'Kona', 'Santa Fe', 'Sonata', 'Tucson'],
    'Kia':           ['Carnival', 'Cerato', 'EV6', 'Grand Carnival', 'K2500', 'Niro', 'Picanto', 'Rio', 'Seltos', 'Sorento', 'Sportage', 'Stinger'],
    'Nissan':        ['Frontier', 'Kicks', 'Leaf', 'Murano', 'Navara', 'NP300', 'Pathfinder', 'Qashqai', 'Sentra', 'Terra', 'Versa', 'X-Trail'],
    'Chevrolet':     ['Aveo', 'Blazer', 'Captiva', 'Colorado', 'Cruze', 'D-Max', 'Equinox', 'N300', 'Silverado', 'Spark', 'Tracker', 'Trailblazer'],
    'Mitsubishi':    ['ASX', 'Eclipse Cross', 'Galant', 'L200', 'Lancer', 'Mirage', 'Montero', 'Montero Sport', 'Outlander', 'Pajero', 'Xpander'],
    'Ford':          ['Bronco', 'EcoSport', 'Edge', 'Escape', 'Explorer', 'F-150', 'F-250', 'Mustang', 'Ranger', 'Territory'],
    'Honda':         ['Accord', 'BR-V', 'City', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Jazz', 'Odyssey', 'Pilot'],
    'Suzuki':        ['Alto', 'Baleno', 'Ertiga', 'Grand Vitara', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'],
    'Mazda':         ['BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-9', 'Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5'],
    'Volkswagen':    ['Amarok', 'Golf', 'Jetta', 'Passat', 'Polo', 'T-Cross', 'Taos', 'Tiguan', 'Touareg', 'Virtus'],
    'Renault':       ['Captur', 'Clio', 'Duster', 'Kangoo', 'Koleos', 'Logan', 'Oroch', 'Sandero', 'Stepway'],
    'Peugeot':       ['208', '2008', '3008', '5008', '508', 'Boxer', 'Expert', 'Partner'],
    'Fiat':          ['Cronos', 'Ducato', 'Fiorino', 'Mobi', 'Pulse', 'Strada', 'Toro'],
    'Subaru':        ['Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'XV'],
    'Jeep':          ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Renegade', 'Wrangler'],
    'BMW':           ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7'],
    'Mercedes-Benz': ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'Clase S', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'Sprinter', 'Vito'],
    'Audi':          ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
    'Chery':         ['Arrizo 5', 'Arrizo 6', 'Omoda 5', 'Tiggo 2', 'Tiggo 2 Pro', 'Tiggo 4', 'Tiggo 4 Pro', 'Tiggo 7', 'Tiggo 7 Pro', 'Tiggo 8', 'Tiggo 8 Pro'],
    'JAC':           ['J4', 'J7', 'S2', 'S3', 'S4', 'T6', 'T8', 'X200', 'X350'],
    'DFSK':          ['C31', 'C35', 'Glory 330', 'Glory 360', 'Glory 500', 'Glory 580', 'K01H', 'K07'],
    'Great Wall':    ['Haval H6', 'Haval Jolion', 'ORA 03', 'Poer', 'Wingle 5', 'Wingle 6', 'Wingle 7'],
    'MG':            ['HS', 'MG 3', 'MG 5', 'MG 6', 'MG ZS', 'RX5', 'ZS EV'],
    'BYD':           ['Atto 3', 'Dolphin', 'F3', 'Han', 'King', 'Plus', 'Seal', 'Song Plus', 'Tan'],
    'Isuzu':         ['D-Max', 'ELF 150', 'ELF 250', 'ELF 300', 'FRR', 'FTR', 'MU-X', 'NKR', 'NLR', 'NPR'],
    'Hino':          ['300 Series', '500 Series', '700 Series', 'Dutro', 'Ranger'],
    'Volvo':         ['S60', 'S90', 'V60', 'XC40', 'XC60', 'XC90'],
    'Land Rover':    ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
    'Geely':         ['Azkarra', 'Coolray', 'Emgrand', 'GX3 Pro', 'Okavango', 'Tugella'],
    'Changan':       ['CS15', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'Hunter', 'Oshan X5', 'Uni-K', 'Uni-T'],
    'GAC':           ['Empow', 'GN8', 'GS3', 'GS4', 'GS5', 'GS8', 'M6'],
  };

  // ── Catálogos ────────────────────────────────────────────────────────────────
  servicios:        Servicio[] = [];
  tecnicos:         Tecnico[]  = [];
  productos:        Producto[] = [];
  cargandoCatalogos = false;

  // ── Modal de repuestos del servicio ───────────────────────────────────────
  showRepuestosModal = false;
  servicioSeleccionado: Servicio | null = null;
  repuestosModal: RepuestoServicio[] = [];
  cargandoProductos = false;

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
    this.http.get<any[]>(`${API_BASE_URL}/api/configuracion/servicios`).subscribe({
      next: (r) => {
        console.log('Servicios cargados:', r);
        this.servicios = (r || []).map((s: any) => ({
          id_servicio: s.id_servicio,
          nombre: s.nombre,
          estado: s.estado,
          precio: s.precio || 0,
          repuestos: s.repuestos || [],
        }));
        this.cargandoCatalogos = false;
      },
      error: (e) => {
        console.error('Error cargando servicios:', e);
        this.cargandoCatalogos = false;
      },
    });
    this.http.get<Tecnico[]>(`${this.URL}/tecnicos`).subscribe({
      next: (r) => { this.tecnicos = r || []; },
    });
    this.cargarProductos();
  }

  cargarProductos() {
    this.cargandoProductos = true;
    this.http.get<any[]>(`${API_BASE_URL}/api/productos/listar-repuestos`).subscribe({
      next: (r) => {
        console.log('Productos cargados:', r);
        this.productos = (r || []).map((p: any) => ({
          nombre: p.nombre_repuesto || p.nombre,
          precio_venta: p.precio_venta || 0,
        }));
        this.cargandoProductos = false;
      },
      error: (e) => {
        console.error('Error cargando productos:', e);
        this.cargandoProductos = false;
      },
    });
  }

  // ── BUSCAR CLIENTE POR DNI ──────────────────────────────────────────────────

  onDniInput() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    this.dniBuscado = false;
    this.clienteEncontrado = false;

    if (dni.length < 8) {
      this.cliente = this.clienteVacioFactory();
      this.clientVehicles = [];
      this.vehiculoSeleccionado = null;
      this.descripcionVehiculo = '';
      return;
    }

    this.dniBuscado = true;
    this.buscandoCliente = true;
    this.http.get<any>(`${this.URL}/buscar-cliente/${dni}`).subscribe({
      next: (res) => {
        this.buscandoCliente   = false;
        this.clienteEncontrado = true;
        this.cliente = {
          dni:              res.dni,
          nombre:           res.nombre,
          apellido_paterno: res.apellido_paterno,
          apellido_materno: res.apellido_materno,
          celular:          res.celular,
          correo:           res.correo,
        };
        this.clientVehicles = (res.carros || []) as Vehiculo[];
        this.vehiculoSeleccionado = null;
        this.descripcionVehiculo = '';
        this.cdr.detectChanges();
        setTimeout(() => this.openVehicleModal(), 300);
      },
      error: () => {
        this.buscandoCliente   = false;
        this.clienteEncontrado = false;
        this.cliente = this.clienteVacioFactory();
        this.clientVehicles = [];
        this.vehiculoSeleccionado = null;
        this.descripcionVehiculo = '';
        this.cdr.detectChanges();
        this.mostrarOpcionRegistro(dni);
      },
    });
  }

  mostrarOpcionRegistro(dni: string) {
    Swal.fire({
      title: 'Cliente no encontrado',
      html: `El DNI <b>${dni}</b> no está registrado.<br>¿Desea registrar un nuevo cliente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        this.iniciarRegistroCliente(dni);
      } else {
        this.dniBusqueda = '';
        this.dniBuscado = false;
      }
    });
  }

  iniciarRegistroCliente(dni: string) {
    this.registroCliente = {
      dni: dni,
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      celular: '',
      correo: '',
      estado: 'Activo',
    };
    this.registroVehiculos = [];
    this.dniValidadoRegistro = false;
    this.consultandoDniRegistro = true;

    this.http.get<any>(`${this.URL_CLIENTES}/buscar-dni/${dni}`).subscribe({
      next: (data) => {
        this.consultandoDniRegistro = false;
        if (data?.success) {
          this.registroCliente.nombre = data.nombres || '';
          this.registroCliente.apellido_paterno = data.apellidoPaterno || '';
          this.registroCliente.apellido_materno = data.apellidoMaterno || '';
          this.dniValidadoRegistro = true;
        }
        this.showRegistroModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.consultandoDniRegistro = false;
        this.showRegistroModal = true;
        this.cdr.detectChanges();
      },
    });
  }

  cerrarRegistroModal() {
    this.showRegistroModal = false;
    this.registroCliente = null;
    this.registroVehiculos = [];
    this.dniValidadoRegistro = false;
    this.limpiarRegVehiculo();
    if (!this.clienteEncontrado) {
      this.dniBusqueda = '';
      this.dniBuscado = false;
    }
  }

  validarCelularRegistro() {
    this.errorCelularRegistro = this.registroCliente?.celular && !/^9\d{8}$/.test(this.registroCliente.celular);
  }

  // ── Registro: Marca/Modelo autocomplete ──────────────────────────────────

  get regMarcas(): string[] {
    return Object.keys(this.catalogoMarcas).sort();
  }

  get regMarcasSugeridas(): string[] {
    const texto = this.regMarcaTexto.trim().toLowerCase();
    if (!texto) return this.regMarcas;
    return this.regMarcas.filter(m => m.toLowerCase().includes(texto));
  }

  get regModelosFiltrados(): string[] {
    return this.regVehiculo.marca
      ? (this.catalogoMarcas[this.regVehiculo.marca] ?? []).sort()
      : [];
  }

  get regModelosSugeridos(): string[] {
    const texto = this.regModeloTexto.trim().toLowerCase();
    if (!texto) return this.regModelosFiltrados;
    return this.regModelosFiltrados.filter(m => m.toLowerCase().includes(texto));
  }

  regOnMarcaInput() {
    this.regMostrarSugerenciasMarca = true;
    const coincideExacto = this.regMarcas.find(
      m => m.toLowerCase() === this.regMarcaTexto.trim().toLowerCase()
    );
    if (coincideExacto) {
      this.regVehiculo.marca = coincideExacto;
    } else {
      this.regVehiculo.marca = '';
    }
    this.regVehiculo.modelo = '';
    this.regModeloTexto = '';
    this.regVehiculo.anio = '';
  }

  regSeleccionarMarca(m: string) {
    this.regMarcaTexto = m;
    this.regVehiculo.marca = m;
    this.regMostrarSugerenciasMarca = false;
    this.regVehiculo.modelo = '';
    this.regModeloTexto = '';
    this.regVehiculo.anio = '';
  }

  regOcultarSugerenciasMarca() {
    setTimeout(() => {
      this.regMostrarSugerenciasMarca = false;
      if (!this.regVehiculo.marca) this.regMarcaTexto = '';
    }, 150);
  }

  regOnModeloInput() {
    if (!this.regVehiculo.marca) return;
    this.regMostrarSugerenciasModelo = true;
    const coincideExacto = this.regModelosFiltrados.find(
      m => m.toLowerCase() === this.regModeloTexto.trim().toLowerCase()
    );
    if (coincideExacto) {
      this.regVehiculo.modelo = coincideExacto;
    } else {
      this.regVehiculo.modelo = '';
    }
    this.regVehiculo.anio = '';
  }

  regSeleccionarModelo(m: string) {
    this.regModeloTexto = m;
    this.regVehiculo.modelo = m;
    this.regMostrarSugerenciasModelo = false;
    this.regVehiculo.anio = '';
  }

  regOcultarSugerenciasModelo() {
    setTimeout(() => {
      this.regMostrarSugerenciasModelo = false;
      if (!this.regVehiculo.modelo) this.regModeloTexto = '';
    }, 150);
  }

  regFormatearPlaca() {
    let v = this.regVehiculo.placa.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!v.includes('-')) {
      if (/^[A-Z]{2}\d/.test(v) && v.length > 2) {
        v = v.slice(0, 2) + '-' + v.slice(2, 6);
      } else if (v.length > 3) {
        v = v.slice(0, 3) + '-' + v.slice(3, 6);
      }
    }
    const partes = v.split('-');
    if (partes.length === 2) {
      v = partes[0].slice(0, 3) + '-' + partes[1].slice(0, 4);
    }
    this.regVehiculo.placa = v;
    const mayorValido = /^[A-Z0-9]{3}-\d{3}$/.test(v);
    const menorValido = /^[A-Z]{2}-\d{4}$/.test(v);
    const limpio = v.replace('-', '');
    this.regErrorPlaca = limpio.length >= 4 && !mayorValido && !menorValido;

    if (mayorValido || menorValido) {
      this.verificarPlacaRegistro(v);
    } else {
      this.regErrorPlacaDuplicada = false;
      this.regErrorPlacaDuplicadaMensaje = '';
    }
  }

  private verificarPlacaRegistro(placa: string) {
    this.regErrorPlacaDuplicada = false;
    this.regErrorPlacaDuplicadaMensaje = '';

    const duplicadoLocal = this.registroVehiculos.some(v => v.placa === placa);
    if (duplicadoLocal) {
      this.regErrorPlacaDuplicada = true;
      this.regErrorPlacaDuplicadaMensaje = 'Ya agregaste un vehículo con esa placa.';
      return;
    }

    this.http.get<any>(`${this.URL_CLIENTES}/verificar-placa/${placa}`).subscribe({
      next: (res) => {
        if (res?.existe) {
          this.regErrorPlacaDuplicada = true;
          this.regErrorPlacaDuplicadaMensaje = `La placa pertenece a ${res.cliente} (DNI: ${res.dni}).`;
        }
      },
    });
  }

  regAgregarVehiculo() {
    if (!this.regVehiculo.placa || !this.regVehiculo.marca || !this.regVehiculo.modelo || !this.regVehiculo.anio) return;

    const yaExiste = this.registroVehiculos.some(v => v.placa === this.regVehiculo.placa);
    if (yaExiste) {
      this.regErrorPlacaDuplicada = true;
      this.regErrorPlacaDuplicadaMensaje = 'Ya agregaste un vehículo con esa placa.';
      return;
    }

    if (this.regErrorPlaca || this.regErrorPlacaDuplicada) return;

    this.registroVehiculos.push({ ...this.regVehiculo });
    this.limpiarRegVehiculo();
  }

  regEliminarVehiculo(idx: number) {
    this.registroVehiculos.splice(idx, 1);
  }

  private limpiarRegVehiculo() {
    this.regVehiculo = this.regVehiculoVacioFactory();
    this.regMarcaTexto = '';
    this.regModeloTexto = '';
    this.regErrorPlaca = false;
    this.regErrorPlacaDuplicada = false;
    this.regErrorPlacaDuplicadaMensaje = '';
  }

  guardarNuevoClienteDesdeMantenimiento() {
    const c = this.registroCliente;
    if (!c?.nombre?.trim() || !c?.apellido_paterno?.trim() || !c?.celular?.trim()) {
      Swal.fire('Datos incompletos', 'Nombre, apellido paterno y celular son obligatorios.', 'warning');
      return;
    }
    if (c.celular && !/^9\d{8}$/.test(c.celular)) {
      Swal.fire('Celular inválido', 'Debe comenzar con 9 y tener 9 dígitos.', 'warning');
      return;
    }

    const payload = {
      cliente: {
        dni: c.dni,
        nombre: c.nombre.trim(),
        apellido_paterno: c.apellido_paterno.trim(),
        apellido_materno: (c.apellido_materno || '').trim(),
        celular: c.celular.trim(),
        correo: (c.correo || '').trim(),
        estado: 'Activo',
        usuario_logueado: this.tecnicoLogueado.codigo || this.tecnicoLogueado.nombre,
      },
      carros: this.registroVehiculos.map((v: any) => ({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anio: String(v.anio),
      })),
    };

    this.consultandoDniRegistro = true;
    this.http.post<any>(`${this.URL_CLIENTES}/registrar`, payload).subscribe({
      next: (res) => {
        this.consultandoDniRegistro = false;
        if (res?.status === 'registrado') {
          Swal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1500, showConfirmButton: false });
          this.clienteEncontrado = true;
          this.cliente = {
            dni: c.dni,
            nombre: c.nombre.trim(),
            apellido_paterno: (c.apellido_paterno || '').trim(),
            apellido_materno: (c.apellido_materno || '').trim(),
            celular: c.celular.trim(),
            correo: (c.correo || '').trim(),
          };
          this.clientVehicles = this.registroVehiculos.map(v => ({ ...v }));
          this.showRegistroModal = false;
          this.cdr.detectChanges();
          setTimeout(() => this.openVehicleModal(), 400);
        } else {
          Swal.fire('Error', res?.status || 'No se pudo registrar el cliente.', 'error');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.consultandoDniRegistro = false;
        const msg = err.error?.status || err.error || 'No se pudo registrar el cliente.';
        Swal.fire('Error', msg, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  // ── MODAL VEHÍCULOS ─────────────────────────────────────────────────────────

  openVehicleModal() {
    this.mostrandoFormVehiculo = false;
    this.showVehicleModal = true;
  }

  cerrarModalVehiculo() {
    this.showVehicleModal = false;
    this.mostrandoFormVehiculo = false;
    this.limpiarFormVehiculo();
  }

  cerrarFormVehiculo() {
    this.mostrandoFormVehiculo = false;
    this.limpiarFormVehiculo();
  }

  seleccionarVehiculo(v: Vehiculo) {
    this.vehiculoSeleccionado = v;
    this.descripcionVehiculo = `${v.marca} ${v.modelo} - ${v.placa}`;
    this.showVehicleModal = false;
  }

  // ── AUTOCOMPLETE Marca / Modelo ─────────────────────────────────────────────

  get marcas(): string[] {
    return Object.keys(this.catalogoMarcas).sort();
  }

  get marcasSugeridas(): string[] {
    const texto = this.marcaTexto.trim().toLowerCase();
    if (!texto) return this.marcas;
    return this.marcas.filter(m => m.toLowerCase().includes(texto));
  }

  get modelosFiltrados(): string[] {
    return this.nuevoVehiculo.marca
      ? (this.catalogoMarcas[this.nuevoVehiculo.marca] ?? []).sort()
      : [];
  }

  get modelosSugeridos(): string[] {
    const texto = this.modeloTexto.trim().toLowerCase();
    if (!texto) return this.modelosFiltrados;
    return this.modelosFiltrados.filter(m => m.toLowerCase().includes(texto));
  }

  get anios(): number[] {
    const actual = new Date().getFullYear();
    const lista: number[] = [];
    for (let a = actual; a >= 1990; a--) lista.push(a);
    return lista;
  }

  onMarcaInput() {
    this.mostrarSugerenciasMarca = true;
    const coincideExacto = this.marcas.find(
      m => m.toLowerCase() === this.marcaTexto.trim().toLowerCase()
    );
    if (coincideExacto) {
      this.nuevoVehiculo.marca = coincideExacto;
    } else {
      this.nuevoVehiculo.marca = '';
    }
    this.nuevoVehiculo.modelo = '';
    this.modeloTexto = '';
    this.nuevoVehiculo.anio = '';
  }

  seleccionarMarca(m: string) {
    this.marcaTexto = m;
    this.nuevoVehiculo.marca = m;
    this.mostrarSugerenciasMarca = false;
    this.nuevoVehiculo.modelo = '';
    this.modeloTexto = '';
    this.nuevoVehiculo.anio = '';
  }

  ocultarSugerenciasMarca() {
    setTimeout(() => {
      this.mostrarSugerenciasMarca = false;
      if (!this.nuevoVehiculo.marca) this.marcaTexto = '';
    }, 150);
  }

  onModeloInput() {
    if (!this.nuevoVehiculo.marca) return;
    this.mostrarSugerenciasModelo = true;
    const coincideExacto = this.modelosFiltrados.find(
      m => m.toLowerCase() === this.modeloTexto.trim().toLowerCase()
    );
    if (coincideExacto) {
      this.nuevoVehiculo.modelo = coincideExacto;
    } else {
      this.nuevoVehiculo.modelo = '';
    }
    this.nuevoVehiculo.anio = '';
  }

  seleccionarModelo(m: string) {
    this.modeloTexto = m;
    this.nuevoVehiculo.modelo = m;
    this.mostrarSugerenciasModelo = false;
    this.nuevoVehiculo.anio = '';
  }

  ocultarSugerenciasModelo() {
    setTimeout(() => {
      this.mostrarSugerenciasModelo = false;
      if (!this.nuevoVehiculo.modelo) this.modeloTexto = '';
    }, 150);
  }

  formatearPlaca() {
    let v = this.nuevoVehiculo.placa.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!v.includes('-')) {
      if (/^[A-Z]{2}\d/.test(v) && v.length > 2) {
        v = v.slice(0, 2) + '-' + v.slice(2, 6);
      } else if (v.length > 3) {
        v = v.slice(0, 3) + '-' + v.slice(3, 6);
      }
    }
    const partes = v.split('-');
    if (partes.length === 2) {
      v = partes[0].slice(0, 3) + '-' + partes[1].slice(0, 4);
    }
    this.nuevoVehiculo.placa = v;
    const mayorValido = /^[A-Z0-9]{3}-\d{3}$/.test(v);
    const menorValido = /^[A-Z]{2}-\d{4}$/.test(v);
    const limpio = v.replace('-', '');
    this.errorPlaca = limpio.length >= 4 && !mayorValido && !menorValido;
    this.errorPlacaDuplicada = (mayorValido || menorValido) &&
      this.clientVehicles.some(veh => veh.placa === v);
  }

  agregarYSeleccionarVehiculo() {
    if (!this.nuevoVehiculo.placa || !this.nuevoVehiculo.marca || !this.nuevoVehiculo.modelo || !this.nuevoVehiculo.anio) return;

    const yaExiste = this.clientVehicles.some(v => v.placa === this.nuevoVehiculo.placa);
    if (yaExiste) {
      this.errorPlacaDuplicada = true;
      Swal.fire('Placa duplicada', 'Este cliente ya tiene un vehículo con esa placa.', 'warning');
      return;
    }

    const nuevo = { ...this.nuevoVehiculo };
    this.clientVehicles.push(nuevo);
    this.vehiculoSeleccionado = nuevo;
    this.descripcionVehiculo = `${nuevo.marca} ${nuevo.modelo} - ${nuevo.placa}`;
    this.limpiarFormVehiculo();
    this.mostrandoFormVehiculo = false;
    this.showVehicleModal = false;
  }

  private limpiarFormVehiculo() {
    this.nuevoVehiculo = this.vehiculoVacioFactory();
    this.marcaTexto = '';
    this.modeloTexto = '';
    this.errorPlaca = false;
    this.errorPlacaDuplicada = false;
  }

  private vehiculoVacioFactory(): Vehiculo {
    return { placa: '', marca: '', modelo: '', anio: '' };
  }

  private regVehiculoVacioFactory(): any {
    return { placa: '', marca: '', modelo: '', anio: '' };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private clienteVacioFactory(): Cliente {
    return { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
  }

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
    this.servicioSeleccionado = serv;
    this.abrirModalRepuestos(serv);
  }

  abrirModalRepuestos(serv: Servicio) {
    this.repuestosModal = (serv.repuestos || []).map(r => {
      const producto = this.productos.find(p => p.nombre === r.nombre_repuesto);
      return {
        nombre_repuesto: r.nombre_repuesto,
        cantidad: r.cantidad,
        cantidad_usar: r.cantidad,
        precio_unitario: producto?.precio_venta || 0,
        subtotal: (producto?.precio_venta || 0) * r.cantidad,
      };
    });
    this.showRepuestosModal = true;
  }

  cerrarModalRepuestos() {
    this.showRepuestosModal = false;
    this.servicioSeleccionado = null;
    this.repuestosModal = [];
  }

  actualizarCantidadRepuesto(repuesto: RepuestoServicio, cantidad: number) {
    repuesto.cantidad_usar = cantidad;
    repuesto.subtotal = repuesto.precio_unitario * cantidad;
  }

  confirmarRepuestos(item: ItemServicio) {
    if (!this.servicioSeleccionado) return;
    item.servicio = this.servicioSeleccionado;
    item.precio_subtotal = (this.servicioSeleccionado.precio || 0) * item.cantidad;
    item.busqueda = '';
    item.resultados = [];
    item.mostrarDropdown = false;
    item.repuestos = this.repuestosModal.map(r => ({
      nombre_repuesto: r.nombre_repuesto,
      cantidad: r.cantidad,
      cantidad_usar: r.cantidad_usar,
      precio_unitario: r.precio_unitario,
      subtotal: r.subtotal,
    }));
    this.cerrarModalRepuestos();
  }

  getTotalRepuestos(): number {
    return this.repuestosModal.reduce((total, rep) => total + rep.subtotal, 0);
  }

  limpiarServicio(item: ItemServicio) {
    item.servicio        = { id_servicio: 0, nombre: '', estado: '', precio: 0, repuestos: [] };
    item.busqueda        = '';
    item.resultados      = [];
    item.mostrarDropdown = false;
    item.precio_subtotal = 0;
    item.repuestos       = [];
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  agregarItem() {
    this.items.push({
      servicio:        { id_servicio: 0, nombre: '', estado: '', precio: 0, repuestos: [] },
      id_trabajador:   0,
      cantidad:        1,
      precio_subtotal: 0,
      busqueda:        '',
      resultados:      [],
      mostrarDropdown: false,
      repuestos:      [],
    });
  }

  eliminarItem(idx: number) {
    this.items.splice(idx, 1);
  }

  recalcularSubtotal(item: ItemServicio) {
    item.precio_subtotal = (item.servicio.precio || 0) * item.cantidad;
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
    return this.clienteEncontrado && !!this.descripcionVehiculo.trim() && this.itemsValidos();
  }

  // ── Registrar ────────────────────────────────────────────────────────────────

  confirmarMantenimiento() {
    if (!this.formularioValido()) {
      Swal.fire('Datos incompletos', 'Seleccione un cliente con DNI, un vehículo y al menos un servicio con técnico asignado.', 'warning');
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
        repuestos:       it.repuestos,
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
    this.dniBusqueda         = '';
    this.clienteEncontrado   = false;
    this.dniBuscado          = false;
    this.clientVehicles      = [];
    this.vehiculoSeleccionado = null;
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

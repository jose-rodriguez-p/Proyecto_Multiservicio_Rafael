import { API_BASE_URL } from '@config';
import { Component, OnInit, HostListener, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  selector: 'app-crear-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-venta.html',
  styleUrl: './crear-venta.css',
})
export class CrearVenta implements OnInit {
  private http       = inject(HttpClient);
  private router     = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);

  private URL_VENTAS   = `${API_BASE_URL}/api/ventas`;
  private URL_CLIENTES = `${API_BASE_URL}/api/clientes`;
  private URL_PRODUCTOS = `${API_BASE_URL}/api/productos`;

  tipoComprobante = 'Boleta';
  serie           = 'B001';
  estado          = 'Pagado';
  metodoPago      = 'Efectivo';
  fechaEmision: string = new Date().toISOString().split('T')[0];
  vendedor = { nombre: '', cargo: '', codigo: '' };
  nota     = '';
  guardando = false;

  readonly metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin'];

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
  clienteEditableNombres = false;
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
  nuevoClienteDniValidado = false;
  nuevoClientePermiteEditar = false;
  consultandoDniNuevo = false;
  nuevoClienteCorreoValidado = false;
  validandoCorreoNuevo = false;

  items: ItemDetalle[] = [];
  repuestos: Repuesto[] = [];
  cargandoRepuestos = false;
  descuentoGlobal = 0;
  descuentoTipo: '%' | 'S/' = '%';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarVendedor();
      this.cargarRepuestos();
      this.agregarItem();
    }
  }

  cargarVendedor() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.vendedor = {
        nombre: user.trabajadorCompleto || user.username || 'Sin nombre',
        cargo:  user.rolNombre || '',
        codigo: user.username || '',
      };
    } catch { this.vendedor = { nombre: 'Sin nombre', cargo: '', codigo: '' }; }
  }

  onTipoChange() { this.serie = this.tipoComprobante === 'Boleta' ? 'B001' : 'F001'; }

  volver() { this.router.navigate(['/sistema/servicio/ventas']); }

  abrirPanelCliente(modo: ModoPanel = 'buscar') {
    this.modoPanel = modo;
    this.mostrarPanelCliente = true;
    this.dniBusqueda = this.cliente.dni === '00000000' ? '' : this.cliente.dni;
    this.clienteEncontrado = false;
    this.clienteEditableNombres = false;
    if (modo === 'lista') this.cargarListaClientes();
  }

  cerrarPanelCliente() {
    this.mostrarPanelCliente = false;
    this.dniBusqueda = '';
    this.clienteEncontrado = false;
    this.clienteEditableNombres = false;
    this.buscandoCliente = false;
    this.filtroBusquedaLista = '';
    this.nuevoCliente = this.clienteVacioFactory();
    this.resetErroresNuevoCliente();
    this.nuevoClienteDniValidado = false;
    this.nuevoClientePermiteEditar = false;
    this.consultandoDniNuevo = false;
    this.nuevoClienteCorreoValidado = false;
    this.validandoCorreoNuevo = false;
  }

  cambiarModo(modo: ModoPanel) {
    this.modoPanel = modo;
    if (modo === 'lista') this.cargarListaClientes();
    if (modo === 'nuevo') {
      this.nuevoCliente = this.clienteVacioFactory();
      if (this.dniBusqueda.length === 8) this.nuevoCliente.dni = this.dniBusqueda;
      this.resetErroresNuevoCliente();
      this.nuevoClienteDniValidado = false;
      this.nuevoClientePermiteEditar = false;
      this.consultandoDniNuevo = false;
      this.nuevoClienteCorreoValidado = false;
      this.validandoCorreoNuevo = false;
    }
  }

  buscarClientePorDni() {
    const dni = this.dniBusqueda.replace(/\D/g, '');
    this.dniBusqueda = dni;
    if (dni.length < 8) { 
      this.clienteEncontrado = false; 
      this.clienteEditableNombres = false;
      this.buscandoCliente = false;
      return; 
    }
    this.buscandoCliente = true;
    
    // First check if client exists in DB (using listaClientes if already loaded)
    const clienteEnDB = this.listaClientes.find(c => c.dni === dni);
    if (clienteEnDB) {
      this.buscandoCliente = false;
      this.clienteEncontrado = true;
      this.clienteEditableNombres = false;
      this.cliente = { 
        id_cliente: clienteEnDB.id_cliente, 
        dni: clienteEnDB.dni, 
        nombre: clienteEnDB.nombre,
        apellido_paterno: clienteEnDB.apellido_paterno, 
        apellido_materno: clienteEnDB.apellido_materno,
        celular: clienteEnDB.celular, 
        correo: clienteEnDB.correo 
      };
      this.cdr.detectChanges();
      return;
    }

    // If not in DB, try RENIEC lookup
    this.http.get<any>(`${this.URL_CLIENTES}/buscar-dni/${dni}`).subscribe({
      next: (data) => {
        this.buscandoCliente = false;
        if (data?.success) {
          this.clienteEncontrado = false; // Not in DB, but we have RENIEC data
          this.clienteEditableNombres = false;
          this.cliente = { 
            dni, 
            nombre: data.nombres || '', 
            apellido_paterno: data.apellidoPaterno || '', 
            apellido_materno: data.apellidoMaterno || '', 
            celular: '', 
            correo: '' 
          };
        } else { 
          // RENIEC not found, allow manual entry
          this.clienteEncontrado = false;
          this.clienteEditableNombres = true;
          this.cliente = { dni, nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
          Swal.fire('Atención', 'No encontrado en RENIEC. Puede ingresar los datos manualmente.', 'info'); 
        }
        this.cdr.detectChanges();
      },
      error: (err) => { 
        this.buscandoCliente = false; 
        if (err.status === 409) {
          // Client exists in DB, let's load listaClientes to find it!
          this.cargarListaClientes();
          this.clienteEditableNombres = false;
        } else {
          // RENIEC API down, allow manual entry
          this.clienteEncontrado = false;
          this.clienteEditableNombres = true;
          this.cliente = { dni, nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
          Swal.fire('Error de API', 'No se pudo conectar con RENIEC. Puede ingresar los datos manualmente.', 'warning');
        }
        this.cdr.detectChanges();
      }
    });
  }

  confirmarCliente() {
    if (!this.cliente.nombre.trim()) { Swal.fire('Datos incompletos', 'El nombre del cliente es requerido.', 'warning'); return; }
    this.cerrarPanelCliente();
  }

  usarClienteVarios() { this.cliente = { ...this.clienteVarios }; this.cerrarPanelCliente(); }

  cargarListaClientes() {
    this.cargandoLista = true;
    this.http.get<any[]>(`${this.URL_CLIENTES}/listar`).subscribe({
      next: (data) => { 
        this.listaClientes = data || []; 
        this.aplicarFiltroLista(); 
        this.cargandoLista = false; 
        // Check if we were searching for a DNI that exists in the DB
        if (this.dniBusqueda.length === 8 && !this.clienteEncontrado) {
          const clienteEnDB = this.listaClientes.find(c => c.dni === this.dniBusqueda);
          if (clienteEnDB) {
            this.clienteEncontrado = true;
            this.clienteEditableNombres = false;
            this.cliente = { 
              id_cliente: clienteEnDB.id_cliente, 
              dni: clienteEnDB.dni, 
              nombre: clienteEnDB.nombre,
              apellido_paterno: clienteEnDB.apellido_paterno, 
              apellido_materno: clienteEnDB.apellido_materno,
              celular: clienteEnDB.celular, 
              correo: clienteEnDB.correo 
            };
            this.cdr.detectChanges();
          }
        }
      },
      error: () => { this.cargandoLista = false; },
    });
  }

  aplicarFiltroLista() {
    const q = this.filtroBusquedaLista.toLowerCase().trim();
    this.listaClientesFiltrada = !q ? [...this.listaClientes]
      : this.listaClientes.filter(c => {
          return (c.dni||'').toLowerCase().includes(q) ||
                 (c.nombre||'').toLowerCase().includes(q) ||
                 (c.apellido_paterno||'').toLowerCase().includes(q) ||
                 (c.celular||'').toLowerCase().includes(q);
        });
  }

  seleccionarDeListaClientes(c: any) {
    this.cliente = { id_cliente: c.id_cliente, dni: c.dni||'', nombre: c.nombre||'',
      apellido_paterno: c.apellido_paterno||'', apellido_materno: c.apellido_materno||'',
      celular: c.celular||'', correo: c.correo||'' };
    this.cerrarPanelCliente();
  }

  private clienteVacioFactory(): Cliente {
    return { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '' };
  }

  private resetErroresNuevoCliente() {
    this.errorDniNuevo = this.errorNombreNuevo = this.errorApPaternoNuevo =
    this.errorCelularNuevo = this.errorCorreoNuevo = false;
  }

  validarDniNuevo() {
    const dni = this.nuevoCliente.dni.replace(/\D/g, '');
    this.nuevoCliente.dni = dni;
    this.errorDniNuevo = !/^\d{8}$/.test(dni.trim());
  }

  buscarDniNuevo() {
    this.validarDniNuevo();
    if (this.errorDniNuevo) { return; }
    
    // First check if DNI is already in listaClientes
    if (this.listaClientes.length === 0) {
      // Load listaClientes if not already loaded
      this.cargarListaClientes();
    }
    const clienteExistente = this.listaClientes.find(c => c.dni === this.nuevoCliente.dni);
    if (clienteExistente) {
      Swal.fire('Error', 'El DNI ya está registrado en el sistema.', 'error');
      return;
    }

    this.consultandoDniNuevo = true;
    this.http.get<any>(`${this.URL_CLIENTES}/buscar-dni/${this.nuevoCliente.dni}`).subscribe({
      next: (data) => {
        this.consultandoDniNuevo = false;
        if (data?.success) {
          this.nuevoCliente.nombre = data.nombres || '';
          this.nuevoCliente.apellido_paterno = data.apellidoPaterno || '';
          this.nuevoCliente.apellido_materno = data.apellidoMaterno || '';
          this.nuevoClienteDniValidado = true;
          this.nuevoClientePermiteEditar = false;
        } else { 
          this.nuevoClienteDniValidado = false;
          this.nuevoClientePermiteEditar = true;
          Swal.fire('Atención', 'No encontrado en RENIEC. Puede ingresar los datos manualmente.', 'info'); 
        }
        this.cdr.detectChanges();
      },
      error: (err) => { 
        this.consultandoDniNuevo = false; 
        if (err.status === 409) {
          Swal.fire('Error', 'El DNI ya está registrado en el sistema.', 'error');
        } else {
          this.nuevoClienteDniValidado = false;
          this.nuevoClientePermiteEditar = true;
          Swal.fire('Error de API', 'No se pudo conectar con RENIEC. Puede ingresar los datos manualmente.', 'warning');
        }
        this.cdr.detectChanges();
      }
    });
  }

  get esCorreoValidoNuevo(): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo); }

  validarCorreoBackendNuevo() {
    // If in manual edit mode, no code required
    if (this.nuevoClientePermiteEditar) {
      this.nuevoClienteCorreoValidado = true;
      return;
    }
    
    if (!this.esCorreoValidoNuevo) return;
    this.validandoCorreoNuevo = true;
    this.http.post(`${this.URL_CLIENTES}/correo/enviar`, { correo: this.nuevoCliente.correo, dni: this.nuevoCliente.dni }, { responseType: 'text' }).subscribe({
      next: () => { 
        this.validandoCorreoNuevo = false; 
        this.cdr.detectChanges();
        this.mostrarPromptCodigoNuevo(); 
      },
      error: () => { 
        this.validandoCorreoNuevo = false; 
        this.cdr.detectChanges();
        Swal.fire('Error', 'No se pudo enviar código', 'error'); 
      }
    });
  }

  private mostrarPromptCodigoNuevo() {
    Swal.fire({
      title: 'Validar Correo',
      input: 'text',
      inputAttributes: { maxlength: '6' },
      showCancelButton: true,
      confirmButtonText: 'Validar',
      inputValidator: (value) => {
        if (!value || value.length !== 6) {
          return 'El código debe tener 6 dígitos';
        }
        return null;
      }
    }).then((r) => {
      if (r.isConfirmed && r.value) this.verificarCodigoNuevo(r.value);
    });
  }

  private verificarCodigoNuevo(codigo: string) {
    this.http.post(`${this.URL_CLIENTES}/correo/validar`, { dni: this.nuevoCliente.dni, codigo }, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'CODIGO_VALIDO') {
          this.nuevoClienteCorreoValidado = true;
          Swal.fire('Correcto', 'Correo verificado', 'success');
        } else {
          Swal.fire({
            title: 'Código incorrecto',
            text: 'El código ingresado no es válido. Por favor, intenta nuevamente.',
            icon: 'error',
            confirmButtonText: 'Reintentar'
          }).then(() => {
            this.mostrarPromptCodigoNuevo();
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al validar el código. Por favor, intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Reintentar'
        }).then(() => {
          this.mostrarPromptCodigoNuevo();
        });
      }
    });
  }

  validarNombreNuevo()    { this.errorNombreNuevo    = !this.nuevoCliente.nombre.trim() || this.nuevoCliente.nombre.trim().length < 2; }
  validarApPaternoNuevo() { this.errorApPaternoNuevo = !this.nuevoCliente.apellido_paterno.trim(); }
  validarCelularNuevo()   { this.errorCelularNuevo   = !/^9\d{8}$/.test(this.nuevoCliente.celular.trim()); }
  validarCorreoNuevo()    { this.errorCorreoNuevo    = !!this.nuevoCliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo.trim()); }

  get puedeGuardarNuevoCliente(): boolean {
    if (this.nuevoClientePermiteEditar) {
      return !!(
        this.nuevoCliente.dni?.trim() &&
        this.nuevoCliente.nombre?.trim() &&
        this.nuevoCliente.apellido_paterno?.trim() &&
        this.nuevoCliente.celular?.trim() &&
        !this.errorCelularNuevo &&
        !this.errorCorreoNuevo
      );
    }
    return this.nuevoClienteDniValidado && this.nuevoClienteCorreoValidado;
  }

  nuevoClienteValido(): boolean {
    return this.puedeGuardarNuevoCliente;
  }

  guardarNuevoCliente() {
    this.validarDniNuevo(); this.validarNombreNuevo(); this.validarApPaternoNuevo();
    this.validarCelularNuevo(); this.validarCorreoNuevo();
    if (!this.puedeGuardarNuevoCliente) { Swal.fire('Datos incompletos', 'Corrige los campos marcados.', 'warning'); return; }
    this.guardandoCliente = true;
    const payload = {
      cliente: {
        dni: this.nuevoCliente.dni,
        nombre: this.nuevoCliente.nombre,
        apellido_paterno: this.nuevoCliente.apellido_paterno,
        apellido_materno: this.nuevoCliente.apellido_materno,
        celular: this.nuevoCliente.celular,
        correo: this.nuevoCliente.correo,
        estado: 'Activo',
        usuario_logueado: this.obtenerUsuarioLogueado()
      },
      vehiculos: []
    };
    this.http.post(`${this.URL_CLIENTES}/registrar`, payload, { responseType: 'text' }).subscribe({
      next: (res) => {
        this.guardandoCliente = false; 
        this.listaClientes = []; 
        this.cliente = { ...this.nuevoCliente };
        Swal.fire({ icon: 'success', title: 'Cliente registrado', timer: 1500, showConfirmButton: false });
        this.cerrarPanelCliente();
      },
      error: (err) => { this.guardandoCliente = false; Swal.fire('Error', err?.error || 'No se pudo registrar.', 'error'); },
    });
  }

  obtenerUsuarioLogueado(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.username || '';
    } catch { return ''; }
  }

  get nombreCompletoCliente(): string {
    if (this.cliente.dni === '00000000') return 'Cliente Varios';
    return [this.cliente.nombre, this.cliente.apellido_paterno, this.cliente.apellido_materno]
      .filter(Boolean).join(' ') || 'Sin nombre';
  }

  cargarRepuestos() {
    this.cargandoRepuestos = true;
    this.http.get<any[]>(`${this.URL_PRODUCTOS}/listar-repuestos`).subscribe({ // Changed to /listar-repuestos!
      next: (data) => {
        this.repuestos = (data || []).map(p => ({
          id_repuesto: 0,
          codigo: p.nombre_repuesto || '',
          nombre: p.nombre_repuesto || '',
          marca: p.nombre_marca || '',
          categoria: p.nombre_categoria || '',
          stock: p.cantidad || 0,
          stock_minimo: p.stock_minimo || 5,
          precio_venta: p.precio_venta || 0,
        }));
        this.cargandoRepuestos = false;
      },
      error: (err) => { 
        console.error("Error loading repuestos:", err);
        this.cargandoRepuestos = false; 
      },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.celda-repuesto')) this.items.forEach(it => it.mostrarDropdown = false);
  }

  filtrarRepuestosItem(item: ItemDetalle) {
    const q = item.busqueda.toLowerCase().trim();
    if (!q) { 
      item.resultados = [...this.repuestos]; // Show all products when no search term
      item.mostrarDropdown = true; 
      return; 
    }
    item.resultados = this.repuestos
      .filter(r => r.nombre.toLowerCase().includes(q)) // Only search by name now
      .slice(0, 20); // Show more results
    item.mostrarDropdown = true;
  }

  seleccionarRepuesto(rep: Repuesto, item: ItemDetalle) {
    item.repuesto = rep; item.precio_unit = rep.precio_venta; item.cantidad = 1;
    item.descripcion = ''; item.busqueda = ''; item.resultados = []; item.mostrarDropdown = false;
  }

  limpiarRepuesto(item: ItemDetalle) {
    item.repuesto = this.repuestoVacioFactory();
    item.busqueda = ''; item.resultados = []; item.mostrarDropdown = false;
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

  itemsValidos(): boolean {
    return this.items.length > 0 && this.items.every(it => !!it.repuesto.nombre && it.cantidad > 0);
  }

  confirmarVenta() {
    if (!this.itemsValidos()) { Swal.fire('Sin ítems válidos', 'Agregue al menos un repuesto con cantidad válida.', 'warning'); return; }
    let idUsuario = '';
    try { const user = JSON.parse(localStorage.getItem('currentUser') || '{}'); idUsuario = user.username || ''; } catch {}

    const payload = {
      id_usuario: idUsuario,
      tipo_comprobante: this.tipoComprobante,
      serie: this.serie,
      estado: this.estado,
      metodo_pago: this.metodoPago,
      fecha_emision: this.fechaEmision,
      descuento_global: this.descuentoGlobal,
      descuento_tipo: this.descuentoTipo,
      nota: this.nota,
      cliente: { dni: this.cliente.dni, nombre: this.cliente.nombre,
        apellido_paterno: this.cliente.apellido_paterno, apellido_materno: this.cliente.apellido_materno,
        celular: this.cliente.celular, correo: this.cliente.correo },
      items: this.items.map(it => ({ 
        repuesto: it.repuesto,
        cantidad: it.cantidad, 
        precio_unit: it.precio_unit,
        descuento: it.descuento 
      }))
    };

    this.guardando = true;
    this.http.post<any>(`${this.URL_VENTAS}/registrar`, payload).subscribe({
      next: (res) => {
        this.guardando = false;
        Swal.fire({ 
          title: '¡Venta registrada!',
          html: `<b>Total: S/ ${this.total.toFixed(2)}</b><br>Cliente: ${this.nombreCompletoCliente}`,
          icon: 'success', 
          confirmButtonColor: '#dc3545' 
        }).then(() => this.volver());
      },
      error: (err) => { 
        this.guardando = false; 
        let errorMsg = err.error?.message || 'No se pudo registrar la venta';
        Swal.fire('Error', errorMsg, 'error'); 
      },
    });
  }

  limpiar() {
    this.cliente = { ...this.clienteVarios }; this.items = []; this.descuentoGlobal = 0;
    this.descuentoTipo = '%'; this.nota = ''; this.metodoPago = 'Efectivo';
    this.fechaEmision = new Date().toISOString().split('T')[0];
    this.tipoComprobante = 'Boleta'; this.serie = 'B001';
    this.agregarItem();
  }
}
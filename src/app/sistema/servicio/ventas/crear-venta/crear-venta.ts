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

type ModoPanel = 'lista' | 'nuevo';

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
  private URL_CAJA      = `${API_BASE_URL}/api/caja`;

  tipoComprobante = 'Boleta';
  serie           = 'B001';
  estado          = 'Pagado';
  metodoPago      = 'Efectivo';
  fechaEmision: string = this.getFechaActualLocal();

  private getFechaActualLocal(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private get fechaEmisionCompleta(): string {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');
    return `${this.fechaEmision} ${hh}:${mm}:${ss}`;
  }
  vendedor = { nombre: '', cargo: '', codigo: '' };
  nota     = '';
  guardando = false;
  cajaAbierta = false;
  cargandoCaja = false;

  readonly metodosPago = ['Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin'];

  readonly clienteVarios: Cliente = {
    dni: '00000000', nombre: 'Cliente', apellido_paterno: 'Varios',
    apellido_materno: '', celular: '000000000', correo: 'sin-correo@correo.com',
  };
  cliente: Cliente = { ...this.clienteVarios };
  mostrarPanelCliente = false;
  modoPanel: ModoPanel = 'lista';
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

  items: ItemDetalle[] = [];
  repuestos: Repuesto[] = [];
  cargandoRepuestos = false;
  descuentoGlobal = 0;
  descuentoTipo: '%' | 'S/' = '%';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarVendedor();
      this.cargarRepuestos();
      this.cargarEstadoCaja();
      this.agregarItem();
    }
  }

  cargarEstadoCaja() {
    this.cargandoCaja = true;
    this.http.get<any>(`${this.URL_CAJA}/estado`).subscribe({
      next: (res) => {
        this.cajaAbierta = !!res?.abierta;
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cajaAbierta = false;
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarVendedor() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const nombreCompleto = `${user.nombre || ''} ${user.apellido_paterno || ''}`.trim();
      this.vendedor = {
        nombre: nombreCompleto || 'Sin nombre',
        cargo:  user.rol || '',
        codigo: user.username || '',
      };
    } catch { this.vendedor = { nombre: 'Sin nombre', cargo: '', codigo: '' }; }
  }

  onTipoChange() { this.serie = this.tipoComprobante === 'Boleta' ? 'B001' : 'F001'; }

  onEstadoChange() {
    if (this.estado === 'Pendiente') {
      this.metodoPago = '';
    } else {
      this.metodoPago = 'Efectivo';
    }
  }

  volver() { this.router.navigate(['/sistema/servicio/ventas']); }

  abrirPanelCliente(modo: ModoPanel = 'lista') {
    this.modoPanel = modo;
    this.mostrarPanelCliente = true;
    if (modo === 'lista') this.cargarListaClientes();
  }

  cerrarPanelCliente() {
    this.mostrarPanelCliente = false;
    this.filtroBusquedaLista = '';
    this.nuevoCliente = this.clienteVacioFactory();
    this.resetErroresNuevoCliente();
    this.nuevoClienteDniValidado = false;
    this.nuevoClientePermiteEditar = false;
    this.consultandoDniNuevo = false;
  }

    irACrearNuevoDesdeLista() {
    const posibleDni = this.filtroBusquedaLista.replace(/\D/g, '');
    this.modoPanel = 'nuevo';
    this.nuevoCliente = this.clienteVacioFactory();
    this.resetErroresNuevoCliente();
    this.nuevoClienteDniValidado = false;
    this.nuevoClientePermiteEditar = false;
    this.consultandoDniNuevo = false;

    if (/^\d{8}$/.test(posibleDni)) {
      this.nuevoCliente.dni = posibleDni;
      this.buscarDniNuevo();
    }
  }

  cambiarModo(modo: ModoPanel) {
    this.modoPanel = modo;
    if (modo === 'lista') this.cargarListaClientes();
    if (modo === 'nuevo') {
      this.nuevoCliente = this.clienteVacioFactory();
      this.resetErroresNuevoCliente();
      this.nuevoClienteDniValidado = false;
      this.nuevoClientePermiteEditar = false;
      this.consultandoDniNuevo = false;
    }
  }

  cargarListaClientes() {
    this.cargandoLista = true;
    this.http.get<any[]>(`${this.URL_CLIENTES}/listar`).subscribe({
      next: (data) => { 
        this.listaClientes = (data || []).filter((c: any) => c.estado === 'Activo'); 
        this.aplicarFiltroLista(); 
        this.cargandoLista = false; 
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

  validarNombreNuevo()    { this.errorNombreNuevo    = !this.nuevoCliente.nombre.trim() || this.nuevoCliente.nombre.trim().length < 2; }
  validarApPaternoNuevo() { this.errorApPaternoNuevo = !this.nuevoCliente.apellido_paterno.trim(); }
  validarCelularNuevo()   { this.errorCelularNuevo   = !/^9\d{8}$/.test(this.nuevoCliente.celular.trim()); }
  validarCorreoNuevo()    { this.errorCorreoNuevo    = !!this.nuevoCliente.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo.trim()); }

  get nuevoClienteValido(): boolean {
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
    return this.nuevoClienteDniValidado;
  }

  guardarNuevoCliente() {
    this.validarDniNuevo(); this.validarNombreNuevo(); this.validarApPaternoNuevo();
    this.validarCelularNuevo(); this.validarCorreoNuevo();
    if (!this.nuevoClienteValido) { Swal.fire('Datos incompletos', 'Corrige los campos marcados.', 'warning'); return; }
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
      carros: []
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
        this.repuestos = (data || []).filter(p => p.estado === 'Activo').map(p => ({
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
    if (this.items.length > 0) {
      const ultimoItem = this.items[this.items.length - 1];
      if (!ultimoItem.repuesto || !ultimoItem.repuesto.nombre) {
        Swal.fire({
          icon: 'warning',
          title: 'Producto anterior incompleto',
          text: 'Debe seleccionar un producto en la fila actual antes de agregar uno nuevo.',
          confirmButtonColor: '#dc3545'
        });
        return;
      }
    }
    this.items.push({ repuesto: this.repuestoVacioFactory(), descripcion: '', cantidad: 1,
      precio_unit: 0, descuento: 0, busqueda: '', resultados: [], mostrarDropdown: false });
  }

  eliminarItem(idx: number) { this.items.splice(idx, 1); }

  validarCantidadItem(item: ItemDetalle) {
    if (item.cantidad > (item.repuesto.stock || 0) && item.repuesto.stock > 0) {
      Swal.fire('Stock insuficiente', `Solo hay ${item.repuesto.stock} unidades disponible(s).`, 'warning');
      item.cantidad = 0;
    }
  }

  importeItem(item: ItemDetalle): number {
    const bruto = item.cantidad * item.precio_unit;
    return bruto - (bruto * item.descuento / 100);
  }

  get subtotal(): number { return this.items.reduce((s, it) => s + this.importeItem(it), 0); }
  get descuentoMonto(): number { return this.descuentoTipo === '%' ? this.subtotal * this.descuentoGlobal / 100 : this.descuentoGlobal; }

  // El precio de cada producto YA INCLUYE el IGV (así se maneja en Perú: el precio
  // de venta al público es el precio final). Por eso el IGV no se suma al total,
  // se EXTRAE del precio para mostrarlo desglosado en el comprobante.
  // Precio con IGV incluido = Valor de venta × 1.18  →  IGV = Precio - (Precio / 1.18)
  get precioConDescuento(): number { return this.subtotal - this.descuentoMonto; }
  get valorVenta(): number { return this.precioConDescuento / 1.18; }
  get igv(): number { return this.precioConDescuento - this.valorVenta; }
  get total(): number { return this.precioConDescuento; }

  itemsValidos(): boolean {
    return this.items.length > 0 && this.items.every(it =>
      !!it.repuesto.nombre && it.cantidad > 0 && it.cantidad <= (it.repuesto.stock || 0));
  }

  showModalVoucher = false;
  voucherDatos: any = null;
  descargandoPDF = false;

  cerrarVoucher() {
    this.showModalVoucher = false;
    this.volver();
  }

  descargarVoucherPDF() {
    const id = this.voucherDatos?.id_orden_venta || this.voucherDatos?.nOrden;
    if (!id) {
      this.imprimirVoucherHTML();
      return;
    }

    this.descargandoPDF = true;
    this.http.get(`${this.URL_VENTAS}/${id}/comprobante`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.descargandoPDF = false;
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Comprobante_Venta_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.descargandoPDF = false;
        console.warn('Backend PDF error, usando impresión estándar HTML:', err);
        this.imprimirVoucherHTML();
        this.cdr.detectChanges();
      }
    });
  }

  imprimirVoucherHTML() {
    const printContent = document.getElementById('voucher-imprimir')?.innerHTML;
    if (!printContent) return;

    let iframe = document.getElementById('print-iframe-voucher') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-voucher';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Voucher_Venta_${this.voucherDatos?.nOrden || 'Pago'}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #222; padding: 20px; }
              .voucher-box { border: 2px solid #dc3545; border-radius: 12px; padding: 30px; background: #fff; max-width: 750px; margin: auto; }
              .badge-tipo { background: #dc3545; color: #fff; font-size: 14px; padding: 4px 12px; border-radius: 20px; }
              .total-highlight { font-size: 24px; font-weight: bold; color: #dc3545; }
              @media print {
                body { padding: 0; }
                .voucher-box { border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="voucher-box">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    }
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
      fecha_emision: this.fechaEmisionCompleta,
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
        const idOrden = res.id_orden_venta || res.n_orden || Math.floor(1000 + Math.random() * 9000);
        this.voucherDatos = {
          id_orden_venta: idOrden,
          nOrden: idOrden,
          tipoComprobante: this.tipoComprobante,
          serie: this.serie,
          fecha: new Date().toLocaleDateString('es-PE'),
          hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
          clienteNombre: this.nombreCompletoCliente,
          clienteDni: this.cliente.dni,
          clienteCelular: this.cliente.celular,
          metodoPago: this.metodoPago,
          items: this.items.map(it => ({
            nombre: it.repuesto.nombre,
            cantidad: it.cantidad,
            precio_unit: it.precio_unit,
            importe: this.importeItem(it)
          })),
          subtotal: this.subtotal,
          descuentoMonto: this.descuentoMonto,
          valorVenta: this.valorVenta,
          igv: this.igv,
          total: this.total
        };
        this.showModalVoucher = true;
        this.cdr.detectChanges();
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
    this.fechaEmision = this.getFechaActualLocal();
    this.tipoComprobante = 'Boleta'; this.serie = 'B001';
    this.agregarItem();
  }
}
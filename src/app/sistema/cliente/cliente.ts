import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Cliente implements OnInit {
  mostrarModal = false;
  mostrarModalEdit = false;
  mostrarModalVehiculo = false;
  filtroBusqueda: string = '';
  filtroEstado: string = 'Activo';
  clientes: any[] = [];
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  clienteEditando: any = {};
  nuevoVehiculo: any = { placa: '', marca: '', modelo: '', anio: '' };
  errorPlaca = false;

  private URL_API = `${API_BASE_URL}/api/clientes`;

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

  get marcas(): string[] { return Object.keys(this.catalogoMarcas).sort(); }

  get modelosFiltrados(): string[] {
    return this.nuevoVehiculo.marca
      ? (this.catalogoMarcas[this.nuevoVehiculo.marca] ?? []).sort()
      : [];
  }

  get anios(): number[] {
    const actual = new Date().getFullYear();
    const lista: number[] = [];
    for (let a = actual; a >= 1990; a--) lista.push(a);
    return lista;
  }

  onMarcaChange() { this.nuevoVehiculo.modelo = ''; this.nuevoVehiculo.anio = ''; }
  onModeloChange() { this.nuevoVehiculo.anio = ''; }

  formatearPlaca() {
  let v = this.nuevoVehiculo.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3, 6);
  this.nuevoVehiculo.placa = v;
  const limpio = v.replace('-', '');
  const mayorValido = /^[A-Z0-9]{3}-\d{3}$/.test(v);  // M4F-520
  const menorValido = /^[A-Z]{2}-\d{4}$/.test(v);      // AB-1234
  this.errorPlaca = limpio.length >= 5 && !mayorValido && !menorValido;
}

  constructor(private http: HttpClient) {
    this.router.events.subscribe((ev: any) => {
      const url = this.router.url || '';
      const isModalRoute = url.includes('/sistema/cliente/agregar-cliente');
      const isEditRoute = url.includes('/sistema/cliente/editar-cliente');
      
      if (isModalRoute || isEditRoute) {
        if (isModalRoute) this.mostrarModal = true;
      } else {
        const wasOpen = this.mostrarModal;
        this.mostrarModal = false;
        if (wasOpen || isEditRoute) this.cargarClientes();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarClientes();
    }
  }

  cargarClientes() {
    this.http.get<any[]>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        this.clientes = (data || []).map((row: any) => ({
          dni: row.dni,
          nombre: row.nombre,
          apellido_paterno: row.apellido_paterno,
          apellido_materno: row.apellido_materno,
          celular: row.celular,
          correo: row.correo,
          estado: row.estado,
          vehiculos: row.carros || [],
        }));
        this.cdr.detectChanges();
      },
      error: (err) => { console.error('Error al cargar clientes:', err); },
    });
  }

  get clientesFiltrados() {
    let list = this.clientes.slice();
    if (this.filtroEstado && this.filtroEstado !== 'Todos') {
      list = list.filter((c: any) => c.estado === this.filtroEstado);
    }
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      const qNorm = this.normalizeString(this.filtroBusqueda.toLowerCase());
      list = list.filter((c: any) =>
        (c.nombre && this.normalizeString(c.nombre.toLowerCase()).includes(qNorm)) ||
        (c.apellido_paterno && this.normalizeString(c.apellido_paterno.toLowerCase()).includes(qNorm)) ||
        (c.apellido_materno && this.normalizeString(c.apellido_materno.toLowerCase()).includes(qNorm))
      );
    }
    return list;
  }

  normalizeString(s: string) {
    if (!s) return '';
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  aplicarFiltros() { this.cdr.detectChanges(); }

  abrirModal() {
    this.mostrarModal = true;
    this.router.navigate(['/sistema/cliente/agregar-cliente']);
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.router.navigate(['/sistema/cliente']);
  }

  abrirModalEdit(cliente: any) {
    this.clienteEditando = { ...cliente };
    if (!this.clienteEditando.vehiculos) this.clienteEditando.vehiculos = [];
    this.mostrarModalEdit = true;
  }

  cerrarModalEdit() { this.mostrarModalEdit = false; }

  abrirModalVehiculo() {
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '', anio: '' };
    this.errorPlaca = false;
    this.mostrarModalVehiculo = true;
  }

  cerrarModalVehiculo() { this.mostrarModalVehiculo = false; }

  guardarVehiculo() {
    if (!this.nuevoVehiculo.placa || !this.nuevoVehiculo.marca || !this.nuevoVehiculo.modelo || !this.nuevoVehiculo.anio || this.errorPlaca) {
      Swal.fire('Error', 'Complete todos los campos del vehículo', 'error');
      return;
    }
    if (!this.clienteEditando.vehiculos) this.clienteEditando.vehiculos = [];
    this.clienteEditando.vehiculos.push({ ...this.nuevoVehiculo });
    this.cerrarModalVehiculo();
    Swal.fire('Agregado', 'Vehículo agregado correctamente', 'success');
  }

  eliminarVehiculo(vehiculo: any) {
    Swal.fire({
      title: '¿Eliminar vehículo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        const listaFiltrada = this.clienteEditando.vehiculos.filter(
          (v: any) => v.placa !== vehiculo.placa,
        );
        this.clienteEditando.vehiculos = [...listaFiltrada];
        this.cdr.detectChanges();
        Swal.fire('Eliminado', 'Vehículo eliminado', 'success');
      }
    });
  }

  guardarCambios() {
    console.log('Enviando actualización de cliente al backend:', this.clienteEditando);

    const payload = {
      cliente: {
        dni: this.clienteEditando.dni,
        nombre: this.clienteEditando.nombre,
        apellido_paterno: this.clienteEditando.apellido_paterno,
        apellido_materno: this.clienteEditando.apellido_materno || '',
        celular: this.clienteEditando.celular,
        correo: this.clienteEditando.correo || '',
        estado: this.clienteEditando.estado
      },
      carros: this.clienteEditando.vehiculos.map((v: any) => ({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anio: String(v.anio)
      }))
    };

    this.http.put<any>(`${this.URL_API}/actualizar`, payload).subscribe({
      next: (res) => {
        console.log('Respuesta del backend:', res);
        if (res && res.status === 'editado') {
          Swal.fire('Actualizado', 'Los datos del cliente han sido modificados', 'success');
          this.cerrarModalEdit();
          this.cargarClientes();
        } else {
          const mensajeErr = res?.status || 'No se pudo actualizar el cliente';
          Swal.fire('Error', mensajeErr, 'error');
        }
      },
      error: (err) => {
        console.error('ERROR:', err);
        const detalleError = err.error?.status || 'No se pudo actualizar el cliente';
        Swal.fire('Error', detalleError, 'error');
      }
    });
  }

  eliminarCliente(dni: string) {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: 'Se cambiará el estado a Inactivo. Se eliminarán todos los registros asociados a este cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        const cliente = this.clientes.find((c: any) => c.dni === dni);
        if (!cliente) {
          Swal.fire('Error', 'Cliente no encontrado', 'error');
          return;
        }

        const payload = {
          cliente: {
            dni: cliente.dni,
            nombre: cliente.nombre,
            apellido_paterno: cliente.apellido_paterno,
            apellido_materno: cliente.apellido_materno || '',
            celular: cliente.celular,
            correo: cliente.correo || '',
            estado: 'Inactivo'
          },
          carros: cliente.vehiculos.map((v: any) => ({
            placa: v.placa,
            marca: v.marca,
            modelo: v.modelo,
            anio: String(v.anio)
          }))
        };

        this.http.put<any>(`${this.URL_API}/actualizar`, payload).subscribe({
          next: (res) => {
            console.log('Respuesta del backend:', res);
            if (res && res.status === 'editado') {
              Swal.fire('Eliminado', 'El cliente ha sido retirado del sistema', 'success');
              this.cargarClientes();
            } else {
              const mensajeErr = res?.status || 'No se pudo eliminar el cliente';
              Swal.fire('Error', mensajeErr, 'error');
            }
          },
          error: (err) => {
            console.error('ERROR:', err);
            const detalleError = err.error?.status || 'No se pudo eliminar el cliente';
            Swal.fire('Error', detalleError, 'error');
          }
        });
      }
    });
  }

  exportarExcel() {
    const payload = this.clientesFiltrados.map((c) => ({
      dni: c.dni,
      nombre: c.nombre,
      apellido_paterno: c.apellido_paterno || '',
      apellido_materno: c.apellido_materno || '',
      celular: c.celular || '',
      correo: c.correo || '',
      estado: c.estado,
      vehiculos: c.vehiculos && c.vehiculos.length > 0
        ? c.vehiculos.map((v: any) => `${v.placa} - ${v.marca} ${v.modelo}`).join(', ')
        : 'Sin vehículos',
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Clientes_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.clientesFiltrados.map((c) => ({
      dni: c.dni,
      nombre: c.nombre,
      apellido_paterno: c.apellido_paterno || '',
      apellido_materno: c.apellido_materno || '',
      celular: c.celular || '',
      correo: c.correo || '',
      estado: c.estado,
      vehiculos: c.vehiculos && c.vehiculos.length > 0
        ? c.vehiculos.map((v: any) => `${v.placa} - ${v.marca} ${v.modelo}`).join(', ')
        : 'Sin vehículos',
    }));
    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Clientes_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF', 'error');
      },
    });
  }
}
import { API_BASE_URL } from '@config';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-cliente',
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-cliente.html',
  styleUrl: './agregar-cliente.css',
})
export class AgregarCliente {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private URL_API = `${API_BASE_URL}/api/clientes`;

  nuevoCliente: any = { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '', estado: 'Activo' };
  vehiculos: any[] = [];
  nuevoVehiculo: any = { placa: '', marca: '', modelo: '', anio: '' };
  
  mostrarModalVehiculo = false;
  dniValidado = false;
  consultandoDni = false;
  errorDni = false;
  errorCelular = false;
  errorCorreo = false;
  permiteEdicionManual = false;
  errorPlaca = false;
  errorPlacaDuplicada = false;
  guardando = false;

  // ── AUTOCOMPLETE Marca / Modelo ─────────────────────────────────────────────
  marcaTexto = '';
  modeloTexto = '';
  mostrarSugerenciasMarca = false;
  mostrarSugerenciasModelo = false;

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

  // Escribir en el input de marca: filtra sugerencias y limpia selección si no coincide exacto
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
    // Pequeño delay para permitir que el click en la sugerencia se registre antes de ocultar
    setTimeout(() => {
      this.mostrarSugerenciasMarca = false;
      // Si lo que escribió no es una marca válida del catálogo, limpiar el texto
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
  // ── FIN AUTOCOMPLETE ─────────────────────────────────────────────────────────

  onMarcaChange() {
    this.nuevoVehiculo.modelo = '';
    this.nuevoVehiculo.anio = '';
  }

  onModeloChange() {
    this.nuevoVehiculo.anio = '';
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
  const mayorValido = /^[A-Z0-9]{3}-\d{3}$/.test(v); // M4F-520
  const menorValido = /^[A-Z]{2}-\d{4}$/.test(v);     // AB-1234
  const limpio = v.replace('-', '');
  this.errorPlaca = limpio.length >= 4 && !mayorValido && !menorValido;
  this.errorPlacaDuplicada = (mayorValido || menorValido) &&
    this.vehiculos.some(veh => veh.placa === v);
}



  validarDni() {
    const dni = this.nuevoCliente.dni.replace(/\D/g, '');
    this.nuevoCliente.dni = dni;
    this.errorDni = !/^\d{8}$/.test(dni);
    if (this.errorDni) { this.dniValidado = false; return; }
    
    this.consultandoDni = true;
    this.http.get<any>(`${this.URL_API}/buscar-dni/${dni}`).subscribe({
      next: (data) => {
        this.consultandoDni = false;
        if (data?.success) {
          this.nuevoCliente.nombre = data.nombres || '';
          this.nuevoCliente.apellido_paterno = data.apellidoPaterno || '';
          this.nuevoCliente.apellido_materno = data.apellidoMaterno || '';
          this.dniValidado = true;
          this.permiteEdicionManual = false;
        } else { 
          this.dniValidado = false;
          this.permiteEdicionManual = true;
          Swal.fire('Atención', 'No encontrado en RENIEC. Puede ingresar los datos manualmente.', 'info'); 
        }
        this.cdr.detectChanges();
      },
      error: () => { 
        this.consultandoDni = false; 
        this.dniValidado = false;
        this.permiteEdicionManual = true;
        Swal.fire('Error de API', 'No se pudo conectar con RENIEC. Puede ingresar los datos manualmente.', 'warning');
        this.cdr.detectChanges();
      }
    });
  }

  get esCorreoValido(): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo); }

  agregarVehiculoLista() {
  if (!this.nuevoVehiculo.placa || !this.nuevoVehiculo.marca || !this.nuevoVehiculo.modelo || !this.nuevoVehiculo.anio || this.errorPlaca) return;

  const yaExiste = this.vehiculos.some(v => v.placa === this.nuevoVehiculo.placa);
  if (yaExiste) {
    this.errorPlacaDuplicada = true;
    Swal.fire('Placa duplicada', 'Este cliente ya tiene registrado un vehículo con esa placa.', 'warning');
    return;
  }

  this.vehiculos.push({ ...this.nuevoVehiculo });
  this.nuevoVehiculo = { placa: '', marca: '', modelo: '', anio: '' };
  this.marcaTexto = '';
  this.modeloTexto = '';
  this.errorPlacaDuplicada = false;
  this.mostrarModalVehiculo = false;
  }

  abrirModalVehiculo() { this.mostrarModalVehiculo = true; }
  cerrarModalVehiculo() {
    this.mostrarModalVehiculo = false;
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '', anio: '' };
    this.marcaTexto = '';
    this.modeloTexto = '';
    this.errorPlacaDuplicada = false;
  }
  eliminarVehiculo(veh: any) {
    const index = this.vehiculos.indexOf(veh);
    if (index > -1) this.vehiculos.splice(index, 1);
  }
  validarCelular() { this.errorCelular = this.nuevoCliente.celular && !/^9\d{8}$/.test(this.nuevoCliente.celular); }

  // Getter centralizado: usado en el HTML con [disabled]="!puedeGuardar"
  get puedeGuardar(): boolean {
    if (this.guardando) return false;
    if (this.permiteEdicionManual) {
      return !!(
        this.nuevoCliente.dni?.trim() &&
        this.nuevoCliente.nombre?.trim() &&
        this.nuevoCliente.apellido_paterno?.trim() &&
        this.nuevoCliente.apellido_materno?.trim() &&
        this.nuevoCliente.celular?.trim() &&
        !this.errorCelular
      );
    }
    return this.dniValidado;
  }
  
  obtenerUsuarioLogueado(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.username || '';
    } catch { return ''; }
  }

  guardarCliente() {
    if (this.guardando) return;

    if (!this.puedeGuardar) {
      Swal.fire('Error', 'Complete todos los campos correctamente', 'warning');
      return;
    }

    const payload = {
      cliente: {
        dni: this.nuevoCliente.dni,
        nombre: this.nuevoCliente.nombre,
        apellido_paterno: this.nuevoCliente.apellido_paterno,
        apellido_materno: this.nuevoCliente.apellido_materno,
        celular: this.nuevoCliente.celular,
        correo: this.nuevoCliente.correo,
        estado: this.nuevoCliente.estado,
        usuario_logueado: this.obtenerUsuarioLogueado()
      },
      carros: this.vehiculos.map((v: any) => ({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anio: String(v.anio)
      }))
    };

    this.guardando = true;
    this.http.post(`${this.URL_API}/registrar`, payload, { responseType: 'text' })
      .pipe(finalize(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          Swal.fire('Guardado', 'Cliente registrado exitosamente', 'success');
          this.cerrarModal();
        },
        error: (err) => {
          Swal.fire('Error', err.error || 'Error al registrar cliente', 'error');
        }
      });
  }
  
  cerrarModal() { this.router.navigate(['/sistema/cliente']); }
}
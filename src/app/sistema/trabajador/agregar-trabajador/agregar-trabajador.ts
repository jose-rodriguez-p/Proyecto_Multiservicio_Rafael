import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-trabajador',
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-trabajador.html',
  styleUrl: './agregar-trabajador.css',
})
export class AgregarTrabajador implements OnInit {
  URL_API = `${API_BASE_URL}/api/trabajadores`;
  URL_ROLES = `${API_BASE_URL}/api/configuracion/roles/listar`;

  documentos: any[] = [];
  cargos: any[] = [];
  roles: any[] = [];

  correoValidado = false;
  validandoCorreo = false;
  consultandoDni = false;

  dniValidado = false;
  errorDni = false;
  errorCelular = false;
  errorCorreo = false;
  permiteEdicionManual = false;

  // Dirección estructurada
  readonly tiposVia = ['Calle', 'Avenida', 'Urbanización', 'Edificio', 'Jirón', 'Pasaje', 'Prolongación'];
  dir = { tipo: 'Calle', nombre: '', numero: '' };
  dirTocado = false;

  private cdr = inject(ChangeDetectorRef);

  nuevoTrabajador: any = {
    id_documento: null,
    numeroDocumento: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    correo: '',
    id_cargo: null,
    estado: 'Activo',
    usuario: '',
    contrasena: '',
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarDocumentos();
    this.cargarCargos();
    this.cargarRoles();
  }

  // ── DIRECCIÓN ────────────────────────────────────────────────────────────────

  get direccionCompleta(): string {
    const partes = [this.dir.tipo, this.dir.nombre, this.dir.numero].filter(p => p?.trim());
    return partes.join(' ').trim();
  }

  get direccionValida(): boolean {
    return !!(this.dir.tipo && this.dir.nombre.trim() && this.dir.numero.trim());
  }

  // ── CARGOS / ROLES / DOCUMENTOS ──────────────────────────────────────────────

  cargarDocumentos() {
    this.http.get<any[]>(`${this.URL_API}/documentos`).subscribe({
      next: (r) => {
        this.documentos = r || [];
        if (this.documentos.length > 0 && !this.nuevoTrabajador.id_documento) {
          this.nuevoTrabajador.id_documento = this.documentos[0].id;
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar documentos', 'error'),
    });
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (r) => {
        this.cargos = r || [];
        if (this.cargos.length > 0 && !this.nuevoTrabajador.id_cargo) {
          this.nuevoTrabajador.id_cargo = this.cargos[0].id;
        }
        this.cdr.detectChanges();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar cargos', 'error'),
    });
  }

  cargarRoles() {
    this.http.get<any[]>(this.URL_ROLES).subscribe({
      next: (r) => { this.roles = r || []; this.cdr.detectChanges(); },
    });
  }

  // ── DNI ──────────────────────────────────────────────────────────────────────

  validarDni() {
    const dni = this.nuevoTrabajador.numeroDocumento.replace(/\D/g, '');
    this.nuevoTrabajador.numeroDocumento = dni;
    this.errorDni = !/^\d{8}$/.test(dni);
    this.dniValidado = false;

    if (this.errorDni) { this.limpiarDatosPersona(); return; }

    if (this.cargoRequiereCredenciales()) {
      this.nuevoTrabajador.usuario = dni;
    }

    this.consultandoDni = true;
    this.http.get<{ existe: boolean }>(`${this.URL_API}/validar-dni/${dni}`).subscribe({
      next: (res) => {
        if (res.existe) {
          this.consultandoDni = false;
          this.limpiarDatosPersona();
          Swal.fire('DNI registrado', 'Este DNI ya existe en el sistema', 'warning');
          this.cdr.detectChanges();
          return;
        }
        this.http.get<any>(`${this.URL_API}/buscar-dni/${dni}`).subscribe({
          next: (data) => {
            this.consultandoDni = false;
            if (data && data.success) {
              this.dniValidado = true;
              this.nuevoTrabajador.nombre = data.nombres || '';
              this.nuevoTrabajador.apellido_paterno = data.apellidoPaterno || '';
              this.nuevoTrabajador.apellido_materno = data.apellidoMaterno || '';
              Swal.fire('DNI validado', 'Información obtenida de RENIEC', 'success');
            } else {
              this.limpiarDatosPersona();
              this.permiteEdicionManual = true;
              Swal.fire({
                title: 'DNI no encontrado',
                text: 'No se encontró información en RENIEC. Puede ingresar los datos manualmente.',
                icon: 'info',
                confirmButtonText: 'Ingresar datos manualmente'
              });
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.consultandoDni = false;
            this.limpiarDatosPersona();
            this.permiteEdicionManual = true;
            console.error('Error al buscar DNI en API externa:', err);
            Swal.fire({
              title: 'Error de API',
              text: 'No se pudo conectar con RENIEC. Puede ingresar los datos manualmente.',
              icon: 'warning',
              confirmButtonText: 'Ingresar datos manualmente'
            });
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.consultandoDni = false;
        Swal.fire('Error', 'No se pudo validar el DNI en el sistema', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  habilitarEdicionManual() {
    this.permiteEdicionManual = true;
    this.dniValidado = true;
    this.cdr.detectChanges();
  }

  limpiarDatosPersona() {
    this.dniValidado = false;
    this.nuevoTrabajador.nombre = '';
    this.nuevoTrabajador.apellido_paterno = '';
    this.nuevoTrabajador.apellido_materno = '';
  }

  // ── CELULAR / CORREO ─────────────────────────────────────────────────────────

  validarCelular() {
    const celular = this.nuevoTrabajador.celular.replace(/\D/g, '');
    this.nuevoTrabajador.celular = celular;
    this.errorCelular = !/^[9]\d{8}$/.test(celular);
  }

  validarCorreo() {
    if (this.correoValidado) return;
    this.errorCorreo = !this.correoValido;
  }

  get correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoTrabajador.correo);
  }

  validarCodigo(codigo: string) {
    this.http
      .post(`${this.URL_API}/correo/validar`,
        { dni: this.nuevoTrabajador.numeroDocumento, codigo },
        { responseType: 'text' })
      .subscribe({
        next: (respuesta) => {
          if (respuesta === 'CODIGO_VALIDO') {
            this.correoValidado = true;
            Swal.fire('Correcto', 'Correo validado', 'success');
          } else {
            Swal.fire({
              title: 'Código incorrecto',
              text: 'El código ingresado no es válido. Por favor, inténtelo nuevamente.',
              icon: 'error',
              input: 'text',
              inputLabel: 'Ingrese código de 6 dígitos',
              inputAttributes: { maxlength: '6' },
              allowOutsideClick: false,
              showCancelButton: true,
              confirmButtonText: 'Reintentar',
              cancelButtonText: 'Cancelar'
            }).then((r) => { if (r.isConfirmed && r.value) this.validarCodigo(r.value); });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          Swal.fire({
            title: 'Error de validación',
            text: 'No se pudo validar el código. Por favor, inténtelo nuevamente.',
            icon: 'error',
            input: 'text',
            inputLabel: 'Ingrese código de 6 dígitos',
            inputAttributes: { maxlength: '6' },
            allowOutsideClick: false,
            showCancelButton: true,
            confirmButtonText: 'Reintentar',
            cancelButtonText: 'Cancelar'
          }).then((r) => { if (r.isConfirmed && r.value) this.validarCodigo(r.value); });
        },
      });
  }

  validarCorreoBackend() {
    if (this.permiteEdicionManual) { this.correoValidado = true; return; }
    if (!this.correoValido || this.correoValidado) { this.errorCorreo = true; return; }
    this.validandoCorreo = true;
    this.http
      .post(`${this.URL_API}/correo/enviar`,
        { correo: this.nuevoTrabajador.correo, dni: this.nuevoTrabajador.numeroDocumento },
        { responseType: 'text' })
      .subscribe({
        next: (res) => {
          this.validandoCorreo = false;
          if (res === 'CODIGO_ENVIADO') {
            Swal.fire({
              title: 'Validar correo',
              input: 'text',
              inputLabel: 'Ingrese código de 6 dígitos',
              inputAttributes: { maxlength: '6' },
              allowOutsideClick: false,
              showCancelButton: true,
            }).then((r) => { if (r.isConfirmed && r.value) this.validarCodigo(r.value); });
          } else {
            Swal.fire('Error', 'No se pudo enviar el correo', 'error');
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.validandoCorreo = false;
          Swal.fire('Error', 'No se pudo enviar el correo', 'error');
          this.cdr.detectChanges();
        },
      });
  }

  // ── CARGO ────────────────────────────────────────────────────────────────────

  cargoRequiereCredenciales(): boolean {
    const cargo = this.cargos.find((c) => c.id === this.nuevoTrabajador.id_cargo);
    if (!cargo) return false;
    const nombreCargo = cargo.nombre?.toLowerCase() || '';
    if (nombreCargo === 'administrador' || nombreCargo === 'auditor') return true;
    const rol = this.roles.find((r) => r.nombre?.toLowerCase() === nombreCargo);
    return !!(rol && Array.isArray(rol.menus) && rol.menus.length > 0);
  }

  onCargoChange() {
    if (this.cargoRequiereCredenciales()) {
      this.nuevoTrabajador.usuario = this.nuevoTrabajador.numeroDocumento || '';
    } else {
      this.nuevoTrabajador.usuario = '';
      this.nuevoTrabajador.contrasena = '';
    }
  }

  obtenerNombreDocumento(): string {
    const doc = this.documentos.find((d) => d.id === this.nuevoTrabajador.id_documento);
    return doc ? doc.nombre : 'DNI';
  }

  obtenerNombreCargo(): string {
    const cargo = this.cargos.find((c) => c.id === this.nuevoTrabajador.id_cargo);
    return cargo ? cargo.nombre : '';
  }

  obtenerUsuarioLogueado(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.username || '';
    } catch { return ''; }
  }

  // ── VALIDACIÓN GLOBAL ────────────────────────────────────────────────────────

  datosValidos(): boolean {
    const credencialesOk = !this.cargoRequiereCredenciales()
      || (this.nuevoTrabajador.usuario?.trim() && this.nuevoTrabajador.contrasena?.trim());

    if (this.permiteEdicionManual) {
      return !!(
        this.nuevoTrabajador.numeroDocumento?.trim() &&
        this.nuevoTrabajador.nombre?.trim() &&
        this.nuevoTrabajador.apellido_paterno?.trim() &&
        this.nuevoTrabajador.apellido_materno?.trim() &&
        this.nuevoTrabajador.celular?.trim() &&
        this.nuevoTrabajador.correo?.trim() &&
        this.direccionValida &&
        !this.errorCelular &&
        !this.errorCorreo &&
        credencialesOk
      );
    }

    return !!(
      this.dniValidado &&
      this.correoValidado &&
      !this.errorCelular &&
      this.nuevoTrabajador.nombre &&
      this.nuevoTrabajador.celular &&
      this.direccionValida &&
      credencialesOk
    );
  }

  // ── GUARDAR ──────────────────────────────────────────────────────────────────

  guardarTrabajador() {
    this.dirTocado = true; // mostrar errores de dirección si intenta guardar sin completar

    if (!this.datosValidos()) {
      if (!this.direccionValida) {
        Swal.fire('Dirección incompleta', 'Complete el tipo de vía, nombre y número.', 'warning');
      } else {
        Swal.fire('Formulario incompleto', 'Revise todos los campos', 'warning');
      }
      return;
    }

    const payload: any = {
      numeroDocumento: this.nuevoTrabajador.numeroDocumento,
      nombre: this.nuevoTrabajador.nombre,
      apellido_paterno: this.nuevoTrabajador.apellido_paterno,
      apellido_materno: this.nuevoTrabajador.apellido_materno,
      celular: this.nuevoTrabajador.celular,
      correo: this.nuevoTrabajador.correo,
      direccion: this.direccionCompleta,
      nombre_documento: this.obtenerNombreDocumento(),
      nombre_cargo: this.obtenerNombreCargo(),
      estado: this.nuevoTrabajador.estado,
      usuarioLogueado: this.obtenerUsuarioLogueado(),
    };

    if (this.cargoRequiereCredenciales()) {
      payload.usuario = this.nuevoTrabajador.usuario;
      payload.contrasena = this.nuevoTrabajador.contrasena;
    }

    this.http.post(`${this.URL_API}/crear`, payload, { responseType: 'text' }).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Trabajador registrado', 'success').then(() => {
          this.router.navigate(['/sistema/trabajador']);
        });
      },
      error: (err) => {
        const msg = err.error || 'No se pudo registrar';
        if (msg.includes('error_dni_duplicado')) {
          Swal.fire('Error', 'El DNI ya está registrado', 'error');
        } else if (msg.includes('error_usuario_ya_existe')) {
          Swal.fire('Error', 'El nombre de usuario ya existe', 'error');
        } else if (msg.includes('error_usuario_logueado')) {
          Swal.fire('Error', 'Sesión no válida. Vuelva a iniciar sesión', 'error');
        } else {
          Swal.fire('Error', msg, 'error');
        }
      },
    });
  }

  desbloquearCampos() {
    this.permiteEdicionManual = true;
    this.dniValidado = false;
    Swal.fire({
      title: 'Campos desbloqueados',
      text: 'Ahora puede editar los datos manualmente.',
      icon: 'info',
      timer: 3000,
      showConfirmButton: false,
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }
}
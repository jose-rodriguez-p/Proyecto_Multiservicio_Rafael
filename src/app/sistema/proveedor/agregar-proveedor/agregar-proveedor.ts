import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-proveedor.html',
  styleUrl: './agregar-proveedor.css',
})
export class AgregarProveedor implements OnInit {
  URL_API = `${API_BASE_URL}/api/proveedores`;

  esEdicion = false;
  idProveedorAEditar: string | null = null; 

  correoValidado = false;
  validandoCorreo = false;
  rucValidado = false;

  errorRuc = false;
  errorCelular = false;
  errorCorreo = false;

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  nuevoProveedor: any = {
    ruc: '',
    nombre_empresa: '',
    celular: '',
    correo: '',
    direccion: '',
    estado: 'Activo',
  };

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const parametroRuc = params['id'] || params['ruc'];
      
      if (parametroRuc) {
        this.esEdicion = true;
        this.idProveedorAEditar = parametroRuc; 
        this.cargarProveedor(this.idProveedorAEditar!);
      } else {
        this.esEdicion = false;
        this.idProveedorAEditar = null;
        this.limpiarFormulario();
      }
    });
  }

  cargarProveedor(ruc: string) {
    this.http.get<any>(`${this.URL_API}/${ruc}`).subscribe({
      next: (res) => {
        if (res) {
          this.nuevoProveedor = res;
          this.rucValidado = true;
          this.correoValidado = true;
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los datos del proveedor', 'error'),
    });
  }

  limpiarFormulario() {
    this.nuevoProveedor = {
      ruc: '',
      nombre_empresa: '',
      celular: '',
      correo: '',
      direccion: '',
      estado: 'Activo',
    };
    this.rucValidado = false;
    this.correoValidado = false;
    this.errorRuc = false;
    this.errorCelular = false;
    this.errorCorreo = false;
  }

  buscarEnSunat(ruc: string) {
    this.http.get<any>(`${this.URL_API}/buscar-ruc/${ruc}`).subscribe({
      next: (res) => {
        if (res && res.error_tipo === 'YA_EXISTE') {
          this.manejarRucInvalido('El RUC ya está registrado en la base de datos.');
        } else if (res && res.razonSocial) {
          this.nuevoProveedor.nombre_empresa = res.razonSocial;
          this.nuevoProveedor.direccion = res.direccion;
          this.rucValidatedYError(true, false);
        } else {
          this.manejarRucInvalido('El RUC ingresado no existe en SUNAT.');
        }
        this.cdr.detectChanges();
      },
      error: () => this.manejarRucInvalido('Error al conectar con el servicio de RUC.'),
    });
  }

  private rucValidatedYError(validado: boolean, error: boolean) {
    this.rucValidado = validado;
    this.errorRuc = error;
  }

  private manejarRucInvalido(mensaje: string) {
    this.nuevoProveedor.ruc = '';
    this.nuevoProveedor.nombre_empresa = '';
    this.nuevoProveedor.direccion = '';
    this.rucValidado = false;
    this.errorRuc = true;
    Swal.fire('Atención', mensaje, 'warning');
  }

  validarRuc() {
    let ruc = this.nuevoProveedor.ruc.replace(/\D/g, '');
    this.nuevoProveedor.ruc = ruc;
    const esFormatoCorrecto = /^(10|20)\d{9}$/.test(ruc);

    if (ruc.length === 11) {
      if (esFormatoCorrecto) {
        this.errorRuc = false;
        this.buscarEnSunat(ruc);
      } else {
        this.manejarRucInvalido('El RUC debe tener 11 dígitos y comenzar con 10 o 20.');
      }
    } else {
      this.errorRuc = ruc.length > 0 && ruc.length < 11;
      this.rucValidado = false;
    }
  }

  validarCelular() {
    let celular = this.nuevoProveedor.celular.replace(/\D/g, '');
    this.nuevoProveedor.celular = celular;
    this.errorCelular = !/^[9]\d{8}$/.test(celular);
  }

  validarCorreo() {
    this.correoValidado = false;
    this.errorCorreo = !this.correoValido;
  }

  get correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoProveedor.correo);
  }

  validarCorreoBackend() {
    if (!this.correoValido) {
      this.errorCorreo = true;
      return;
    }
    this.validandoCorreo = true;

    this.http
      .post(
        `${this.URL_API}/correo/enviar`,
        {
          correo: this.nuevoProveedor.correo,
          dni: this.nuevoProveedor.ruc,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: (res) => {
          this.validandoCorreo = false;
          if (res === 'CODIGO_ENVIADO') {
            this.solicitarCodigoYValidar();
          }
        },
        error: () => {
          this.validandoCorreo = false;
          Swal.fire('Error', 'No se pudo enviar el correo', 'error');
        },
      });
  }

  solicitarCodigoYValidar(mostrarErrorAnterior = false) {
    Swal.fire({
      title: 'Código de verificación',
      text: mostrarErrorAnterior
        ? 'Código incorrecto. Inténtalo de nuevo.'
        : 'Se envió un código a tu correo.',
      icon: mostrarErrorAnterior ? 'error' : 'info',
      input: 'text',
      inputLabel: 'Ingrese el código de 6 dígitos',
      inputAttributes: { maxlength: '6' },
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((r) => {
      if (r.isConfirmed) {
        if (!r.value || r.value.trim() === '') {
          this.solicitarCodigoYValidar(true);
          return;
        }

        this.http
          .post(
            `${this.URL_API}/correo/validar`,
            { dni: this.nuevoProveedor.ruc, codigo: r.value },
            { responseType: 'text' },
          )
          .subscribe({
            next: (res) => {
              if (res === 'CODIGO_VALIDO') {
                this.correoValidado = true;
                Swal.fire('Éxito', 'Correo verificado con éxito', 'success');
              } else {
                this.solicitarCodigoYValidar(true);
              }
            },
            error: () => {
              Swal.fire('Error', 'Hubo un problema al validar el código.', 'error');
            },
          });
      }
    });
  }

  datosValidos(): boolean {
    if (this.esEdicion) {
      return (
        !this.errorCelular &&
        !this.errorCorreo &&
        this.nuevoProveedor.nombre_empresa?.trim() !== '' &&
        this.nuevoProveedor.celular?.length === 9
      );
    }
    return this.rucValidado && this.correoValidado && !this.errorCelular && !this.errorRuc;
  }

  guardarProveedor() {
    if (!this.datosValidos()) {
      Swal.fire(
        'Atención',
        'Asegúrate de que los campos obligatorios estén llenos y tengan un formato correcto.',
        'warning',
      );
      return;
    }
    
    const obs = this.esEdicion
      ? this.http.put(
          `${this.URL_API}/actualizar/${this.idProveedorAEditar}`,
          this.nuevoProveedor,
          { responseType: 'text' },
        )
      : this.http.post(`${this.URL_API}/agregar`, this.nuevoProveedor, { responseType: 'text' });

    obs.subscribe({
      next: (mensajeExito) => {
        Swal.fire(
          'Éxito',
          this.esEdicion ? 'Proveedor actualizado con éxito' : 'Proveedor registrado exitosamente',
          'success',
        ).then(() => this.cerrarModal());
      },
      error: (err) => {
        console.error(err);
        if (err.status === 400) {
          Swal.fire(
            'Error al Guardar',
            'No se pudo procesar la solicitud. Verifique que los datos cumplan con las reglas del sistema.',
            'error',
          );
        } else {
          Swal.fire('Error de Conexión', 'No se pudo conectar con el servidor backend.', 'error');
        }
      },
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/proveedor']);
  }
}

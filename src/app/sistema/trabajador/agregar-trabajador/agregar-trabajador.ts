<<<<<<< robert/frontend-avance
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
=======
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
>>>>>>> main
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
  URL_API = 'http://localhost:8080/api/trabajadores';

  documentos: any[] = [];
  cargos: any[] = [];

  correoValidado = false;
  correoEnviado = false;
  validandoCorreo = false;

  dniValidado = false;
  errorDni = false;
  errorCelular = false;
  errorCorreo = false;

  private cdr = inject(ChangeDetectorRef);

  nuevoTrabajador: any = {
    id_documento: 1,
    numeroDocumento: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    celular: '',
    correo: '',
    id_cargo: 1,
    estado: 'Activo',
    usuario: '',
    contrasena: '',
  };

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cargarDocumentos();
    this.cargarCargos();
  }

  cargarDocumentos() {
    this.http.get<any[]>(`${this.URL_API}/documentos`).subscribe({
      next: (r) => (this.documentos = r || []),
      error: () => Swal.fire('Error', 'No se pudieron cargar documentos', 'error'),
    });
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (r) => (this.cargos = r || []),
      error: () => Swal.fire('Error', 'No se pudieron cargar cargos', 'error'),
    });
  }

  validarDni() {
    let dni = this.nuevoTrabajador.numeroDocumento.replace(/\D/g, '');
    this.nuevoTrabajador.numeroDocumento = dni;
    this.errorDni = !/^\d{8}$/.test(dni);

    // Si el DNI no es válido, desbloqueamos los campos limpiándolos
    if (this.errorDni) {
      this.dniValidado = false;
      this.nuevoTrabajador.nombre = '';
      this.nuevoTrabajador.apellido_paterno = '';
      this.nuevoTrabajador.apellido_materno = '';
      return;
    }

    this.http.get<any>(`${this.URL_API}/buscar-dni/${dni}`).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.dniValidado = true; // Al ser true, el [readonly] en HTML bloqueará los campos
          this.nuevoTrabajador.nombre = res.nombres;
          this.nuevoTrabajador.apellido_paterno = res.apellidoPaterno;
          this.nuevoTrabajador.apellido_materno = res.apellidoMaterno;
          this.cdr.detectChanges();
        } else {
          this.dniValidado = false;
          Swal.fire('DNI', 'No se encontró información', 'warning');
        }
      },
      error: () => {
        this.dniValidado = false;
        Swal.fire('DNI', 'No se encontró información', 'warning');
      },
    });
  }

  validarCelular() {
    let celular = this.nuevoTrabajador.celular.replace(/\D/g, '');
    this.nuevoTrabajador.celular = celular;
    this.errorCelular = !/^[9]\d{8}$/.test(celular);
  }

  validarCorreo() {
    this.correoValidado = false;
    this.errorCorreo = !this.correoValido;
  }

  get correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoTrabajador.correo);
  }

  validarCorreoBackend() {
    if (!this.correoValido) {
      this.errorCorreo = true;
      return;
    }
    this.validandoCorreo = true;
    // Enviamos tanto el correo como el DNI al backend
    this.http
      .post(
        `${this.URL_API}/correo/enviar`,
        {
          correo: this.nuevoTrabajador.correo,
          dni: this.nuevoTrabajador.numeroDocumento,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: (res) => {
          this.validandoCorreo = false;
          if (res === 'CODIGO_ENVIADO') {
            this.correoEnviado = true;
            Swal.fire({
              title: 'Validar correo',
              input: 'text',
              inputLabel: 'Ingrese código de 6 dígitos',
              inputAttributes: { maxlength: '6' },
              allowOutsideClick: false,
              showCancelButton: true,
            }).then((r) => {
              if (r.isConfirmed && r.value) this.validarCodigo(r.value);
            });
          }
        },
        error: () => {
          this.validandoCorreo = false;
          Swal.fire('Error', 'No se pudo enviar el correo', 'error');
        },
      });
  }

  validarCodigo(codigo: string) {
    this.http
      .post(
        `${this.URL_API}/correo/validar`,
        {
          dni: this.nuevoTrabajador.numeroDocumento, 
          codigo,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: (respuesta) => {
          if (respuesta === 'CODIGO_VALIDO') {
            this.correoValidado = true;
            Swal.fire('Correcto', 'Correo validado', 'success');
          } else {
            Swal.fire('Error', 'Código incorrecto', 'error');
          }
        },
        error: () => Swal.fire('Error', 'No se pudo validar', 'error'),
      });
  }

  datosValidos(): boolean {
    return (
      this.dniValidado &&
      this.correoValidado &&
      !this.errorCelular &&
      this.nuevoTrabajador.nombre &&
      this.nuevoTrabajador.celular
    );
  }

  guardarTrabajador() {
    if (!this.datosValidos()) {
      Swal.fire('Formulario incompleto', 'Revise todos los campos', 'warning');
      return;
    }
    this.http.post(`${this.URL_API}/crear`, this.nuevoTrabajador).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Trabajador registrado', 'success').then(() => {
          this.router.navigate(['/sistema/trabajador']);
        });
      },
      error: () => Swal.fire('Error', 'No se pudo registrar', 'error'),
    });
  }

  onCargoChange() {
    if (this.nuevoTrabajador.id_cargo !== 2 && this.nuevoTrabajador.id_cargo !== 3) {
      this.nuevoTrabajador.usuario = '';
      this.nuevoTrabajador.contrasena = '';
    }
  }

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }
}

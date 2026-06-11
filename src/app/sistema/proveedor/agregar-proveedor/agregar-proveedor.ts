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
  URL_API = 'http://localhost:8080/api/proveedores';

  esEdicion = false;
  idProveedorAEditar: number | null = null;

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
      if (params['id']) {
        this.esEdicion = true;
        this.idProveedorAEditar = +params['id'];
        this.cargarProveedor(this.idProveedorAEditar);
      }
    });
  }

  cargarProveedor(id: number) {
    this.http.get<any>(`${this.URL_API}/${id}`).subscribe({
      next: (res) => {
        if (res) {
          this.nuevoProveedor = res;
          this.rucValidado = true;
          this.correoValidado = true;
        }
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los datos', 'error'),
    });
  }

  buscarEnSunat(ruc: string) {
    // Definimos la interfaz esperada para la respuesta
    this.http
      .get<{ razonSocial: string; direccion: string }>(`${this.URL_API}/buscar-ruc/${ruc}`)
      .subscribe({
        next: (res) => {
          if (res && res.razonSocial) {
            this.nuevoProveedor.nombre_empresa = res.razonSocial;
            this.nuevoProveedor.direccion = res.direccion;
            this.rucValidado = true;
            this.errorRuc = false;
          } else {
            this.manejarRucInvalido('El RUC ingresado no existe.');
          }
          this.cdr.detectChanges();
        },
        error: () => this.manejarRucInvalido('Error al conectar con el servicio de RUC.'),
      });
  }

  private manejarRucInvalido(mensaje: string) {
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

    // Enviamos 'dni' como clave para coincidir con el Map de tu Java
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
            Swal.fire({
              title: 'Código de verificación',
              input: 'text',
              inputLabel: 'Ingrese el código de 6 dígitos',
              inputAttributes: { maxlength: '6' },
              showCancelButton: true,
            }).then((r) => {
              if (r.isConfirmed) this.validarCodigo(r.value);
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
    // Enviamos 'dni' para coincidir con tu backend
    this.http
      .post(
        `${this.URL_API}/correo/validar`,
        { dni: this.nuevoProveedor.ruc, codigo },
        { responseType: 'text' },
      )
      .subscribe({
        next: (res) => {
          if (res === 'CODIGO_VALIDO') {
            this.correoValidado = true;
            Swal.fire('Éxito', 'Correo verificado', 'success');
          } else {
            Swal.fire('Error', 'Código incorrecto', 'error');
          }
        },
      });
  }

  datosValidos(): boolean {
    return this.rucValidado && this.correoValidado && !this.errorCelular && !this.errorRuc;
  }

  guardarProveedor() {
    if (!this.datosValidos()) {
      Swal.fire(
        'Atención',
        'Asegúrate de que el RUC y el Correo estén validados (en verde).',
        'warning',
      );
      return;
    }
    const obs = this.esEdicion
      ? this.http.put(`${this.URL_API}/actualizar/${this.idProveedorAEditar}`, this.nuevoProveedor)
      : this.http.post(`${this.URL_API}/crear`, this.nuevoProveedor); 

    obs.subscribe({
      next: () => {
        Swal.fire(
          'Éxito',
          this.esEdicion ? 'Proveedor actualizado' : 'Proveedor registrado',
          'success',
        ).then(() => this.cerrarModal());
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo guardar en el servidor', 'error');
      },
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/proveedor']);
  }
}

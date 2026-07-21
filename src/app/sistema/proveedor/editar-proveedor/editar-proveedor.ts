import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-proveedor.html',
  styleUrl: './editar-proveedor.css',
})
export class EditarProveedor implements OnInit {
  URL_API = `${API_BASE_URL}/api/proveedores`;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  idProveedor!: string;
  correoOriginal = '';

  rucValidado = true;
  correoValidado = true;
  validandoCorreo = false;

  errorRuc = false;
  errorCelular = false;
  errorCorreo = false;

  proveedor: any = {
    ruc: '',
    nombre_empresa: '',
    celular: '',
    correo: '',
    direccion: '',
    estado: '',
  };

  // OBJETO NUEVO: Para guardar el estado inicial y comparar si hubo cambios
  proveedorOriginal: any = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const state = window.history.state;
      if (state?.proveedor) {
        this.proveedor = { ...state.proveedor };
        this.proveedorOriginal = { ...state.proveedor }; // Clonamos el estado inicial
        this.idProveedor = this.proveedor.ruc;
        this.correoOriginal = this.proveedor.correo;
        return;
      }
    }

    this.route.params.subscribe((params) => {
      // CORRECCIÓN: Tu ruta usa 'ruc' o 'id' según tus capturas, aceptamos ambos para asegurar la carga
      const ruc = params['ruc'] || params['id'];
      if (ruc) {
        this.idProveedor = ruc;
        this.cargarProveedor(ruc);
      }
    });
  }

  cargarProveedor(ruc: string) {
    this.http.get<any>(`${this.URL_API}/${ruc}`).subscribe({
      next: (res) => {
        this.proveedor = res;
        this.proveedorOriginal = { ...res }; // Clonamos el estado inicial de la DB
        this.correoOriginal = res.correo;
        this.rucValidado = true;
        this.correoValidado = true;
        this.cdr.detectChanges();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los datos', 'error'),
    });
  }

  validarRuc() {
    let ruc = this.proveedor.ruc.replace(/\D/g, '');
    this.proveedor.ruc = ruc;
    this.errorRuc = !(/^\d{11}$/.test(ruc) && (ruc.startsWith('10') || ruc.startsWith('20')));

    if (this.errorRuc) {
      this.rucValidado = false;
      this.proveedor.nombre_empresa = '';
      return;
    }

    this.http.get<any>(`${this.URL_API}/buscar-ruc/${ruc}`).subscribe({
      next: (res) => {
        if (res?.success) {
          this.rucValidado = true;
          this.proveedor.nombre_empresa = res.razonSocial || res.nombre_empresa;
          if (res.direccion) this.proveedor.direccion = res.direccion;
        } else {
          this.rucValidado = false;
          this.proveedor.nombre_empresa = '';
        }
      },
    });
  }

  validarCelular() {
    let celular = this.proveedor.celular.replace(/\D/g, '');
    this.proveedor.celular = celular;
    this.errorCelular = !/^[9]\d{8}$/.test(celular);
  }

  validarCorreo() {
    this.errorCorreo = !this.correoValido;
    this.correoValidado = this.proveedor.correo === this.correoOriginal;
  }

  get correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.proveedor.correo);
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
          correo: this.proveedor.correo,
          dni: this.proveedor.ruc,
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
    this.http
      .post(
        `${this.URL_API}/correo/validar`,
        {
          dni: this.proveedor.ruc,
          codigo,
        },
        { responseType: 'text' },
      )
      .subscribe({
        next: (res) => {
          if (res === 'CODIGO_VALIDO') {
            this.correoValidado = true;
            this.correoOriginal = this.proveedor.correo;
            Swal.fire('Éxito', 'Correo verificado', 'success');
          }
        },
      });
  }

  // MÉTODO NUEVO: Compara campo por campo para ver si el usuario modificó algo
  huboModificaciones(): boolean {
    if (!this.proveedorOriginal) return true;
    return (
      this.proveedor.celular !== this.proveedorOriginal.celular ||
      this.proveedor.correo !== this.proveedorOriginal.correo ||
      this.proveedor.direccion !== this.proveedorOriginal.direccion ||
      this.proveedor.estado !== this.proveedorOriginal.estado
    );
  }

  formularioEsValido(): boolean {
    return this.rucValidado && this.correoValidado && !this.errorCelular && !this.errorRuc;
  }

  actualizarProveedor() {
    if (!this.formularioEsValido()) {
      Swal.fire('Campos inválidos', 'Por favor, revise los datos en rojo.', 'warning');
      return;
    }
    if (!this.huboModificaciones()) {
      Swal.fire('Sin cambios', 'No se detectaron modificaciones para actualizar.', 'info');
      return;
    }
    this.http
      .put(`${this.URL_API}/actualizar/${this.idProveedor}`, this.proveedor, {
        responseType: 'text',
      })
      .subscribe({
        next: () => {
          Swal.fire('Éxito', 'Proveedor actualizado correctamente', 'success').then(() =>
            this.cerrarModal(),
          );
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          Swal.fire('Error', 'No se pudo actualizar el proveedor. Inténtelo de nuevo.', 'error');
        },
      });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/proveedor']);
  }
}

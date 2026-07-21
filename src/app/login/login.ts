import { API_BASE_URL } from '@config';
import { Component, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  login_validacion = true;
  ocultarContrasena = true;
  olvide_contrasena = false;
  mensaje_texto = '';
  inputBloqueados = true;
  txtusuario = '';
  txtcontrasena = '';
  txtConfirmarContrasena = '';
  codigoVerificacion = '';
  codigoEnviado = false;
  usuarioValidado = false;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}
  private URL_AUTH = `${API_BASE_URL}/api/auth`;

  check() {
    this.ocultarContrasena = !this.ocultarContrasena;
  }

  click_Olvide_contrasena() {
    Swal.fire({
      title: 'Recuperar Acceso',
      text: 'Por favor, ingresa tu nombre de usuario:',
      input: 'text',
      inputPlaceholder: 'Tu usuario aquí...',
      showCancelButton: true,
      confirmButtonText: 'Siguiente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      inputValidator: (value) => {
        if (!value) {
          return '¡Debes ingresar un usuario!';
        }
        return null;
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.txtusuario = result.value;
        this.validarUsuarioParaRecuperacion();
      }
    });
  }

  validarUsuarioParaRecuperacion() {
    // Validar usuario en el backend profesional
    this.http.get(`${this.URL_AUTH}/validar-usuario/${this.txtusuario}`).subscribe({
      next: (resp: any) => {
        if (resp.status === 'USUARIO_EXISTE') {
          this.enviarCodigo();
        }
      },
      error: (err) => {
        if (err.status === 404) {
          Swal.fire('Error', 'El usuario ingresado no existe en el sistema', 'error');
        } else {
          Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
      }
    });
  }

  enviarCodigo() {
    this.http.post(`${this.URL_AUTH}/enviar-codigo`, { username: this.txtusuario }).subscribe({
      next: (resp: any) => {
        if (resp.status === 'ERROR') {
          Swal.fire('Error', 'No se pudo enviar el código de verificación', 'error');
          return;
        }
        if (resp.status === 'CODIGO_ENVIADO') {
          this.olvide_contrasena = true;
          this.login_validacion = false;
          this.codigoEnviado = true;
          this.mensaje_texto = 'Se envió un código de 6 dígitos a tu correo electrónico (válido 15 minutos)';
          this.cdr.detectChanges();

          Swal.fire({
            title: 'Éxito',
            text: this.mensaje_texto,
            icon: 'success',
            confirmButtonColor: '#dc3545'
          });
        }
      },
      error: () => {
        Swal.fire('Error', 'No se pudo enviar el código de verificación', 'error');
      }
    });
  }

  onCodigoChange() {
    if (this.codigoVerificacion.length === 6) {
      this.validarCodigo();
    }
  }

  validarCodigo() {
    this.http.post(`${this.URL_AUTH}/validar-codigo`, {
      username: this.txtusuario,
      codigo: this.codigoVerificacion
    }).subscribe({
      next: (resp: any) => {
        if (resp.status === 'CODIGO_VALIDO') {
          this.usuarioValidado = true;
          this.inputBloqueados = false;
          Swal.fire('Validado', 'Código correcto. Ya puedes cambiar tu contraseña.', 'success');
          return;
        }
        Swal.fire('Error', 'El código ingresado es incorrecto o expiró', 'error');
        this.codigoVerificacion = '';
      },
      error: () => {
        Swal.fire('Error', 'Código incorrecto o expirado. Inténtalo de nuevo.', 'error');
        this.codigoVerificacion = '';
      }
    });
  }

  registra() {
    if (this.txtcontrasena !== this.txtConfirmarContrasena) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    this.http.post(`${this.URL_AUTH}/actualizar-password`, {
      username: this.txtusuario,
      newPassword: this.txtcontrasena
    }).subscribe({
      next: (resp: any) => {
        if (resp.status === 'ERROR') {
          Swal.fire('Error', 'No se pudo actualizar la contraseña. Valida el código primero.', 'error');
          return;
        }
        if (resp.status === 'PASSWORD_ACTUALIZADA') {
          Swal.fire({
            title: '¡Contraseña actualizada!',
            text: 'Ya puedes iniciar sesión con tu nueva clave.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
          this.olvide_contrasena = false;
          this.login_validacion = true;
          this.inputBloqueados = true;
          this.usuarioValidado = false;
          this.codigoEnviado = false;
          this.codigoVerificacion = '';
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error || 'No se pudo actualizar la contraseña', 'error');
      }
    });
  }

  login() {
    if (!this.txtusuario || !this.txtcontrasena) {
      Swal.fire('Error', 'Por favor ingresa usuario y contraseña', 'warning');
      return;
    }

    const credentials = { username: this.txtusuario, password: this.txtcontrasena };

    this.http.post(`${this.URL_AUTH}/login`, credentials).subscribe({
      next: (user: any) => {
        if (!user || !user.username) {
          Swal.fire('Error', 'Usuario o contraseña incorrectos', 'error');
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        const passwordUsada = this.txtcontrasena;
        this.txtusuario = '';
        this.txtcontrasena = '';

        // Validar si usuario y contraseña son iguales (contraseña por defecto)
        if (credentials.username === credentials.password) {
          Swal.fire({
            title: '¡Alerta de Seguridad!',
            text: 'Estás usando tu contraseña por defecto. Por seguridad, debes cambiarla antes de continuar.',
            icon: 'warning',
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Cambiar contraseña'
          }).then(() => {
            this.router.navigate(['/sistema/configuracion/actualizar-contrasena'], {
              state: { contrasenaActual: passwordUsada }
            });
          });
        } else {
          this.router.navigate(['/sistema']);
        }
      },
      error: () => {
        Swal.fire('Error', 'Usuario o contraseña incorrectos', 'error');
      },
    });
  }
}
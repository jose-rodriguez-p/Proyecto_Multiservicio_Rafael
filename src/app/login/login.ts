import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
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

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}
  private URL_API = 'http://localhost:8080/login';
  check() {
    this.ocultarContrasena = !this.ocultarContrasena;
  }

  click_Olvide_contrasena() {
    this.olvide_contrasena = true;
    this.login_validacion = false;
    var numer1 = '923093797';
    this.mensaje_texto = `Se envio un codigo de 6 digitos al siguiente numero ${numer1}`;
  }

  registra() {
    Swal.fire({
      title: '¡Contraseña actualizada con éxito!',
      text: 'Tu nueva clave de acceso ha sido registrada de forma segura en nuestro sistema. A partir de este momento, deberás utilizar esta nueva credencial para ingresar a tu cuenta. Ya puedes cerrar este aviso e iniciar sesión con total normalidad.',
      timer: 3000,
      showConfirmButton: false,
      background: 'var(--bs-success-bg-subtle)',
    });
    this.olvide_contrasena = false;
    this.login_validacion = true;
  }
  inicio_sistema() {
    if (!this.txtusuario || !this.txtcontrasena) {
      Swal.fire('Error', 'Por favor ingresa usuario y contraseña', 'warning');
      return;
    }
    const arregloCredenciales: string[] = [this.txtusuario, this.txtcontrasena];
    this.http.post(this.URL_API, arregloCredenciales, { responseType: 'text' }).subscribe({
      next: (respuesta) => {
        console.log('Respuesta del sistema Java:', respuesta);

        if (respuesta === 'OK_PROCESADO') {
          this.txtusuario = '';
          this.txtcontrasena = '';
          this.router.navigate(['/sistema']);
        } else {
          Swal.fire('Error', 'Credenciales incorrectas para el sistema', 'error');
        }
      },
      error: (err) => {
        console.error('Error de conexión:', err);
        Swal.fire('Error', 'No se pudo conectar con el backend de Spring Boot', 'error');
      },
    });
  }
}

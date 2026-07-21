import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '@config';


@Component({
  selector: 'app-actualizar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actualizar-contrasena.html',
  styleUrl: './actualizar-contrasena.css',
})
export class ActualizarContrasena implements OnInit {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef);
  private URL_API = `${API_BASE_URL}/api/configuracion`;

  contrasenaActual    = '';
  nuevaContrasena     = '';
  confirmarContrasena = '';
  actualizando        = false;

  contrasenaActualValida = false;
  validandoEnServidor    = false;
  private timeoutValidacion: any;

  verActual    = false;
  verNueva     = false;
  verConfirmar = false;

  errorActual     = false;
  errorNueva      = false;
  errorCoincide   = false;

  errorIgualActual = false;

  ngOnInit() {
    // Si venimos del login forzado por contraseña por defecto, viene la contraseña
    // usada en el navigation state. La precargamos y validamos automáticamente.
    const st: any = history.state || {};
    if (st.contrasenaActual) {
      this.contrasenaActual = st.contrasenaActual;
      this.validarActual();
    }
  }

  validarActual() {
    this.errorActual = !this.contrasenaActual.trim();

    if (this.errorActual) {
      this.contrasenaActualValida = false;
      return;
    }

    clearTimeout(this.timeoutValidacion);
    this.timeoutValidacion = setTimeout(() => {
      this.verificarPasswordActualServer();
    }, 600);
  }

  verificarPasswordActualServer() {
    if (!this.contrasenaActual.trim()) return;

    this.validandoEnServidor = true;

    const payload = {
      username: this.obtenerUsuario(),
      contrasenaActual: this.contrasenaActual
    };

    this.http.post<boolean>(`${this.URL_API}/validar-password-actual`, payload).subscribe({
      next: (esValida) => {
        this.contrasenaActualValida = esValida;
        this.errorActual = !esValida;
        this.validandoEnServidor = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.contrasenaActualValida = false;
        this.errorActual = true;
        this.validandoEnServidor = false;
        this.cdr.detectChanges();
      }
    });
  }

  validarNueva() {
    this.errorNueva =
      this.nuevaContrasena.length > 0 &&
      this.nuevaContrasena.length < 8;

    this.errorIgualActual =
      this.nuevaContrasena.length > 0 &&
      this.nuevaContrasena === this.contrasenaActual;

    if (this.confirmarContrasena) this.validarConfirmar();
  }

  validarConfirmar() {
    this.errorCoincide =
      !!this.confirmarContrasena &&
      this.confirmarContrasena !== this.nuevaContrasena;
  }

  get fortaleza(): { nivel: number; label: string; color: string } {
    const p = this.nuevaContrasena;
    if (!p) return { nivel: 0, label: '', color: '' };

    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { nivel: 1, label: 'Muy débil', color: '#e55353' };
    if (score === 2) return { nivel: 2, label: 'Débil', color: '#f9b115' };
    if (score === 3) return { nivel: 3, label: 'Regular', color: '#3399ff' };
    if (score === 4) return { nivel: 4, label: 'Fuerte', color: '#2eb85c' };
    return { nivel: 5, label: 'Muy fuerte', color: '#2eb85c' };
  }

  get formularioValido(): boolean {
    return this.contrasenaActualValida &&
      this.nuevaContrasena.length >= 8 &&
      this.confirmarContrasena === this.nuevaContrasena &&
      !this.errorActual &&
      !this.errorNueva &&
      !this.errorCoincide &&
      !this.errorIgualActual; 
  }

  obtenerUsuario(): string {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}').username || '';
    } catch { return ''; }
  }

  actualizarContrasena() {
    if (!this.formularioValido) return;

    this.actualizando = true;

    const payload = {
      username: this.obtenerUsuario(),
      newPassword: this.nuevaContrasena,
    };

    this.http.post(`${this.URL_API}/actualizar-password`, payload, { responseType: 'text' }).subscribe({
      next: (res) => {
        this.actualizando = false;

        if (res === 'PASSWORD_ACTUALIZADA') {
          Swal.fire({
            icon: 'success',
            title: '¡Contraseña actualizada!',
            text: 'Tu contraseña fue cambiada correctamente.',
            confirmButtonColor: '#dc3545'
          }).then(() => this.cerrar());

        } else {
          Swal.fire('Error', res || 'No se pudo actualizar la contraseña.', 'error');
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.actualizando = false;
        Swal.fire('Error', err?.error || 'No se pudo procesar la solicitud.', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  cerrar() {
    this.router.navigate(['/sistema/configuracion']);
  }
}
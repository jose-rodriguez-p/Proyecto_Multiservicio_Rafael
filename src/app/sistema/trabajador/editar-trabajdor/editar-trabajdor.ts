import { API_BASE_URL } from '@config';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-trabajdor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-trabajdor.html',
  styleUrl: './editar-trabajdor.css',
})
export class EditarTrabajdor implements OnInit {
  URL_API = `${API_BASE_URL}/api/trabajadores`;
  URL_ROLES = `${API_BASE_URL}/api/configuracion/roles/listar`;

  trabajadorEditando: any = {};
  trabajadorOriginal: any = {};
  cargos: any[] = [];
  roles: any[] = [];

  // Correo
  editarCorreo = false;
  correoValidado = false;
  errorCorreo = false;

  // Contraseña (solo reset)

  // Dirección estructurada
  readonly tiposVia = ['Calle', 'Avenida', 'Urbanización', 'Edificio', 'Jirón', 'Pasaje', 'Prolongación'];
  dir = { tipo: 'Calle', nombre: '', numero: '' };
  dirTocado = false;

  private cdr = inject(ChangeDetectorRef);

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const st: any = history.state || {};
    if (st.trabajador) {
      this.trabajadorEditando = { ...st.trabajador };
      this.trabajadorOriginal = { ...st.trabajador };
      this.parsearDireccion(st.trabajador.direccion || '');
    }
    this.cargarCargos();
    this.cargarRoles();
  }

  // ── CONTRASEÑA: RESET ────────────────────────────────────────────────────────

  parsearDireccion(raw: string) {
    if (!raw || raw.trim() === '-' || raw.trim() === '') return;
    const tipo = this.tiposVia.find(t => raw.toLowerCase().startsWith(t.toLowerCase()));
    if (tipo) {
      const sinTipo = raw.slice(tipo.length).trim();
      const match = sinTipo.match(/^(.*?)\s+(\S*\d\S*)$/);
      if (match) {
        this.dir = { tipo, nombre: match[1].trim(), numero: match[2].trim() };
      } else {
        this.dir = { tipo, nombre: sinTipo, numero: '' };
      }
    } else {
      this.dir = { tipo: 'Calle', nombre: raw, numero: '' };
    }
  }

  get direccionCompleta(): string {
    const partes = [this.dir.tipo, this.dir.nombre, this.dir.numero].filter(p => p?.trim());
    return partes.join(' ').trim();
  }

  get direccionValida(): boolean {
    return !!(this.dir.tipo && this.dir.nombre?.trim() && this.dir.numero?.trim());
  }

  // ── CARGOS / ROLES ───────────────────────────────────────────────────────────

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (data) => {
        this.cargos = data || [];
        if (this.trabajadorEditando.cargo) {
          const existe = this.cargos.some(
            c => c.nombre?.toLowerCase() === this.trabajadorEditando.cargo?.toLowerCase()
          );
          if (!existe) this.cargos.unshift({ id: 0, nombre: this.trabajadorEditando.cargo });
        }
        this.cdr.detectChanges();
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudieron cargar los cargos', 'error'),
    });
  }

  cargarRoles() {
    this.http.get<any[]>(this.URL_ROLES).subscribe({
      next: (data) => { this.roles = data || []; this.cdr.detectChanges(); },
      error: (err) => console.error(err),
    });
  }

  // ── CAMBIOS ──────────────────────────────────────────────────────────────────

  hayCambios(): boolean {
    const campos = ['nombre', 'apellido_paterno', 'apellido_materno', 'celular', 'correo', 'cargo', 'estado'];
    for (const c of campos) {
      if (this.trabajadorEditando[c] !== this.trabajadorOriginal[c]) return true;
    }
    if (this.direccionCompleta !== (this.trabajadorOriginal.direccion || '').trim()) return true;
    return false;
  }

  // ── CORREO ───────────────────────────────────────────────────────────────────

  toggleEditarCorreo() {
    this.editarCorreo = !this.editarCorreo;
    if (!this.editarCorreo) {
      this.trabajadorEditando.correo = this.trabajadorOriginal.correo;
      this.correoValidado = false;
      this.errorCorreo = false;
    }
  }

  validarCorreo() {
    const ok = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.trabajadorEditando.correo);
    this.errorCorreo = !ok;
    this.correoValidado = ok;
  }

  // ── CONTRASEÑA ───────────────────────────────────────────────────────────────

  // ── CONTRASEÑA: RESET ────────────────────────────────────────────────────────

  cargoRequiereContrasena(): boolean {
    const nombreCargo = this.trabajadorEditando.cargo?.toLowerCase() || '';
    if (nombreCargo === 'administrador' || nombreCargo === 'auditor') return true;
    const rol = this.roles.find((r) => r.nombre?.toLowerCase() === nombreCargo);
    return !!(rol && Array.isArray(rol.menus) && rol.menus.length > 0);
  }

  resetearContrasena() {
    const username = this.trabajadorEditando.numeroDocumento;
    const nombre = `${this.trabajadorEditando.nombre} ${this.trabajadorEditando.apellido_paterno}`;
    if (!username) {
      Swal.fire('Error', 'El trabajador no tiene documento asignado', 'error');
      return;
    }
    Swal.fire({
      title: '¿Restablecer contraseña?',
      html: `¿Está seguro que desea restablecer la contraseña de <strong>${nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .post(`${API_BASE_URL}/api/auth/resetear-password`, { username: username }, { responseType: 'text' })
          .subscribe({
            next: (res) => {
              if (res === 'PASSWORD_RESETEADA') {
                Swal.fire('Contraseña restablecida', 'La contraseña ha sido restablecida exitosamente', 'success');
              } else {
                Swal.fire('Error', 'No se pudo restablecer la contraseña', 'error');
              }
            },
            error: (err) => Swal.fire('Error', err.error || 'No se pudo restablecer la contraseña.', 'error'),
          });
      }
    });
  }

  // ── GUARDAR ──────────────────────────────────────────────────────────────────

  cerrarModal() {
    this.router.navigate(['/sistema/trabajador']);
  }

  actualizarTrabajador() {
    if (!this.hayCambios()) {
      Swal.fire('Sin cambios', 'No se ha modificado ningún dato.', 'warning');
      return;
    }
    this.dirTocado = true;
    if (!this.direccionValida) {
      Swal.fire('Dirección incompleta', 'Complete el tipo de vía, nombre y número.', 'warning');
      return;
    }
    if (this.editarCorreo && this.errorCorreo) {
      Swal.fire('Error', 'El correo no es válido.', 'error');
      return;
    }

    const payload: any = {
      nombre: this.trabajadorEditando.nombre,
      apellido_paterno: this.trabajadorEditando.apellido_paterno,
      apellido_materno: this.trabajadorEditando.apellido_materno,
      celular: this.trabajadorEditando.celular,
      correo: this.trabajadorEditando.correo,
      direccion: this.direccionCompleta,
      cargo: this.trabajadorEditando.cargo,
      estado: this.trabajadorEditando.estado,
    };

    this.http
      .put(`${this.URL_API}/actualizar/${this.trabajadorEditando.numeroDocumento}`, payload, { responseType: 'text' })
      .subscribe({
        next: () =>
          Swal.fire('Actualizado', 'Datos actualizados con éxito.', 'success').then(() =>
            this.router.navigate(['/sistema/trabajador'])
          ),
        error: (err) => Swal.fire('Error', err.error || 'No se pudo actualizar.', 'error'),
      });
  }
}
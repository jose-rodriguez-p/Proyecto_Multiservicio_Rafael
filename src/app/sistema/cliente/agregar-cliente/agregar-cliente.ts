import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  private URL_API = 'http://localhost:8080/api/clientes';

  nuevoCliente: any = { dni: '', nombre: '', apellido_paterno: '', apellido_materno: '', celular: '', correo: '', estado: 'Activo' };
  vehiculos: any[] = [];
  nuevoVehiculo: any = { placa: '', marca: '', modelo: '' };
  
  mostrarModalVehiculo = false;
  dniValidado = false;
  consultandoDni = false;
  correoValidado = false;
  validandoCorreo = false;
  errorDni = false;
  errorCelular = false;
  errorCorreo = false;

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
        } else { this.dniValidado = false; Swal.fire('Atención', 'No encontrado en RENIEC', 'info'); }
        this.cdr.detectChanges();
      },
      error: () => { this.consultandoDni = false; this.dniValidado = false; this.cdr.detectChanges(); }
    });
  }

  get esCorreoValido(): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoCliente.correo); }
  
  validarCorreoBackend() {
    if (!this.esCorreoValido) return;
    this.validandoCorreo = true;
    this.http.post(`${this.URL_API}/correo/enviar`, { correo: this.nuevoCliente.correo, dni: this.nuevoCliente.dni }, { responseType: 'text' }).subscribe({
      next: () => { 
        this.validandoCorreo = false; 
        this.cdr.detectChanges();
        this.mostrarPromptCodigo(); 
      },
      error: () => { 
        this.validandoCorreo = false; 
        this.cdr.detectChanges();
        Swal.fire('Error', 'No se pudo enviar código', 'error'); 
      }
    });
  }

  private mostrarPromptCodigo() {
    Swal.fire({ title: 'Validar Correo', input: 'text', inputAttributes: { maxlength: '6' }, showCancelButton: true, confirmButtonText: 'Validar' }).then((r) => {
      if (r.isConfirmed && r.value) this.verificarCodigo(r.value);
    });
  }

  private verificarCodigo(codigo: string) {
    this.http.post(`${this.URL_API}/correo/validar`, { dni: this.nuevoCliente.dni, codigo }, { responseType: 'text' }).subscribe({
      next: (res) => {
        if (res === 'CODIGO_VALIDO') { 
            this.correoValidado = true; 
            Swal.fire('Correcto', 'Correo verificado', 'success'); 
        } else { 
            Swal.fire('Error', 'Código incorrecto', 'error'); 
        }
        this.cdr.detectChanges();
      }
    });
  }

  agregarVehiculoLista() {
    if (!this.nuevoVehiculo.placa) return;
    this.vehiculos.push({ ...this.nuevoVehiculo });
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '' };
    this.mostrarModalVehiculo = false;
  }

  abrirModalVehiculo() { this.mostrarModalVehiculo = true; }
  cerrarModalVehiculo() { this.mostrarModalVehiculo = false; }
  eliminarVehiculo(veh: any) { this.vehiculos = this.vehiculos.filter(v => v.placa !== veh.placa); }
  validarCelular() { this.errorCelular = this.nuevoCliente.celular && !/^9\d{8}$/.test(this.nuevoCliente.celular); }
  
  guardarCliente() {
    if (!this.dniValidado || !this.correoValidado) {
        Swal.fire('Error', 'Debe validar DNI y Correo antes de continuar', 'warning');
        return;
    }
    const payload = { 
        nuevoCliente: this.nuevoCliente, 
        vehiculos: this.vehiculos 
    };
    this.http.post(`${this.URL_API}/registrar`, payload, { responseType: 'text' }).subscribe({
      next: () => { 
        Swal.fire('Guardado', 'Cliente registrado exitosamente', 'success'); 
        this.cerrarModal(); 
      },
      error: (err) => Swal.fire('Error', err.error || 'Error al registrar cliente', 'error')
    });
  }
  
  cerrarModal() { this.router.navigate(['/sistema/cliente']); }
  validarCorreo() { this.errorCorreo = this.nuevoCliente.correo && !this.esCorreoValido; }
}
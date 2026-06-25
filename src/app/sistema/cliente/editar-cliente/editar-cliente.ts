import { API_BASE_URL } from '@config';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-cliente',
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-cliente.html',
  styleUrl: './editar-cliente.css',
})
export class EditarCliente implements OnInit {
  clienteEditando: any = {};
  nuevoVehiculo: any = { placa: '', marca: '', modelo: '', anio: '' };
  mostrarModalVehiculo = false;

  // Variables de validación
  errorNombre = false;
  errorApPaterno = false;
  errorCelular = false;
  errorCorreo = false;
  errorPlaca = false;

  private URL_API = `${API_BASE_URL}/api/clientes`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const st: any = history.state || {};
    if (st.cliente) {
      this.clienteEditando = { ...st.cliente };
      if (!this.clienteEditando.vehiculos) {
        this.clienteEditando.vehiculos = [];
      }
    }
  }

  validarNombre() {
    this.errorNombre = this.clienteEditando.nombre.trim().length < 2;
  }

  validarApPaterno() {
    this.errorApPaterno = !this.clienteEditando.apellido_paterno.trim();
  }

  validarCelular() {
    const celular = this.clienteEditando.celular;
    this.errorCelular = !/^9\d{8}$/.test(celular);
  }

  validarCorreo() {
    const correo = this.clienteEditando.correo;
    if (!correo) {
      this.errorCorreo = false;
      return;
    }
    this.errorCorreo = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  validarPlaca() {
    const placa = this.nuevoVehiculo.placa;
    // Permite formatos comunes de placas como ABC-123 o ABC-1234
    this.errorPlaca = !/^[A-Z0-9]{3}-\d{3,4}$/.test(placa.toUpperCase());
  }

  clienteValido(): boolean {
    return (
      !this.errorNombre &&
      !this.errorApPaterno &&
      !this.errorCelular &&
      !this.errorCorreo &&
      this.clienteEditando.nombre.trim().length >= 2 &&
      this.clienteEditando.apellido_paterno.trim() &&
      this.clienteEditando.celular.length === 9
    );
  }

  abrirModalVehiculo() {
    // Inicialización limpia sin rastros de combustible
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '', anio: '' };
    this.errorPlaca = false;
    this.mostrarModalVehiculo = true;
  }

  cerrarModalVehiculo() {
    this.mostrarModalVehiculo = false;
  }

  guardarVehiculo() {
    if (!this.nuevoVehiculo.placa || !this.nuevoVehiculo.marca || !this.nuevoVehiculo.modelo || !this.nuevoVehiculo.anio) {
      Swal.fire('Error', 'Complete todos los campos del vehículo', 'error');
      return;
    }

    if (this.errorPlaca) {
      Swal.fire('Error', 'Formato de placa inválido', 'error');
      return;
    }

    if (!this.clienteEditando.vehiculos) {
      this.clienteEditando.vehiculos = [];
    }

    // Guardamos los datos limpios en la lista local de la edición
    this.clienteEditando.vehiculos.push({ ...this.nuevoVehiculo });
    this.cerrarModalVehiculo();
    Swal.fire('Agregado', 'Vehículo añadido correctamente', 'success');
  }

  eliminarVehiculo(vehiculo: any) {
    Swal.fire({
      title: '¿Eliminar vehículo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.clienteEditando.vehiculos = this.clienteEditando.vehiculos.filter(
          (v: any) => v.placa !== vehiculo.placa
        );
        Swal.fire('Eliminado', 'Vehículo eliminado', 'success');
      }
    });
  }

  obtenerUsuarioLogueado(): string {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.username || '';
    } catch { return ''; }
  }

  guardarCambios() {
    if (!this.clienteValido()) {
      Swal.fire('Error', 'Complete los campos obligatorios correctamente', 'error');
      return;
    }

    const payload = {
      dni: this.clienteEditando.dni,
      nombre: this.clienteEditando.nombre,
      apellido_paterno: this.clienteEditando.apellido_paterno,
      apellido_materno: this.clienteEditando.apellido_materno,
      celular: this.clienteEditando.celular,
      correo: this.clienteEditando.correo,
      estado: this.clienteEditando.estado,
      usuario_logueado: this.obtenerUsuarioLogueado(),
      carros_json: this.clienteEditando.vehiculos || []
    };

    console.log('Enviando actualización de cliente al backend:', payload);

    this.http.put(`${this.URL_API}/actualizar/${this.clienteEditando.dni}`, payload).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'Datos del cliente actualizados con éxito', 'success');
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar cliente:', err);
        Swal.fire('Error', 'No se pudo actualizar el cliente', 'error');
      }
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/cliente']);
  }
}
import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
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
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private http: HttpClient,
    private router: Router
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
    this.errorPlaca = !/^[A-Z0-9]{3}-\d{3,4}$/.test(placa.toUpperCase());
  }

  clienteValido(): boolean {
    return (
      !this.errorNombre &&
      !this.errorApPaterno &&
      !this.errorCelular &&
      this.clienteEditando.nombre.trim().length >= 2 &&
      this.clienteEditando.apellido_paterno.trim() &&
      String(this.clienteEditando.celular).length === 9
    );
  }

  abrirModalVehiculo() {
    this.nuevoVehiculo = { placa: '', marca: '', modelo: '', anio: '' };
    this.errorPlaca = false;
    this.mostrarModalVehiculo = true;
  }

  cerrarModalVehiculo() {
    this.mostrarModalVehiculo = false;
  }

  guardarVehiculo() {
    console.log('Guardando vehículo:', this.nuevoVehiculo);
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

    const placaNueva = this.nuevoVehiculo.placa.toUpperCase().trim();
    const yaExiste = this.clienteEditando.vehiculos.some(
      (v: any) => v.placa.toUpperCase().trim() === placaNueva
    );
    if (yaExiste) {
      Swal.fire('Placa duplicada', 'Este cliente ya tiene registrado un vehículo con esa placa.', 'warning');
      return;
    }

    // Insertar el vehículo de forma reactiva clonando el arreglo
    this.clienteEditando.vehiculos = [...this.clienteEditando.vehiculos, { ...this.nuevoVehiculo }];
    console.log('Vehículos después de agregar:', this.clienteEditando.vehiculos);
    this.cdr.detectChanges();
    this.cerrarModalVehiculo();
    Swal.fire('Agregado', 'Vehículo añadido correctamente', 'success');
  }

  eliminarVehiculo(vehiculo: any) {
    console.log('Intentando eliminar vehículo:', vehiculo);
    console.log('Lista actual antes de eliminar:', this.clienteEditando.vehiculos);
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
        // Filtrar y asignar rompiendo la referencia anterior para obligar a Angular a redibujar al instante
        const listaFiltrada = this.clienteEditando.vehiculos.filter(
          (v: any) => v.placa !== vehiculo.placa
        );
        this.clienteEditando.vehiculos = [...listaFiltrada];
        console.log('Lista después de eliminar:', this.clienteEditando.vehiculos);
        this.cdr.detectChanges();

        Swal.fire('Eliminado', 'Vehículo eliminado', 'success');
      }
    });
  }

  guardarCambios() {
    console.log('=== INICIANDO GUARDADO DE CLIENTE ===');
    console.log('Cliente editando:', this.clienteEditando);
    console.log('Vehículos:', this.clienteEditando.vehiculos);

    if (!this.clienteValido()) {
      Swal.fire('Error', 'Complete los campos obligatorios correctamente', 'error');
      return;
    }

    // Estructura del Payload mapeado idéntico a lo que Spring Boot procesa en el Map
    const payload = {
      cliente: {
        dni: this.clienteEditando.dni,
        nombre: this.clienteEditando.nombre,
        apellido_paterno: this.clienteEditando.apellido_paterno,
        apellido_materno: this.clienteEditando.apellido_materno || '',
        celular: this.clienteEditando.celular,
        correo: this.clienteEditando.correo || '',
        estado: this.clienteEditando.estado
      },
      carros: this.clienteEditando.vehiculos.map((v: any) => ({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        anio: String(v.anio)
      }))
    };

    console.log('Payload enviado al backend:', JSON.stringify(payload, null, 2));

    // Petición HTTP PUT enviando los datos organizados en el Body
    this.http.put<any>(`${this.URL_API}/actualizar`, payload).subscribe({
      next: (res) => {
        console.log('Respuesta del backend:', res);
        if (res && res.status === 'editado') {
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'Cliente actualizado correctamente'
          }).then(() => {
            this.cerrarModal();
          });
        } else {
          const mensajeErr = res?.status || 'No se pudo actualizar el cliente';
          console.error('Error en respuesta:', mensajeErr);
          Swal.fire('Error', mensajeErr, 'error');
        }
      },
      error: (err) => {
        console.error('ERROR REAL:', err);
        console.error('Error body:', err.error);
        const detalleError = err.error?.status || 'No se pudo actualizar el cliente';
        Swal.fire('Error', detalleError, 'error');
      }
    });
  }

  cerrarModal() {
    this.router.navigate(['/sistema/cliente']);
  }
}
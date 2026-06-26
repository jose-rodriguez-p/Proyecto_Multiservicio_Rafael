import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-marcas.html',
  styleUrl: './agregar-marcas.css',
})
export class AgregarMarcas implements OnInit {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  nombre = '';
  estado = 'Activo';
  errorNombre = false;
  mensajeError = '';
  categoriasSeleccionadas: number[] = [];

  // Simulado — reemplazar con http.get('/api/productos/categorias')
  categorias: any[] = [
    { id: 1, nombre: 'Lubricantes' },
    { id: 2, nombre: 'Frenos' },
    { id: 3, nombre: 'Filtros' },
    { id: 4, nombre: 'Llantas' },
    { id: 5, nombre: 'Baterías' },
    { id: 6, nombre: 'Suspensión' },
    { id: 7, nombre: 'Electricidad' },
  ];

  marcasExistentes: string[] = ['Castrol', 'Mobil', 'Shell', 'Brembo', 'Bosch', 'Mann', 'Fram', 'Bridgestone', 'Michelin', 'Monroe'];

  ngOnInit() {}

  validar() {
    const v = this.nombre.trim();
    if (!v) {
      this.errorNombre = true;
      this.mensajeError = 'El nombre no puede estar vacío.';
      return;
    }
    if (v.length < 2) {
      this.errorNombre = true;
      this.mensajeError = 'El nombre debe tener al menos 2 caracteres.';
      return;
    }
    if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ0-9\s\-\.&]+$/.test(v)) {
      this.errorNombre = true;
      this.mensajeError = 'Solo se permiten letras, números, espacios, guiones y puntos.';
      return;
    }
    if (this.marcasExistentes.some(m => m.toLowerCase() === v.toLowerCase())) {
      this.errorNombre = true;
      this.mensajeError = 'Ya existe una marca con ese nombre.';
      return;
    }
    this.errorNombre = false;
    this.mensajeError = '';
  }

  toggleCategoria(id: number) {
    const idx = this.categoriasSeleccionadas.indexOf(id);
    if (idx === -1) this.categoriasSeleccionadas.push(id);
    else this.categoriasSeleccionadas.splice(idx, 1);
  }

  isSeleccionada(id: number): boolean {
    return this.categoriasSeleccionadas.includes(id);
  }

  get formularioValido(): boolean {
    return !!this.nombre.trim() && !this.errorNombre && this.categoriasSeleccionadas.length > 0;
  }

  guardar() {
    this.validar();
    if (!this.formularioValido) return;

    this.cerrar();
    setTimeout(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Marca agregada!',
        text: `"${this.nombre.trim()}" fue registrada correctamente.`,
        confirmButtonColor: '#b91c1c',
        confirmButtonText: 'Aceptar',
        timer: 2000,
        timerProgressBar: true,
      });
    }, 150);
  }

  cancelar() { this.cerrar(); }
  cerrar() { this.router.navigate(['/sistema/configuracion/marcas']); }
}
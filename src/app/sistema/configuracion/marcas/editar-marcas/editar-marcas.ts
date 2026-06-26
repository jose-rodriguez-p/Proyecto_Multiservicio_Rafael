import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-marcas.html',
  styleUrl: './editar-marcas.css',
})
export class EditarMarcas implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  nombre = '';
  nombreOriginal = '';
  estado = 'Activo';
  errorNombre = false;
  mensajeError = '';
  categoriasSeleccionadas: number[] = [];
  marcaId: any = null;

  categorias: any[] = [
    { id: 1, nombre: 'Lubricantes' },
    { id: 2, nombre: 'Frenos' },
    { id: 3, nombre: 'Filtros' },
    { id: 4, nombre: 'Llantas' },
    { id: 5, nombre: 'Baterías' },
    { id: 6, nombre: 'Suspensión' },
    { id: 7, nombre: 'Electricidad' },
  ];

  // Simulado — reemplazar con http.get('/api/marcas')
  private todasMarcas: any[] = [
    { id: 1,  nombre: 'Castrol',     id_categoria: 1, estado: 'Activo'   },
    { id: 2,  nombre: 'Mobil',       id_categoria: 1, estado: 'Activo'   },
    { id: 3,  nombre: 'Shell',       id_categoria: 1, estado: 'Activo'   },
    { id: 4,  nombre: 'Brembo',      id_categoria: 2, estado: 'Activo'   },
    { id: 5,  nombre: 'Bosch',       id_categoria: 2, estado: 'Activo'   },
    { id: 6,  nombre: 'Mann',        id_categoria: 3, estado: 'Activo'   },
    { id: 7,  nombre: 'Fram',        id_categoria: 3, estado: 'Inactivo' },
    { id: 8,  nombre: 'Bridgestone', id_categoria: 4, estado: 'Activo'   },
    { id: 9,  nombre: 'Michelin',    id_categoria: 4, estado: 'Activo'   },
    { id: 10, nombre: 'Bosch',       id_categoria: 5, estado: 'Activo'   },
    { id: 11, nombre: 'Monroe',      id_categoria: 6, estado: 'Inactivo' },
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.marcaId = Number(this.route.snapshot.paramMap.get('id'));
      const marca = this.todasMarcas.find(m => m.id === this.marcaId);
      if (marca) {
        this.nombre = marca.nombre;
        this.nombreOriginal = marca.nombre;
        this.estado = marca.estado;
        this.categoriasSeleccionadas = [marca.id_categoria];
      }
    }
  }

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
    if (v.toLowerCase() === this.nombreOriginal.toLowerCase()) {
      this.errorNombre = false;
      return;
    }
    const existe = this.todasMarcas.some(m => m.id !== this.marcaId && m.nombre.toLowerCase() === v.toLowerCase());
    if (existe) {
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

  isSeleccionada(id: number): boolean { return this.categoriasSeleccionadas.includes(id); }

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
      title: '¡Marca actualizada!',
      text: `"${this.nombre.trim()}" fue guardada correctamente.`,
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
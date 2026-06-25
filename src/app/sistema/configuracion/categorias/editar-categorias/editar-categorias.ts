import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-categorias.html',
  styleUrl: './editar-categorias.css',
})
export class EditarCategorias implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private URL = `${API_BASE_URL}/api/productos/categorias`;

  nombre = '';
  nombreOriginal = '';
  error = false;
  mensajeError = '';
  categoriasExistentes: string[] = [];
  categoriaId: any = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.categoriaId = this.route.snapshot.paramMap.get('id');
      this.cargarDatos();
    }
  }

  cargarDatos() {
    // Simulación — reemplazar por llamada real:
    // this.http.get<any>(`${this.URL}/${this.categoriaId}`).subscribe(...)
    const simulados: any = {
      '1': 'Lubricantes', '2': 'Frenos', '3': 'Filtros',
      '4': 'Llantas',     '5': 'Baterías'
    };
    this.categoriasExistentes = Object.values(simulados);
    this.nombreOriginal = simulados[this.categoriaId] ?? '';
    this.nombre = this.nombreOriginal;
  }

  validar() {
    const v = this.nombre.trim();
    if (!v) {
      this.error = true;
      this.mensajeError = 'El nombre no puede estar vacío.';
      return;
    }
    if (v.toLowerCase() === this.nombreOriginal.toLowerCase()) {
      this.error = true;
      this.mensajeError = 'El nombre es igual al actual.';
      return;
    }
    const existe = this.categoriasExistentes.some(
      c => c.toLowerCase() === v.toLowerCase()
    );
    if (existe) {
      this.error = true;
      this.mensajeError = 'Ya existe una categoría con ese nombre.';
      return;
    }
    this.error = false;
    this.mensajeError = '';
  }

  guardar() {
    this.validar();
    if (this.error || !this.nombre.trim()) return;

    // Simulación — reemplazar por:
    // this.http.put(`${this.URL}/${this.categoriaId}`, { nombre: this.nombre.trim() }, { responseType: 'text' }).subscribe(...)
    Swal.fire({
      icon: 'success',
      title: '¡Categoría actualizada!',
      text: `"${this.nombre.trim()}" fue guardada correctamente.`,
      confirmButtonColor: '#b91c1c',
      confirmButtonText: 'Aceptar',
    }).then(() => this.cerrar());
  }

  cancelar() { this.cerrar(); }
  cerrar() { this.router.navigate(['/sistema/configuracion/categorias']); }
}
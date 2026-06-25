import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-categorias.html',
  styleUrl: './agregar-categorias.css',
})
export class AgregarCategorias implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private URL = `${API_BASE_URL}/api/productos/categorias`;

  nombre = '';
  error = false;
  mensajeError = '';
  categoriasExistentes: string[] = [];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.cargarExistentes();
  }

  cargarExistentes() {
    // Simulación — reemplazar por: this.http.get<string[]>(this.URL).subscribe(...)
    this.categoriasExistentes = ['Lubricantes', 'Frenos', 'Filtros', 'Llantas', 'Baterías'];
  }

  validar() {
    const v = this.nombre.trim();
    if (!v) {
      this.error = true;
      this.mensajeError = 'El nombre no puede estar vacío.';
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

    // Simulación — reemplazar por llamada real al back:
    // this.http.post(this.URL, { nombre: this.nombre.trim() }, { responseType: 'text' }).subscribe(...)
    Swal.fire({
      icon: 'success',
      title: '¡Categoría agregada!',
      text: `"${this.nombre.trim()}" fue registrada correctamente.`,
      confirmButtonColor: '#b91c1c',
      confirmButtonText: 'Aceptar',
    }).then(() => this.cerrar());
  }

  cancelar() { this.cerrar(); }
  cerrar() { this.router.navigate(['/sistema/configuracion/categorias']); }
}
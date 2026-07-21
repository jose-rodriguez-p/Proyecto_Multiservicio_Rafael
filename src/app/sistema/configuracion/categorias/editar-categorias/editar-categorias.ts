import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private cdr = inject(ChangeDetectorRef);

  nombre = '';
  nombreOriginal = '';
  estado = 'Activo';
  estadoOriginal = 'Activo';

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
    this.http.get<any[]>(`${API_BASE_URL}/api/configuracion/listar-categorias`)
      .subscribe({
        next: (data) => {

          const list = data || [];

          this.categoriasExistentes = list.map(c => c.nombre);

          const cat = list.find(c =>
            c.nombre.toLowerCase() === this.categoriaId?.toLowerCase()
          );

          if (cat) {
            this.nombre = cat.nombre;
            this.nombreOriginal = cat.nombre;
            this.estado = cat.estado;
            this.estadoOriginal = cat.estado;
          }

          this.cdr.detectChanges();
        }
      });
  }

  validar() {
    const v = this.nombre.trim();

    if (!v) {
      this.error = true;
      this.mensajeError = 'Nombre vacío';
      return;
    }

    this.error = false;
  }

  // 🔥 AQUÍ ESTÁ LA CLAVE
  guardar() {

    const params = new HttpParams()
      .set('nombreCategoria', this.nombreOriginal)
      .set('nuevoEstado', this.estado);

    this.http.put(
      `${API_BASE_URL}/api/configuracion/categorias/estado`,
      {}, // body vacío obligatorio
      {
        params,
        responseType: 'text' // 🔥 CLAVE PARA EVITAR ERROR DE PARSEO
      }
    ).subscribe({

      next: (res) => {
        console.log('RESPUESTA:', res);

        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Categoría actualizada correctamente'
        }).then(() => {
          this.cerrar();
        });
      },

      error: (err) => {
        console.log('ERROR REAL:', err);

        Swal.fire(
          'Error',
          err.error || 'No se pudo actualizar',
          'error'
        );
      }
    });
  }

  cancelar() {
    this.cerrar();
  }

  cerrar() {
    this.router.navigate(['/sistema/configuracion/categorias']);
  }
}
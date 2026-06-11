import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trabajador',
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './trabajador.html',
  styleUrl: './trabajador.css',
})
export class Trabajador implements OnInit {
  mostrarModal = false;
  mostrarModalEdit = false;
  mostrarCamposUsuario = false;
  filtroBusqueda: string = '';
  cargoSeleccionado: string = '';
  trabajadores: any[] = [];
  documentos: any[] = [];
  cargos: any[] = [];
  // Menús y selección para asignar permisos
  menus: any[] = [];
  selectedMenus: any[] = [];
  mostrarModalMenus = false;
  trabajadorSeleccionado: any = null;
  trabajadorEditando: any = {};

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private router = inject(Router);

  private URL_API = 'http://localhost:8080/api/trabajadores';

  constructor() {
    this.router.events.subscribe((ev: any) => {
      // show modal when child route active
      const url = this.router.url || '';
      const isModalRoute =
        url.includes('/sistema/trabajador/agregar-trabajador') ||
        url.includes('/sistema/trabajador/editar-trabajador');
      if (isModalRoute) {
        this.mostrarModal = true;
      } else {
        // closed modal -> refresh list
        const wasOpen = this.mostrarModal;
        this.mostrarModal = false;
        if (wasOpen) this.cargarTrabajadores();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarTrabajadores();
      this.cargarDocumentos();
      this.cargarCargos();
    }
  }

  /** Cargar la lista de menús desde el backend. Endpoint esperado: /api/menus */
  cargarMenus() {
    // Ajusta la URL si tu backend expone otro endpoint para menus
    this.http.get<any[]>('http://localhost:8080/api/menus').subscribe({
      next: (data) => {
        this.menus = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar menus:', err),
    });
  }

  /** Abrir modal para asignar menús a un trabajador (solo Admin/Vendedor) */
  abrirModalMenus(trab: any) {
    this.trabajadorSeleccionado = trab;
    this.selectedMenus = [];
    // Cargar menus si aún no están cargados
    if (!this.menus || this.menus.length === 0) {
      this.cargarMenus();
    }
    // Si el trabajador ya trae menus asignados, cargar la selección
    if (trab.menus && Array.isArray(trab.menus)) {
      this.selectedMenus = trab.menus.map((m: any) => m.id);
    } else if (trab.menuIds && Array.isArray(trab.menuIds)) {
      this.selectedMenus = trab.menuIds.slice();
    }
    this.mostrarModalMenus = true;
  }

  cerrarModalMenus() {
    this.mostrarModalMenus = false;
    this.trabajadorSeleccionado = null;
  }

  toggleMenuSeleccion(menuId: any) {
    const idNum = Number(menuId);
    const idx = this.selectedMenus.indexOf(idNum);
    if (idx === -1) this.selectedMenus.push(idNum);
    else this.selectedMenus.splice(idx, 1);
  }

  /** Guardar menús asignados al trabajador en el backend */
  guardarMenusAsignados() {
    if (!this.trabajadorSeleccionado) return;
    const payload = { menuIds: this.selectedMenus };
    const url = `${this.URL_API}/${this.trabajadorSeleccionado.numeroDocumento}/menus`;
    this.http.post(url, payload).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Permisos de menú actualizados', 'success');
        this.cerrarModalMenus();
        // refrescar la lista para ver cambios
        this.cargarTrabajadores();
      },
      error: (err) => {
        console.error('Error guardando menus:', err);
        Swal.fire('Error', 'No se pudieron guardar los permisos', 'error');
      },
    });
  }

  cargarTrabajadores() {
    this.http.get<any[]>(`${this.URL_API}/listar`).subscribe({
      next: (data) => {
        this.trabajadores = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar trabajadores:', err),
    });
  }

  cargarDocumentos() {
    this.http.get<any[]>(`${this.URL_API}/documentos`).subscribe({
      next: (data) => {
        this.documentos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar documentos:', err),
    });
  }

  cargarCargos() {
    this.http.get<any[]>(`${this.URL_API}/cargos`).subscribe({
      next: (data) => {
        this.cargos = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar cargos:', err),
    });
  }

  onCargoChange() {
    // Mostrar campos de usuario solo si se selecciona "Administrador" o "Vendedor"
    this.mostrarCamposUsuario =
      this.cargoSeleccionado === 'Administrador' || this.cargoSeleccionado === 'Vendedor';
  }

  aplicarFiltros() {
    const q = (this.filtroBusqueda || '').toString().trim().toLowerCase();
    const qNorm = this.normalizeString(q);
    let list = this.trabajadores.slice();
    if (this.cargoSeleccionado && this.cargoSeleccionado !== '') {
      list = list.filter((t: any) => String(t.id_cargo) === String(this.cargoSeleccionado));
    }
    if (q) {
      list = list.filter((t: any) => {
        const dni = this.normalizeString((t.numeroDocumento || '').toString().toLowerCase());
        const nombre = this.normalizeString((t.nombre || '').toString().toLowerCase());
        const ap = this.normalizeString((t.apellido_paterno || '').toString().toLowerCase());
        const am = this.normalizeString((t.apellido_materno || '').toString().toLowerCase());
        return (
          dni.includes(qNorm) || nombre.includes(qNorm) || ap.includes(qNorm) || am.includes(qNorm)
        );
      });
    }
    this.cdr.detectChanges();
  }

  get filteredList() {
    let list = this.trabajadores.slice();

    // Filtrar por cargo - comparar por nombre del cargo
    if (this.cargoSeleccionado && this.cargoSeleccionado !== '') {
      list = list.filter((t: any) => {
        // Comparación directa del nombre del cargo
        if (t.cargo === this.cargoSeleccionado) {
          return true;
        }
        // Si no coincide directamente, normalizar y comparar (por si hay diferencias de acentos)
        const cargoNorm = this.normalizeString((t.cargo || '').toString().toLowerCase());
        const seleccionNorm = this.normalizeString(this.cargoSeleccionado.toLowerCase());
        return cargoNorm === seleccionNorm;
      });
    }

    // Filtrar por búsqueda de texto
    if (this.filtroBusqueda && this.filtroBusqueda.trim() !== '') {
      const q = this.filtroBusqueda.toLowerCase();
      const qNorm = this.normalizeString(q);
      list = list.filter((t: any) => {
        return (
          (t.numeroDocumento &&
            this.normalizeString(String(t.numeroDocumento).toLowerCase()).includes(qNorm)) ||
          (t.nombre && this.normalizeString(t.nombre.toLowerCase()).includes(qNorm)) ||
          (t.apellido_paterno &&
            this.normalizeString(t.apellido_paterno.toLowerCase()).includes(qNorm)) ||
          (t.apellido_materno &&
            this.normalizeString(t.apellido_materno.toLowerCase()).includes(qNorm))
        );
      });
    }
    return list;
  }

  /** Remove diacritics and normalize string for comparison */
  normalizeString(s: string) {
    if (!s) return '';
    // Normalize and remove combining diacritical marks (tildes, accents)
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  abrirModal() {
    this.mostrarModal = true;
    this.router.navigate(['/sistema/trabajador/agregar-trabajador']);
    this.mostrarCamposUsuario = false;
  }

  cerrarModal() {
    this.mostrarModal = false;
    // navigate back to parent route to close child route
    this.router.navigate(['/sistema/trabajador']);
  }

  abrirModalEdit(trabajador: any) {
    this.trabajadorEditando = { ...trabajador };
    this.mostrarModalEdit = true;
    // navigate to edit child route passing state
    this.router.navigate(['/sistema/trabajador/editar-trabajador'], { state: { trabajador } });
  }

  cerrarModalEdit() {
    this.mostrarModalEdit = false;
    this.router.navigate(['/sistema/trabajador']);
  }

  descargarCSV(filename: string, rows: any[]) {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(',')]
      .concat(rows.map((r) => keys.map((k) => '"' + (r[k] ?? '') + '"').join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportarExcel() {
    const payload = this.filteredList.map((t) => ({
      numeroDocumento: t.numeroDocumento,
      nombre: t.nombre,
      apellido_paterno: t.apellido_paterno || '',
      apellido_materno: t.apellido_materno || '',
      cargo: t.cargo,
      estado: t.estado,
      fecha_registro: t.fecha ? `${t.fecha} ${t.hora || ''}`.trim() : 'No registrada',
    }));

    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/excel`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Trabajadores_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte de Excel corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar Excel:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga de Excel', 'error');
      },
    });
  }

  exportarPDF() {
    const payload = this.filteredList.map((t) => ({
      numeroDocumento: t.numeroDocumento,
      nombre: t.nombre,
      apellido_paterno: t.apellido_paterno || '',
      apellido_materno: t.apellido_materno || '',
      cargo: t.cargo,
      estado: t.estado,
      fecha_registro: t.fecha ? `${t.fecha} ${t.hora || ''}`.trim() : 'No registrada',
    }));

    if (!payload || payload.length === 0) {
      Swal.fire('Atención', 'No hay registros en la tabla para exportar', 'info');
      return;
    }
    this.http.post(`${this.URL_API}/export/pdf`, payload, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().getTime();
        link.download = `Reporte_Trabajadores_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        Swal.fire('¡Éxito!', 'El reporte PDF corporativo se ha descargado', 'success');
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        Swal.fire('Error', 'El servidor no pudo procesar la descarga del PDF', 'error');
      },
    });
  }

  private printPdfFallback() {
    const rows = this.filteredList;
    let html =
      '<html><head><title>Trabajadores</title><style>table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ccc;padding:6px;text-align:left;}th{background:#eee;}</style></head><body>';
    html += '<h3>Listado de Trabajadores</h3>';
    html +=
      '<table><thead><tr><th>Documento</th><th>Nombre</th><th>Apellido Paterno</th><th>Apellido Materno</th><th>Cargo</th><th>Celular</th><th>Correo</th><th>Estado</th></tr></thead><tbody>';
    rows.forEach((t: any) => {
      html += `<tr><td>${t.numeroDocumento ?? ''}</td><td>${t.nombre ?? ''}</td><td>${t.apellido_paterno ?? ''}</td><td>${t.apellido_materno ?? ''}</td><td>${t.cargo ?? ''}</td><td>${t.celular ?? ''}</td><td>${t.correo ?? ''}</td><td>${t.estado ?? ''}</td></tr>`;
    });
    html += '</tbody></table></body></html>';
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        w.print();
      }, 500);
    } else {
      Swal.fire(
        'Error',
        'No se pudo abrir la ventana de impresión. Revisa el bloqueador de pop-ups.',
        'error',
      );
    }
  }

  // Confirmación para eliminar (desactivar) un trabajador.

  eliminarTrabajador(id: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff3b30',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // call backend delete
        this.http.delete(`${this.URL_API}/` + id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El trabajador ha sido eliminado del sistema', 'success');
            this.cargarTrabajadores();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar el trabajador', 'error');
          },
        });
      }
    });
  }
}

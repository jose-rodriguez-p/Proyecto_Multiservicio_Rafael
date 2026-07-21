import { API_BASE_URL } from '@config';
import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface CajaActual {
  id_cierre_caja: number;
  fec_apertura: string;
  saldo_inicial: number;
}

@Component({
  selector: 'app-servicio',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './servicio.html',
  styleUrl: './servicio.css',
})
export class Servicio implements OnInit {
  private router     = inject(Router);
  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr        = inject(ChangeDetectorRef);

  private URL_CAJA = `${API_BASE_URL}/api/caja`;

  // --- Estado general de caja (apertura/cierre para Venta y Mantenimiento) ---
  cargandoCaja = true;
  cajaAbierta = false;
  cajaActual: CajaActual | null = null;

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(() => {
      if (isPlatformBrowser(this.platformId) && !this.hasChildRoute()) {
        this.cargarEstadoCaja();
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarEstadoCaja();
    }
  }

  hasChildRoute() {
    return this.router.url.split('/').length > 3;
  }

  // --- Ventana de control de caja (apertura/cierre general) ---

  cargarEstadoCaja() {
    this.cargandoCaja = true;
    this.http.get<any>(`${this.URL_CAJA}/estado`).subscribe({
      next: (res) => {
        this.cajaAbierta = !!res?.abierta;
        this.cajaActual = res?.caja || null;
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoCaja = false;
        this.cdr.detectChanges();
      },
    });
  }

  abrirCaja() {
    Swal.fire({
      title: 'Abrir caja',
      html: `<p class="text-muted small mb-2">Ingresa el monto en efectivo con el que inicias el turno. Esta caja se usará tanto para Ventas como para Mantenimientos.</p>`,
      input: 'number',
      inputLabel: 'Saldo inicial (S/)',
      inputValue: 0,
      inputAttributes: { min: '0', step: '0.10' },
      showCancelButton: true,
      confirmButtonText: 'Abrir caja',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => (value === '' || Number(value) < 0) ? 'Ingresa un monto válido' : undefined,
    }).then((res) => {
      if (!res.isConfirmed) return;
      const saldoInicial = Number(res.value);
      this.http.post<any>(`${this.URL_CAJA}/abrir`, { saldo_inicial: saldoInicial }).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Caja abierta', timer: 1500, showConfirmButton: false });
          this.cargarEstadoCaja();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo abrir la caja', 'error'),
      });
    });
  }

  cerrarCaja() {
    if (!this.cajaActual) return;
    const idCierreCaja = this.cajaActual.id_cierre_caja;

    this.http.get<any>(`${this.URL_CAJA}/${idCierreCaja}/resumen`).subscribe({
      next: (resumen) => {
        const totSistema: number = resumen.tot_ventas_sistema || 0;
        Swal.fire({
          title: 'Cerrar caja',
          html: `
            <div class="text-start small">
              <p class="mb-1">Ventas contabilizadas: <b>${resumen.cantidad_ventas || 0}</b></p>
              <p class="mb-1">Mantenimientos contabilizados: <b>${resumen.cantidad_mantenimientos || 0}</b></p>
              <p class="mb-3">Total según sistema: <b>S/ ${totSistema.toFixed(2)}</b></p>
              <label class="form-label small mb-1">Efectivo contado en caja (S/)</label>
            </div>`,
          input: 'number',
          inputValue: totSistema.toFixed(2),
          inputAttributes: { min: '0', step: '0.10' },
          showCancelButton: true,
          confirmButtonText: 'Cerrar caja',
          confirmButtonColor: '#dc3545',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => (value === '' || Number(value) < 0) ? 'Ingresa un monto válido' : undefined,
        }).then((res) => {
          if (!res.isConfirmed) return;
          const totCajero = Number(res.value);
          this.http.post<any>(`${this.URL_CAJA}/${idCierreCaja}/cerrar`, { tot_ventas_cajero: totCajero }).subscribe({
            next: () => {
              const diferencia = totCajero - totSistema;
              const cuadrada = Math.abs(diferencia) < 0.01;
              Swal.fire({
                icon: cuadrada ? 'success' : 'warning',
                title: cuadrada ? 'Caja cuadrada' : (diferencia > 0 ? 'Hay sobrante' : 'Hay faltante'),
                text: cuadrada ? 'El monto contado coincide con el sistema.' : `Diferencia: S/ ${Math.abs(diferencia).toFixed(2)}`,
                confirmButtonText: 'Descargar comprobante',
                confirmButtonColor: '#dc3545',
              }).then(() => this.descargarComprobanteCierre(idCierreCaja));
              this.cargarEstadoCaja();
            },
            error: (err) => Swal.fire('Error', err.error?.message || 'No se pudo cerrar la caja', 'error'),
          });
        });
      },
      error: () => Swal.fire('Error', 'No se pudo obtener el resumen de caja', 'error'),
    });
  }

  descargarComprobanteCierre(idCierreCaja: number) {
    this.http.get(`${this.URL_CAJA}/${idCierreCaja}/comprobante`, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Cierre_Caja_${idCierreCaja}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: () => Swal.fire('Error', 'No se pudo generar el comprobante de cierre', 'error'),
    });
  }

  irA(destino: 'ventas' | 'mantenimiento' | 'reporte-general') {
    this.router.navigate(['/sistema/servicio', destino]);
  }
}
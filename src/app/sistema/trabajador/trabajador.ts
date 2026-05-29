import { Component } from '@angular/core';
import {Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-trabajador',
  imports: [RouterOutlet],
  templateUrl: './trabajador.html',
  styleUrl: './trabajador.css',
})
export class Trabajador {
  constructor(private router: Router) {}
  //variable que controla la apertura del modal,
  agregarTrabajador(){
    this.router.navigate(['/sistema/trabajador/agregar-trabajador']);
  }

}

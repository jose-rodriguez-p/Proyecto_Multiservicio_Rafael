import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-servicio',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './servicio.html',
  styleUrl: './servicio.css',
})
export class Servicio {
  constructor(private router: Router) {}

  hasChildRoute() {
    return this.router.url.split('/').length > 3;
  }
}

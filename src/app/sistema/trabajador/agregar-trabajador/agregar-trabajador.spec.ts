import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarTrabajador } from './agregar-trabajador';

describe('AgregarTrabajador', () => {
  let component: AgregarTrabajador;
  let fixture: ComponentFixture<AgregarTrabajador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarTrabajador],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarTrabajador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

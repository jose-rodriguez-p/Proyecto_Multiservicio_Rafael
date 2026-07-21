import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarCliente } from './agregar-cliente';

describe('AgregarCliente', () => {
  let component: AgregarCliente;
  let fixture: ComponentFixture<AgregarCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarCliente],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

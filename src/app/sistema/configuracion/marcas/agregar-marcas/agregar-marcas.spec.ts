import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarMarcas } from './agregar-marcas';

describe('AgregarMarcas', () => {
  let component: AgregarMarcas;
  let fixture: ComponentFixture<AgregarMarcas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarMarcas],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarMarcas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

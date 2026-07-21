import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarCategorias } from './agregar-categorias';

describe('AgregarCategorias', () => {
  let component: AgregarCategorias;
  let fixture: ComponentFixture<AgregarCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarCategorias],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarCategorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

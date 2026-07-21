import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarCategorias } from './editar-categorias';

describe('EditarCategorias', () => {
  let component: EditarCategorias;
  let fixture: ComponentFixture<EditarCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarCategorias],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarCategorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

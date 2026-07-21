import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarMarcas } from './editar-marcas';

describe('EditarMarcas', () => {
  let component: EditarMarcas;
  let fixture: ComponentFixture<EditarMarcas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarMarcas],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarMarcas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

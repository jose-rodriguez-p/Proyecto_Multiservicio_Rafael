import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarRol } from './editar-rol';

describe('EditarRol', () => {
  let component: EditarRol;
  let fixture: ComponentFixture<EditarRol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarRol],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarRol);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

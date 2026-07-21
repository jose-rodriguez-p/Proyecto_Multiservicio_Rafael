import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarRol } from './agregar-rol';

describe('AgregarRol', () => {
  let component: AgregarRol;
  let fixture: ComponentFixture<AgregarRol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarRol],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarRol);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

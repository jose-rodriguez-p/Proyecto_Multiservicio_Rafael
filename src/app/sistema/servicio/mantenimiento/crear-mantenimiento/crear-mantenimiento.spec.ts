import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearMantenimiento } from './crear-mantenimiento';

describe('CrearMantenimiento', () => {
  let component: CrearMantenimiento;
  let fixture: ComponentFixture<CrearMantenimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearMantenimiento],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearMantenimiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

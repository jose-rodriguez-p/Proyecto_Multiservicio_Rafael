import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Servicio } from './servicio';

describe('Servicio', () => {
  let component: Servicio;
  let fixture: ComponentFixture<Servicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Servicio],
    }).compileComponents();

    fixture = TestBed.createComponent(Servicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

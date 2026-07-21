import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteGeneral } from './reporte-general';

describe('ReporteGeneral', () => {
  let component: ReporteGeneral;
  let fixture: ComponentFixture<ReporteGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

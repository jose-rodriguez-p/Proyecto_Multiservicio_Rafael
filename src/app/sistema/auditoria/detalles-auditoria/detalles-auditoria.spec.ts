import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesAuditoria } from './detalles-auditoria';

describe('DetallesAuditoria', () => {
  let component: DetallesAuditoria;
  let fixture: ComponentFixture<DetallesAuditoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesAuditoria],
    }).compileComponents();

    fixture = TestBed.createComponent(DetallesAuditoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

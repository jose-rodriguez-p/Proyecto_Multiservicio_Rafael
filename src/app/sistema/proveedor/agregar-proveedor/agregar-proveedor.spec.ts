import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarProveedor } from './agregar-proveedor';

describe('AgregarProveedor', () => {
  let component: AgregarProveedor;
  let fixture: ComponentFixture<AgregarProveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarProveedor],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarProveedor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Proveedor } from './proveedor';

describe('Proveedor', () => {
  let component: Proveedor;
  let fixture: ComponentFixture<Proveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Proveedor],
    }).compileComponents();

    fixture = TestBed.createComponent(Proveedor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

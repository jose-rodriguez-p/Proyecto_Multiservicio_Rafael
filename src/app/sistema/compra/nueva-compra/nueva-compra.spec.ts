import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaCompra } from './nueva-compra';

describe('NuevaCompra', () => {
  let component: NuevaCompra;
  let fixture: ComponentFixture<NuevaCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaCompra],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevaCompra);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

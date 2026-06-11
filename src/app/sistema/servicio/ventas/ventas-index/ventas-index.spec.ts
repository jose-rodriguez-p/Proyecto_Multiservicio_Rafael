import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasIndex } from './ventas-index';

describe('VentasIndex', () => {
  let component: VentasIndex;
  let fixture: ComponentFixture<VentasIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasIndex],
    }).compileComponents();

    fixture = TestBed.createComponent(VentasIndex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

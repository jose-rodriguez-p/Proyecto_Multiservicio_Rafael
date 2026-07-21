import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reabastecimiento } from './reabastecimiento';

describe('Reabastecimiento', () => {
  let component: Reabastecimiento;
  let fixture: ComponentFixture<Reabastecimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reabastecimiento],
    }).compileComponents();

    fixture = TestBed.createComponent(Reabastecimiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prueva } from './prueva';

describe('Prueva', () => {
  let component: Prueva;
  let fixture: ComponentFixture<Prueva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prueva],
    }).compileComponents();

    fixture = TestBed.createComponent(Prueva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

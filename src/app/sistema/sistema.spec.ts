import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sistema } from './sistema';

describe('Sistema', () => {
  let component: Sistema;
  let fixture: ComponentFixture<Sistema>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sistema],
    }).compileComponents();

    fixture = TestBed.createComponent(Sistema);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

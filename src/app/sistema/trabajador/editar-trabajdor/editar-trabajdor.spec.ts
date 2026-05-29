import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarTrabajdor } from './editar-trabajdor';

describe('EditarTrabajdor', () => {
  let component: EditarTrabajdor;
  let fixture: ComponentFixture<EditarTrabajdor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarTrabajdor],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarTrabajdor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

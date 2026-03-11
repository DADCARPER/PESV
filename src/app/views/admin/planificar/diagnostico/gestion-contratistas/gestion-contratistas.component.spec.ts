import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionContratistasComponent } from './gestion-contratistas.component';

describe('GestionContratistasComponent', () => {
  let component: GestionContratistasComponent;
  let fixture: ComponentFixture<GestionContratistasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionContratistasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionContratistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

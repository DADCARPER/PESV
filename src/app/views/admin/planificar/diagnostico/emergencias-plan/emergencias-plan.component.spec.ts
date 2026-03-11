import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergenciasPlanComponent } from './emergencias-plan.component';

describe('EmergenciasPlanComponent', () => {
  let component: EmergenciasPlanComponent;
  let fixture: ComponentFixture<EmergenciasPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergenciasPlanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmergenciasPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

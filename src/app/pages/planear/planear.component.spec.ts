import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanearComponent } from './planear.component';

describe('PlanearComponent', () => {
  let component: PlanearComponent;
  let fixture: ComponentFixture<PlanearComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanearComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlanearComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardiagnosticoComponent } from './dashboardiagnostico.component';

describe('DashboardiagnosticoComponent', () => {
  let component: DashboardiagnosticoComponent;
  let fixture: ComponentFixture<DashboardiagnosticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardiagnosticoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardiagnosticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactorRiesgoComponent } from './factor-riesgo.component';

describe('FactorRiesgoComponent', () => {
  let component: FactorRiesgoComponent;
  let fixture: ComponentFixture<FactorRiesgoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactorRiesgoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FactorRiesgoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

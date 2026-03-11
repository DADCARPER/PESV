import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlotaVehiculosComponent } from './flota-vehiculos.component';

describe('FlotaVehiculosComponent', () => {
  let component: FlotaVehiculosComponent;
  let fixture: ComponentFixture<FlotaVehiculosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlotaVehiculosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlotaVehiculosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdentificacionRiesgoComponent } from './identificacion-riesgo.component';

describe('IdentificacionRiesgoComponent', () => {
  let component: IdentificacionRiesgoComponent;
  let fixture: ComponentFixture<IdentificacionRiesgoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentificacionRiesgoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IdentificacionRiesgoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

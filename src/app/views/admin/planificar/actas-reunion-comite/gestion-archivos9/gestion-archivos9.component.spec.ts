import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionArchivos9Component } from './gestion-archivos9.component';

describe('GestionArchivos9Component', () => {
  let component: GestionArchivos9Component;
  let fixture: ComponentFixture<GestionArchivos9Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionArchivos9Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionArchivos9Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

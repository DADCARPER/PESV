import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionArchivos10Component } from './gestion-archivos10.component';

describe('GestionArchivos10Component', () => {
  let component: GestionArchivos10Component;
  let fixture: ComponentFixture<GestionArchivos10Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionArchivos10Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionArchivos10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionArchivos5Component } from './gestion-archivos5.component';

describe('GestionArchivos5Component', () => {
  let component: GestionArchivos5Component;
  let fixture: ComponentFixture<GestionArchivos5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionArchivos5Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionArchivos5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

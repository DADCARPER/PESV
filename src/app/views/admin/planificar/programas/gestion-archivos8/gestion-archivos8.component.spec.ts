import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionArchivos8Component } from './gestion-archivos8.component';

describe('GestionArchivos8Component', () => {
  let component: GestionArchivos8Component;
  let fixture: ComponentFixture<GestionArchivos8Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionArchivos8Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionArchivos8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrizLegalComponent } from './matriz-legal.component';

describe('MatrizLegalComponent', () => {
  let component: MatrizLegalComponent;
  let fixture: ComponentFixture<MatrizLegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrizLegalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatrizLegalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

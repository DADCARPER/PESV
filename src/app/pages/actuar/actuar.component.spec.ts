import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActuarComponent } from './actuar.component';

describe('ActuarComponent', () => {
  let component: ActuarComponent;
  let fixture: ComponentFixture<ActuarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActuarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActuarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

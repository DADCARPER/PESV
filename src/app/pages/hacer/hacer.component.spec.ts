import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HacerComponent } from './hacer.component';

describe('HacerComponent', () => {
  let component: HacerComponent;
  let fixture: ComponentFixture<HacerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HacerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HacerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

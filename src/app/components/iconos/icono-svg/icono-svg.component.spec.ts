import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconoSvgComponent } from './icono-svg.component';

describe('IconoSvgComponent', () => {
  let component: IconoSvgComponent;
  let fixture: ComponentFixture<IconoSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconoSvgComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IconoSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

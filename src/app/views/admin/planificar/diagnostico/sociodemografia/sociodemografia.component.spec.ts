import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SociodemografiaComponent } from './sociodemografia.component';

describe('SociodemografiaComponent', () => {
  let component: SociodemografiaComponent;
  let fixture: ComponentFixture<SociodemografiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SociodemografiaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SociodemografiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnsDatalabelsBarComponent } from './columns-datalabels-bar.component';

describe('ColumnsDatalabelsBarComponent', () => {
  let component: ColumnsDatalabelsBarComponent;
  let fixture: ComponentFixture<ColumnsDatalabelsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnsDatalabelsBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColumnsDatalabelsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

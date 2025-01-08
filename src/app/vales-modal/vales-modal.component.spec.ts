import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValesModalComponent } from './vales-modal.component';

describe('ValesModalComponent', () => {
  let component: ValesModalComponent;
  let fixture: ComponentFixture<ValesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ValesModalComponent]
    });
    fixture = TestBed.createComponent(ValesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

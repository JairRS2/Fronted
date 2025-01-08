import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasModalComponent } from './compras-modal.component';

describe('ComprasModalComponent', () => {
  let component: ComprasModalComponent;
  let fixture: ComponentFixture<ComprasModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ComprasModalComponent]
    });
    fixture = TestBed.createComponent(ComprasModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

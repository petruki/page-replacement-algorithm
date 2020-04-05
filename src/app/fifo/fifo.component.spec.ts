import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FifoComponent } from './fifo.component';

describe('FifoComponent', () => {
  let component: FifoComponent;
  let fixture: ComponentFixture<FifoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FifoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FifoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

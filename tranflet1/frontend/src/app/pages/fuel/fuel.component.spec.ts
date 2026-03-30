import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FuelComponent } from './fuel.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';

describe('FuelComponent', () => {
  let component: FuelComponent;
  let fixture: ComponentFixture<FuelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuelComponent, HttpClientTestingModule],
      providers: [provideHttpClient(), ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(FuelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

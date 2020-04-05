import { Component, OnInit, ViewChild } from '@angular/core';
import { FifoComponent } from './fifo/fifo.component';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
  border: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('fifoComponent', { static: true })
  private fifoComponent: FifoComponent;

  executing: boolean = false;
  error: string = '';

  constructor() {}

  ngOnInit(): void {}

  private validate(stream: string, capacity: string, algorithm: any): void {
    if (!stream || stream.trim() === '') {
      throw new Error('Please, add a stream to execute the algorithm.');
    } else if (!capacity || capacity === '') {
      throw new Error('Please, add a capacity to execute the algorithm.');
    } else if (algorithm === '') {
      throw new Error('Please, select an algorithm.');
    }
  }

  public numberOnly(event: any, value: string): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;

    return !value ? true : false;
  }

  public onExecute(stream: string, capacity: string, speed: any, algorithm: any): void {
    try {
      this.error = '';
      this.validate(stream, capacity, algorithm);

      if (Number(algorithm) === 1)
        this.fifoComponent.execute(stream, capacity, speed);
    } catch (e) {
      this.error = e.message;
    }
  }

  public onChangeAlgorithm(event) {

  }

}

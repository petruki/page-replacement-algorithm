import { Component, OnInit, ViewChild } from '@angular/core';
import { FifoComponent } from './fifo/fifo.component';
import { LruComponent } from './lru/lru.component';
import { ClockComponent } from './clock/clock.component';
import { OptComponent } from './opt/opt.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('fifoComponent', { static: true })
  private fifoComponent: FifoComponent;

  @ViewChild('lruComponent', { static: true })
  private lruComponent: LruComponent;

  @ViewChild('clockComponent', { static: true })
  private clockComponent: ClockComponent;

  @ViewChild('optComponent', { static: true })
  private optComponent: OptComponent;

  executing: boolean = false;
  error: string = '';
  algorithmNum: number;
  paused: boolean = false;

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

      this.fifoComponent.capacity = undefined;
      this.lruComponent.capacity = undefined;
      this.clockComponent.capacity = undefined;
      this.optComponent.capacity = undefined;

      this.algorithmNum = Number(algorithm);
      if (this.algorithmNum === 1)
        this.fifoComponent.execute(stream, capacity, speed, this);
      else if (this.algorithmNum === 2)
        this.lruComponent.execute(stream, capacity, speed, this);
      else if (this.algorithmNum === 3)
        this.clockComponent.execute(stream, capacity, speed, this);
      else if (this.algorithmNum === 4)
        this.optComponent.execute(stream, capacity, speed, this);

      // const resultPanel = document.getElementById('resultPanel');
      // resultPanel.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    } catch (e) {
      this.error = e.message;
    }
  }

  public onControl() {
    if (!this.paused)
      this.paused = true;
    else
      this.paused = false;

    if (this.algorithmNum === 1)
      this.fifoComponent.toggle();
    else if (this.algorithmNum === 2)
      this.lruComponent.toggle();
    else if (this.algorithmNum === 3)
      this.clockComponent.toggle();
    else if (this.algorithmNum === 4)
      this.optComponent.toggle();
  }

  public onAbort() {
    this.paused = false;
    
    this.fifoComponent.capacity = undefined;
    this.lruComponent.capacity = undefined;
    this.clockComponent.capacity = undefined;
    this.optComponent.capacity = undefined;

    if (this.algorithmNum === 1)
      this.fifoComponent.abort();
    else if (this.algorithmNum === 2)
      this.lruComponent.abort();
    else if (this.algorithmNum === 3)
      this.clockComponent.abort();
    else if (this.algorithmNum === 4)
      this.optComponent.abort();
  }

}
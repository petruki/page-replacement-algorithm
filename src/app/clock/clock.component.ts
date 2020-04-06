import { Component, OnInit, Input } from '@angular/core';
import { AppComponent, Tile } from '../app.component';

@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrls: ['../app.component.css']
})
export class ClockComponent implements OnInit {

  @Input()
  private app: AppComponent;

  // Frame status
  private ALLOC_FRAME: string = 'lightblue';
  private NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
  private FAULT: string = '#e6adad';

  // Cursor status
  private READING: string = '2px solid #ff000091';
  private NOT_READING: string = '0px';

  clockColumns: number;
  clockCapacity: number;
  clock: Tile[];

  delayTime: number = 500;

  constructor() { }

  ngOnInit(): void {
  }

  public execute(stream: string, capacity: string, speed: any): void {
    this.clockCapacity = Number(capacity);
    this.delayTime = Number(speed);
    this.app.executing = true;
    this.loadClock(stream, capacity);
  }

  private async loadClock(stream: string, capacity: string) {
    this.clock = [];

    const entry = stream.split(' ');
    this.clockColumns = entry.length;
    this.clockCapacity = Number(capacity);

    this.prepareClockFrames(entry, Number(capacity));
    await this.exeuteClock(entry, Number(capacity));
    this.app.executing = false;
  }

  private prepareClockFrames(entry: string[], capacity: number): void {
    const totalPositions = entry.length * capacity + (entry.length * 2);

    for (let index = 0; index < totalPositions; index++) {
      if (index < entry.length) { // Draw header
        this.clock.push({ text: entry[index], cols: 1, rows: 1, color: this.ALLOC_FRAME, border: this.NOT_READING });
      } else if (index > totalPositions - entry.length) { // Draw fault footer
        this.clock.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      } else { // Draw empty frame
        this.clock.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      }
    }
  }

  private async exeuteClock(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;

    for (let index = 0; index < entry.length; index++) {
      for (let cap = 1; cap <= capacity; cap++) {

        if (this.isEmpty(this.clock[numEntries * cap + next])) {
          this.fulfillFrame(this.clock[numEntries * cap + next], entry[index] + '*'); await this.delay(this.delayTime);
          this.moveCursor(numEntries, cap, next); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); 
          next++;
          break;
        } else {
          if (this.clock[numEntries * cap + next].text.replace('*', '') === entry[index]) {
            await this.delay(this.delayTime);
            if (this.clock[numEntries * cap + next].text.indexOf('*') < 0)
              this.clock[numEntries * cap + next].text = this.clock[numEntries * cap + next].text + "*";
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }
      }

      if (next != fault) fault = next;
      else {
        await this.verifyFault(next,  numEntries, capacity, entry[index]);
        next++;
        fault = next;
      }
    }
  }

  private async verifyFault(next: number,  numEntries: number, capacity: number, value: any) {
    await this.fulfillFault(numEntries, capacity, value, next); await this.delay(this.delayTime);
    if (next + 1 < numEntries) {
      this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
    }
  }

  private async fulfillFault(numEntries: number, capacity: number, value: any, next: number) {
    let checked = false;
    for (let cap = 1; cap <= capacity; cap++) {

      if (this.clock[numEntries * cap + next].text.indexOf('*') < 0) {
        checked = true;
        this.clock[numEntries * cap + next].text = value + '*'; // replace
        await this.removeBit(numEntries, capacity, next, cap);
        this.skipCursor(numEntries, cap, next); await this.delay(this.delayTime);
        break;
      }
    }

    if (!checked) {
      this.clock[numEntries * 1 + next].text = value + '*'; // replace
      await this.removeBit(numEntries, capacity, next, 1);
      this.moveCursor(numEntries, 1, next); await this.delay(this.delayTime);
    }

    // Add Fault frame
    this.clock[numEntries * (capacity + 1) + next].text = 'F';
    this.clock[numEntries * (capacity + 1) + next].color = this.FAULT;
  
  }

  private async removeBit(numEntries: number, capacity: number, next: number, cap: number) {
    if (cap + 1 < capacity) {
      for (let index = cap + 1; index <= capacity; index++) {
        this.clock[numEntries * index + next].text = this.clock[numEntries * index + next].text.replace('*', ''); await this.delay(this.delayTime);
      }
    }
  }

  private prepareNextBlock(numEntries: number, capacity: number, next: number): void {
    for (let cap = 1; cap <= capacity; cap++) {
      this.clock[numEntries * cap + next + 1].border = this.clock[numEntries * cap + next].border;
      this.fulfillFrame(this.clock[numEntries * cap + next + 1], // Next frame block
        this.clock[numEntries * cap + next].text); // Copy previous frame block
    }
  }

  private skipCursor(numEntries: number, cap: number, next: number): void {
    for (let index = 1; index <= this.clockCapacity; index++) {
      if (this.clock[numEntries * index + next].border === this.READING) {
        this.clock[numEntries * index + next].border = this.NOT_READING;
        break;
      }
    }
    this.clock[numEntries * (cap + 1 <= this.clockCapacity ? cap + 1 : 1) + next].border = this.READING;
  }

  private moveCursor(numEntries: number, cap: number, next: number): void {
    let noCursor = true;
    for (let cap = 1; cap <= this.clockCapacity; cap++) {
      if (this.clock[numEntries * cap + next].border === this.READING) {
        this.clock[numEntries * cap + next].border = this.NOT_READING;
        this.clock[numEntries * (cap + 1 <= this.clockCapacity ? cap + 1 : 1) + next].border = this.READING;
        noCursor = false;
        break;
      }
    }

    if (noCursor) {
      this.clock[numEntries * (cap + 1) + next].border = this.READING;
    }
  }

  private fulfillFrame(tile: Tile, value: string): void {
    if (value.trim() != '')
      tile.color = this.ALLOC_FRAME;
    else
      tile.color = this.NOT_ALLOC_FRAME;

    tile.text = value;
  }

  private isEmpty(tile: Tile): boolean {
    return tile.text === ' ';
  }

  private delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}

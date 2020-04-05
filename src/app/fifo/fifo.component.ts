import { Component, OnInit, Input } from '@angular/core';
import { Tile, AppComponent } from '../app.component';

@Component({
  selector: 'app-fifo',
  templateUrl: './fifo.component.html',
  styleUrls: ['../app.component.css']
})
export class FifoComponent implements OnInit {

  @Input()
  private app: AppComponent;

  // Frame status
  private ALLOC_FRAME: string = 'lightblue';
  private NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
  private FAULT: string = '#e6adad';

  // Cursor status
  private READING: string = '2px solid #ff000091';
  private NOT_READING: string = '0px';

  fifoColumns: number;
  fifoCapacity: number;
  fifo: Tile[];
  fifoQueue: any[] = [];

  delayTime: number = 500;

  constructor() { }

  ngOnInit(): void {
  }

  public execute(stream: string, capacity: string, speed: any): void {
    this.fifoCapacity = Number(capacity);
    this.delayTime = Number(speed);
    this.app.executing = true;
    this.loadFifo(stream, capacity);
  }

  private async loadFifo(stream: string, capacity: string) {
    this.fifo = [];

    const entry = stream.split(' ');
    this.fifoColumns = entry.length;
    this.fifoCapacity = Number(capacity);

    this.prepareFifoFrames(entry, Number(capacity));
    await this.exeuteFifo(entry, Number(capacity));
    this.app.executing = false;
  }

  private prepareFifoFrames(entry: string[], capacity: number): void {
    const totalPositions = entry.length * capacity + (entry.length * 2);

    for (let index = 0; index < totalPositions; index++) {
      if (index < entry.length) { // Draw header
        this.fifo.push({ text: entry[index], cols: 1, rows: 1, color: this.ALLOC_FRAME, border: this.NOT_READING });
      } else if (index > totalPositions - entry.length) { // Draw fault footer
        this.fifo.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      } else { // Draw empty frame
        this.fifo.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      }
    }
  }

  private async exeuteFifo(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.fifoQueue = []
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.fifo[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.fifo[numEntries * cap + next])) {
          this.fifoQueue.push(value); // Store FI element

          this.fulfillFrame(this.fifo[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.fifo[numEntries * cap + next].text === value) {
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }

        this.cursor(this.fifo[numEntries * cap + next]);
      }

      if (next != fault) fault = next;
      else {
        await this.verifyFault(fault, next,  numEntries, capacity, value);
        next++;
        fault = next;
      }
    }
  }

  private async verifyFault(fault: number, next: number,  numEntries: number, capacity: number, value: any) {
    await this.fulfillFault(fault, numEntries, capacity, value); await this.delay(this.delayTime);
    if (next + 1 < numEntries) {
      this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
    }
  }

  private async fulfillFault(fault: number, numEntries: number, capacity: number, value: any) {
    for (let cap = 1; cap <= capacity; cap++) {
      this.cursor(this.fifo[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.fifo[numEntries * cap + fault].text === this.fifoQueue[0]) {
        this.fifo[numEntries * cap + fault].text = value; // replace
        this.fifoQueue.splice(0, 1); // Remove from queue
        this.fifoQueue.push(value); // Add to queue

        // Add Fault frame
        this.fifo[numEntries * (capacity + 1) + fault].text = 'F';
        this.fifo[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.fifo[numEntries * cap + fault]);
      }
    }
  }

  private prepareNextBlock(numEntries: number, capacity: number, next: number): void {
    for (let cap = 1; cap <= capacity; cap++) {
      this.fulfillFrame(this.fifo[numEntries * cap + next + 1], // Next frame block
        this.fifo[numEntries * cap + next].text); // Copy previous frame block
    }
  }

  private cursor(tile: Tile): void {
    if (tile.border === this.READING)
      tile.border = this.NOT_READING;
    else
      tile.border = this.READING;
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

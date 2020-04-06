import { Component, OnInit, Input } from '@angular/core';
import { AppComponent, Tile } from '../app.component';

@Component({
  selector: 'app-lru',
  templateUrl: './lru.component.html',
  styleUrls: ['../app.component.css']
})
export class LruComponent implements OnInit {

  @Input()
  private app: AppComponent;

  // Frame status
  private ALLOC_FRAME: string = 'lightblue';
  private NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
  private FAULT: string = '#e6adad';

  // Cursor status
  private READING: string = '2px solid #ff000091';
  private NOT_READING: string = '0px';

  lruColumns: number;
  lruCapacity: number;
  lru: Tile[];
  lruQueue: any[] = [];

  delayTime: number = 500;

  constructor() { }

  ngOnInit(): void {
  }

  public execute(stream: string, capacity: string, speed: any): void {
    this.lruCapacity = Number(capacity);
    this.delayTime = Number(speed);
    this.app.executing = true;
    this.loadLru(stream, capacity);
  }

  private async loadLru(stream: string, capacity: string) {
    this.lru = [];

    const entry = stream.split(' ');
    this.lruColumns = entry.length;
    this.lruCapacity = Number(capacity);

    this.prepareLruFrames(entry, Number(capacity));
    await this.exeuteLru(entry, Number(capacity));
    this.app.executing = false;
  }

  private prepareLruFrames(entry: string[], capacity: number): void {
    const totalPositions = entry.length * capacity + (entry.length * 2);

    for (let index = 0; index < totalPositions; index++) {
      if (index < entry.length) { // Draw header
        this.lru.push({ text: entry[index], cols: 1, rows: 1, color: this.ALLOC_FRAME, border: this.NOT_READING });
      } else if (index > totalPositions - entry.length) { // Draw fault footer
        this.lru.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      } else { // Draw empty frame
        this.lru.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      }
    }
  }

  private async exeuteLru(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.lruQueue = []
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.lru[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.lru[numEntries * cap + next])) {
          this.lruQueue.push(value); // Store FI element

          this.fulfillFrame(this.lru[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.lru[numEntries * cap + next].text === value) {
            await this.delay(this.delayTime);
            this.lruQueue.push(value); // Add to the end
            this.lruQueue.splice(0, 1); // Remove from queue
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }

        this.cursor(this.lru[numEntries * cap + next]);
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
      this.cursor(this.lru[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.lru[numEntries * cap + fault].text === this.lruQueue[0]) {
        this.lru[numEntries * cap + fault].text = value; // replace
        this.lruQueue.splice(0, 1); // Remove from queue
        this.lruQueue.push(value); // Add to queue

        // Add Fault frame
        this.lru[numEntries * (capacity + 1) + fault].text = 'F';
        this.lru[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.lru[numEntries * cap + fault]);
      }
    }
  }

  private prepareNextBlock(numEntries: number, capacity: number, next: number): void {
    for (let cap = 1; cap <= capacity; cap++) {
      this.fulfillFrame(this.lru[numEntries * cap + next + 1], // Next frame block
        this.lru[numEntries * cap + next].text); // Copy previous frame block
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

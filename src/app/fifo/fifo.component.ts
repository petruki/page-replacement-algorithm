import { Component, OnInit, Input } from '@angular/core';
import { Tile, AppComponent } from '../app.component';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-fifo',
  templateUrl: './fifo.component.html',
  styleUrls: ['../app.component.css']
})
export class FifoComponent extends PageAlgorithm implements OnInit {
  fifoQueue: any[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {}

  protected async exeuteAlgorithm(entry: string[], capacity: number): Promise<any> {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.fifoQueue = []
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tiles[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.fifoQueue.push(value); // Store FI element

          this.fulfillFrame(this.tiles[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.tiles[numEntries * cap + next].text === value) {
            await this.delay(this.delayTime);
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }

        this.cursor(this.tiles[numEntries * cap + next]);
      }

      if (next != fault) fault = next;
      else {
        await this.verifyFault(fault, next,  numEntries, capacity, value);
        next++;
        fault = next;
      }
    }
  }

  protected async fulfillFault(fault: number, numEntries: number, capacity: number, value: any) {
    for (let cap = 1; cap <= capacity; cap++) {
      this.cursor(this.tiles[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.tiles[numEntries * cap + fault].text === this.fifoQueue[0]) {
        this.tiles[numEntries * cap + fault].text = value; // replace
        this.fifoQueue.splice(0, 1); // Remove from queue
        this.fifoQueue.push(value); // Add to queue

        // Add Fault frame
        this.tiles[numEntries * (capacity + 1) + fault].text = 'F';
        this.tiles[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.tiles[numEntries * cap + fault]);
      }
    }
  }
}
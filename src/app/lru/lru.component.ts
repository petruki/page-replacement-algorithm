import { Component, OnInit, Input } from '@angular/core';
import { AppComponent, Tile } from '../app.component';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-lru',
  templateUrl: './lru.component.html',
  styleUrls: ['../app.component.css']
})
export class LruComponent extends PageAlgorithm implements OnInit {
  lruQueue: any[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {}

  protected async exeuteAlgorithm(entry: string[], capacity: number): Promise<any> {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.lruQueue = []
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tile[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tile[numEntries * cap + next])) {
          this.lruQueue.push(value); // Store FI element

          this.fulfillFrame(this.tile[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.tile[numEntries * cap + next].text === value) {
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

        this.cursor(this.tile[numEntries * cap + next]);
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
      this.cursor(this.tile[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.tile[numEntries * cap + fault].text === this.lruQueue[0]) {
        this.tile[numEntries * cap + fault].text = value; // replace
        this.lruQueue.splice(0, 1); // Remove from queue
        this.lruQueue.push(value); // Add to queue

        // Add Fault frame
        this.tile[numEntries * (capacity + 1) + fault].text = 'F';
        this.tile[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.tile[numEntries * cap + fault]);
      }
    }
  }
}
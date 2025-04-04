import { Component } from '@angular/core';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-lru',
  templateUrl: './lru.component.html',
  styleUrls: ['../app.component.css'],
  standalone: false
})
export class LruComponent extends PageAlgorithm {
  lruQueue: any[] = [];

  constructor() {
    super();
  }

  protected async exeuteAlgorithm(entry: string[], capacity: number): Promise<any> {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.lruQueue = [];
    this.addLog('- Starting LRU sequence');
    for (let index = 0; index < entry.length; index++) {
      this.elementIndex = index;
      const value = entry[index];
      this.addLog(`\n[${index}] Reading value: ${value}`);
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tiles[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.addLog('- Page Fault loading in...');
          this.lruQueue.push(value); // Store FI element

          this.fulfillFrame(this.tiles[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.fulfillPageFault(numEntries, capacity, next);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else if (this.tiles[numEntries * cap + next].text === value) { await this.delay(this.delayTime);
            this.addLog('- Page found, referencing the page');
            await this.delay(this.delayTime);
            this.addLog(`-- Moving ${value} to the end of the queue`);
            this.lruQueue.push(value); // Add to the end
            this.lruQueue.splice(this.lruQueue.indexOf(value), 1); // Remove from queue
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }

        this.cursor(this.tiles[numEntries * cap + next]);
      }

      ({ next, fault } = await this.checkFault(next, fault, numEntries, capacity, value));
    }
  }

  private async checkFault(next: number, fault: number, numEntries: number, capacity: number, value: string) {
    if (next == fault) {
      this.addLog('- Page fault, validating replacement...');
      await this.verifyFault(fault, next, numEntries, capacity, value);
      next++;
      fault = next;
    } else {
      fault = next;
    }
    return { next, fault };
  }

  protected async fulfillFault(fault: number, numEntries: number, capacity: number, value: any) {
    for (let cap = 1; cap <= capacity; cap++) {
      this.cursor(this.tiles[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.tiles[numEntries * cap + fault].text === this.lruQueue[0]) {
        this.addLog(`-- Replacing page ${this.tiles[numEntries * cap + fault].text} with ${value}`);
        this.addLog(`-- Adding ${value} to the queue`);
        this.addLog(`-- Removing ${this.lruQueue[0]} from the queue`);
        this.tiles[numEntries * cap + fault].text = value; // replace
        this.lruQueue.splice(0, 1); // Remove from queue
        this.lruQueue.push(value); // Add to queue

        this.fulfillPageFault(numEntries, capacity, fault);
        break;
      } else {
        this.cursor(this.tiles[numEntries * cap + fault]);
      }
    }
  }
}
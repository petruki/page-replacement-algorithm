import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-fifo',
  templateUrl: './fifo.component.html',
  styleUrls: ['../app.component.css'],
  imports: [
    CommonModule,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class FifoComponent extends PageAlgorithm {
  fifoQueue: any[] = [];

  constructor() {
    super();
  }

  protected async exeuteAlgorithm(entry: string[], capacity: number): Promise<any> {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.fifoQueue = []
    this.addLog('- Starting FIFO sequence');
    for (let index = 0; index < entry.length; index++) {
      this.elementIndex = index;
      const value = entry[index];
      this.addLog(`\n[${index}] Reading value: ${value}`);

      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tiles[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.addLog('- Page Fault loading in...');
          this.fifoQueue.push(value); // Store FI element

          this.fulfillFrame(this.tiles[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.fulfillPageFault(numEntries, capacity, next);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else if (this.tiles[numEntries * cap + next].text === value) {
            this.addLog('- Page found, referencing the page');
            await this.delay(this.delayTime);
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
      if (this.tiles[numEntries * cap + fault].text === this.fifoQueue[0]) {
        this.addLog(`-- Replacing page ${this.tiles[numEntries * cap + fault].text} with ${value}`);
        this.addLog(`-- Adding ${value} to the queue`);
        this.addLog(`-- Removing ${this.fifoQueue[0]} from the queue`);
        this.tiles[numEntries * cap + fault].text = value; // replace
        this.fifoQueue.splice(0, 1); // Remove from queue
        this.fifoQueue.push(value); // Add to queue

        this.fulfillPageFault(numEntries, capacity, fault);
        break;
      } else {
        this.cursor(this.tiles[numEntries * cap + fault]);
      }
    }
  }
}
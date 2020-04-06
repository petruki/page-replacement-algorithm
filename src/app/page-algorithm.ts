import { Tile, AppComponent } from './app.component';

export abstract class PageAlgorithm {

    // Frame status
    ALLOC_FRAME: string = 'lightblue';
    NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
    FAULT: string = '#e6adad';

    // Cursor status
    READING: string = '2px solid #ff000091';
    NOT_READING: string = '0px';

    columns: number;
    capacity: number;
    tile: Tile[];

    delayTime: number = 500;

    protected async loadBlocks(stream: string, capacity: string) {
        this.tile = [];
    
        const entry = stream.split(' ');
        this.columns = entry.length;
        this.capacity = Number(capacity);
    
        this.prepareBlocks(entry, Number(capacity));
        await this.exeuteAlgorithm(entry, Number(capacity));
    }

    private prepareBlocks(entry: string[], capacity: number): void {
        const totalPositions = entry.length * capacity + (entry.length * 2);
    
        for (let index = 0; index < totalPositions; index++) {
          if (index < entry.length) { // Draw header
            this.tile.push({ text: entry[index], cols: 1, rows: 1, color: this.ALLOC_FRAME, border: this.NOT_READING });
          } else if (index > totalPositions - entry.length) { // Draw fault footer
            this.tile.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
          } else { // Draw empty frame
            this.tile.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
          }
        }
    }

    protected async verifyFault(fault: number, next: number,  numEntries: number, capacity: number, value: any) {
        await this.fulfillFault(fault, numEntries, capacity, value); await this.delay(this.delayTime);
        if (next + 1 < numEntries) {
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
        }
    }

    protected prepareNextBlock(numEntries: number, capacity: number, next: number): void {
        for (let cap = 1; cap <= capacity; cap++) {
          this.fulfillFrame(this.tile[numEntries * cap + next + 1], // Next frame block
            this.tile[numEntries * cap + next].text); // Copy previous frame block
        }
    }

    protected fulfillFrame(tile: Tile, value: string): void {
        if (value.trim() != '')
          tile.color = this.ALLOC_FRAME;
        else
          tile.color = this.NOT_ALLOC_FRAME;
    
        tile.text = value;
    }

    protected cursor(tile: Tile): void {
        if (tile.border === this.READING)
          tile.border = this.NOT_READING;
        else
          tile.border = this.READING;
    }

    protected isEmpty(tile: Tile): boolean {
        return tile.text === ' ';
    }

    protected delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    public async execute(stream: string, capacity: string, speed: any, app: AppComponent) {
        this.capacity = Number(capacity);
        this.delayTime = Number(speed);
        app.executing = true;
        await this.loadBlocks(stream, capacity);
        app.executing = false;
    }

    protected abstract async exeuteAlgorithm(entry: string[], capacity: number): Promise<any>

    protected abstract async fulfillFault(fault: number, numEntries: number, capacity: number, value: any): Promise<any>
    
}
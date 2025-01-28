export class Converter {
    private readonly LITER = ['ml', 'cl', 'dl', 'l'];
    private readonly KILOGRAM = ['mg', 'cg', 'dg', 'g', 'dag', 'hg', 'kg'];
    private readonly METER = ['mm', 'cm', 'dm', 'm'];
    private readonly PIECE = ['pz'];
    private readonly PIECES = ['ms'];

    private value: number;
    private unit: string;
    private targetUnit: string;

    constructor(value: number, unit: string, targetUnit: string) {
        this.value = value;
        this.unit = unit;
        this.targetUnit = targetUnit;
    }

    convert(): number {
        let array: string[] = [];
        switch (this.targetUnit.at(-1)) {
            case 'l':
                array = this.LITER;
                break;
            case 'g':
                array = this.KILOGRAM;
                break;
            case 'm':
                array = this.METER;
                break;
            case 'z':
                array = this.PIECE;
                break;
            case 's':
                array = this.PIECES;
                break;
            default:
                console.error(`No matching for input unit: ${this.value}, ${this.unit}, ${this.targetUnit}`);
        }
        const index = array.indexOf(this.unit) - array.indexOf(this.targetUnit);
        return this.value * Math.pow(10, index);
    }
}
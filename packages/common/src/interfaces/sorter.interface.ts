import { Column } from './column.interface';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export type Sorter = (value1: any, value2: any, sortDirection: SortDirectionNumber, sortColumn?: Column) => SortDirectionNumber;

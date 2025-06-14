import { Entity, ManyToOne } from 'typeorm';
import { UnitWork } from './unitwork/entities/UnitWork';

@Entity()
export class TestEntity {
  // This should be on one line
  @ManyToOne(() => UnitWork, (unitWork) => unitWork.unitWorks, { cascade: true, onDelete: 'CASCADE' })
  property1: UnitWork;

  // This should also be on one line
  @ManyToOne(() => UnitWork, (unitWork) => unitWork.unitWorks, { cascade: true })
  property2: UnitWork;

  // This should stay multi-line due to length
  @ManyToOne(() => UnitWork, (unitWork) => unitWork.unitWorks, {
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
    eager: true,
  })
  property3: UnitWork;
}

const testFunction = (param1: string, param2: number) => {
  return {
    test: 'value',
    another: 123,
    longLine:
      'This is a very long line that should be wrapped according to the printWidth setting of 140 characters to demonstrate that the formatter is working properly',
  };
};

const badlyFormatted = {
  test: 'value',
  test2: 456,
};

// This should be on one line
const simpleObject = {
  name: 'test',
  value: 123,
};

// This should also be on one line
const simpleFunction = (param: string) => {
  return {
    result: param,
  };
};

// This should stay multi-line due to length
const longObject = {
  veryLongPropertyName:
    'This is a very long value that should cause the object to be formatted across multiple lines because it exceeds the print width limit',
  anotherProperty: 123,
};

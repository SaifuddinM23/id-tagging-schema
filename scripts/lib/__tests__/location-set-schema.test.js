import fs from 'fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const ajv = new Ajv();

function findLocationSetSchema(node) {
  if (!node || typeof node !== 'object') return null;

  if (node.properties?.locationSet) {
    return node.properties.locationSet;
  }

  for (const value of Object.values(node)) {
    const result = findLocationSetSchema(value);
    if (result) return result;
  }

  return null;
}

const cases = [
  { name: 'uppercase country code', value: { include: ['US'] }, valid: true },
  { name: 'lowercase country code', value: { include: ['us'] }, valid: false },
  { name: 'uppercase excluded country code', value: { exclude: ['GB'] }, valid: true },
  { name: 'lowercase excluded country code', value: { exclude: ['gb'] }, valid: false },
  { name: 'subnational region', value: { include: ['GB-ENG'] }, valid: true },
  { name: 'Planet identifier', value: { include: ['Planet'] }, valid: true },
  { name: 'numeric region identifier', value: { exclude: ['150'] }, valid: true }
];

for (const schemaName of ['field', 'preset']) {
  const schema = JSON.parse(
    fs.readFileSync(`schemas/${schemaName}.json`, 'utf8')
  );

  const locationSetSchema = findLocationSetSchema(schema);
  if (!locationSetSchema) throw new Error(`locationSet schema not found in ${schemaName}`);

  const validate = ajv.compile(locationSetSchema);

  describe(`${schemaName} locationSet schema`, () => {
    it.each(cases)('validates $name', ({ value, valid }) => {
      expect(validate(value)).toBe(valid);
    });
  });
}

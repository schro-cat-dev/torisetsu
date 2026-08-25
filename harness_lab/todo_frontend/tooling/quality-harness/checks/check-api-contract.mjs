import { readFile } from "node:fs/promises";
import { join } from "node:path";

const contractPath = process.argv[2];

if (!contractPath) {
  throw new Error("Usage: <api-contract-checker> <contract.json>");
}
const contract = JSON.parse(await readFile(join(process.cwd(), contractPath), "utf8"));

validateContract(contract);

const targetPath = join(process.cwd(), contract.targetFile);
const records = JSON.parse(await readFile(targetPath, "utf8"));

if (contract.root.type === "array") {
  if (!Array.isArray(records)) {
    throw new Error(`${contract.targetFile} must be an array.`);
  }

  for (const [index, record] of records.entries()) {
    validateObject(record, contract.root.items, `${contract.name}[${index}]`);
  }

  console.log(`API contract OK: ${contract.name} ${records.length} records`);
} else {
  validateObject(records, contract.root, contract.name);
  console.log(`API contract OK: ${contract.name}`);
}

function validateContract(contractToValidate) {
  assert(contractToValidate.schemaVersion === "api-contract.v1", "contract.schemaVersion must be api-contract.v1.");
  assert(typeof contractToValidate.name === "string" && contractToValidate.name, "contract.name is required.");
  assert(typeof contractToValidate.targetFile === "string" && contractToValidate.targetFile, "contract.targetFile is required.");
  assert(contractToValidate.root && typeof contractToValidate.root === "object", "contract.root is required.");
}

function validateObject(value, schema, path) {
  assert(schema.type === "object", `${path}: schema.type must be object.`);
  assert(value && typeof value === "object" && !Array.isArray(value), `${path} must be an object.`);

  const fields = schema.fields ?? {};
  const required = new Set(schema.required ?? []);

  for (const field of required) {
    assert(Object.hasOwn(value, field), `${path}.${field} is required.`);
  }

  if (schema.allowUnknownFields === false) {
    for (const field of Object.keys(value)) {
      assert(Object.hasOwn(fields, field), `${path}.${field} is not allowed.`);
    }
  }

  for (const [field, fieldSchema] of Object.entries(fields)) {
    if (!Object.hasOwn(value, field)) continue;
    validateField(value[field], fieldSchema, `${path}.${field}`);
  }
}

function validateField(value, schema, path) {
  if (schema.type === "string") {
    assert(typeof value === "string", `${path} must be a string.`);
    if (schema.nonEmpty) {
      assert(value.trim().length > 0, `${path} must not be empty.`);
    }
    if (schema.format === "date-time") {
      assert(!Number.isNaN(Date.parse(value)), `${path} must be a valid date-time.`);
    }
    if (Array.isArray(schema.enum)) {
      assert(schema.enum.includes(value), `${path} must be one of ${schema.enum.join(", ")}.`);
    }
    return;
  }

  if (schema.type === "boolean") {
    assert(typeof value === "boolean", `${path} must be a boolean.`);
    return;
  }

  throw new Error(`${path}: unsupported field schema type ${schema.type}`);
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

import { writeFileSync } from 'fs';
import path from 'path';

/**
 * Writes a JSON object to a file inside the ../programs directory.
 * @param fileName - The name of the JSON file (without extension).
 * @param data - The JSON data to be written.
 */
export function writeProgramJsonToFile(filePath: string, data: object) {
  // Resolve the absolute path to the target JSON file
  const resolvedPath = path.resolve(__dirname, `../programs/${filePath}`);

  // Write the JSON data to the file with pretty formatting (2-space indentation)
  writeFileSync(resolvedPath, JSON.stringify(data, null, 2));

  // Log a success message with the file path
  console.log(`Saved successfully → ${resolvedPath}`);
}

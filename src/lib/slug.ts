import { customAlphabet } from "nanoid";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
const nano = customAlphabet(alphabet, 10);

export function generateSlug() {
  return nano();
}

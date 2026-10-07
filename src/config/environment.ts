import { config } from 'dotenv';
import { loadE2EEnvironment } from '../e2e/environment';

if (process.env.NODE_ENV === 'e2e') {
  loadE2EEnvironment();
} else {
  config({ quiet: true });
}

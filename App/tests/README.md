# Voice Channel Tests

Automated tests for voice channel functionality using Playwright.

## Setup

```bash
cd tests
npm install
npx playwright install
```

## Running Tests

### Quick Run
```bash
chmod +x run-tests.sh
./run-tests.sh
```

### Manual Commands
```bash
npm test
npm run test:ui
npm run test:debug
```

## Test Coverage

- Voice channel navigation without console errors
- Voice UI elements loading after SPA navigation  
- Switching between text and voice channels
- Multiple voice channel switches
- Voice channel joining functionality

## Output

Tests capture console errors and generate:
- Screenshots on failure
- Video recordings on failure
- HTML test reports
- Console error logs

## Configuration

Edit `playwright.config.js` to change:
- Base URL
- Browser settings
- Retry policies
- Reporting options 
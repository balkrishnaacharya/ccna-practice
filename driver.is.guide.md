# driver.is Guide

## Overview
`driver.is` is a utility function that checks whether a given driver or service is currently active or available. It is used throughout the application to conditionally render UI elements, enable/disable features, and manage runtime state.

## Installation
`driver.is` is bundled with the main application and does not require any additional dependencies. Ensure you are using the latest version of the codebase (commit `vX.Y.Z`) to have the most recent implementation.

## Basic Usage
```ts
import { driverIsActive } from '@/utils/driver';

// Check if a driver is active
const isActive = driverIsActive('network_infra');
if (isActive) {
  // Render UI for active driver
}
```

## Current Feature Additions (as of commit `vX.Y.Z`)
- **Dynamic driver registration** – drivers can be registered at runtime via `registerDriver(name, impl)`.
- **Automatic activation detection** – the system now listens for global state changes (e.g., network status, service worker updates) and updates the driver’s active flag automatically.
- **Type‑safe wrapper** – `driverIsActive` returns a boolean typed as `boolean` and throws a clear error if an unknown driver name is passed.

## How to Add a New Feature
1. **Define the driver contract**  
   Create an interface or type that describes the shape of the driver object.
   ```ts
   interface NetworkDriver {
     status: 'connected' | 'disconnected';
     connectionTimeout: number;
     // other properties…
   }
   ```

2. **Implement the driver logic**  
   In the appropriate module (e.g., `src/drivers/network.ts`), implement the logic that determines whether the driver is active.
   ```ts
   export const networkDriver = {
     status: 'connected',
     connectionTimeout: 30000,
     // implementation…
   };
   ```

3. **Register the driver** (if dynamic registration is needed)  
   ```ts
   import { registerDriver } from '@/utils/driver';
   registerDriver('network_infra', networkDriver);
   ```

4. **Expose a helper**  
   Add a small wrapper that calls `driverIsActive` with the driver name.
   ```ts
   export const isNetworkInfraActive = () => driverIsActive('network_infra');
   ```

5. **Update UI conditionally**  
   Use the helper in React components:
   ```tsx
   {isNetworkInfraActive() && <NetworkStatusBanner />}
   ```

## TODO / Future Work
- [ ] Provide a visual indicator in the UI when a driver becomes inactive (e.g., tooltip, banner).
- [ ] Add unit tests for `driverIsActive` covering edge cases.
- [ ] Document driver registration API in the main README.

## References
- See `src/utils/driver.ts` for the implementation details.
- Review the `AGENTS.md` file for how driver state is managed in the Antigravity agents.

---

*This guide is intended to be living documentation. Keep it in sync with code changes.*
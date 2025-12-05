
# SSR/Build Error Fix - "window is not defined"

## Problem
The app was experiencing persistent "ReferenceError: window is not defined" errors during the build/SSR phase. This occurred because:

1. `@react-native-async-storage/async-storage` was trying to access `window` during build time
2. Supabase client was being initialized during the static rendering phase
3. The initialization happened before the runtime environment was available

## Solution Overview

We implemented a **radical, multi-layered approach** to completely isolate Supabase initialization from the build process:

### 1. Storage Adapter Layer (`lib/storage-adapter.ts`)

Created a platform-agnostic storage adapter that:

- **Runtime Detection**: Checks if we're in a proper runtime environment before accessing any storage APIs
- **Mock Storage**: Provides a no-op storage implementation for build/SSR environments
- **Platform-Specific Implementations**:
  - Web: Uses `localStorage` with runtime checks
  - Native: Dynamically imports AsyncStorage only at runtime
- **Error Handling**: Gracefully handles all storage errors without crashing

### 2. Enhanced Supabase Client (`lib/supabase.ts`)

Completely rewrote the Supabase initialization:

- **Lazy Initialization**: Client is only created when actually needed
- **Async Initialization**: Uses `initializeSupabase()` function that must be called explicitly
- **Dynamic Imports**: Supabase library is imported using `await import()` to prevent build-time execution
- **Proxy Pattern**: Returns a Proxy object that safely handles all method calls before initialization
- **No-op Handlers**: Provides safe fallbacks for all operations when client isn't ready

### 3. Updated AuthContext (`contexts/AuthContext.tsx`)

Modified authentication flow:

- **Explicit Initialization**: Calls `initializeSupabase()` before any auth operations
- **Ready State**: Tracks when Supabase is ready with `supabaseReady` state
- **Delayed Auth**: Waits for Supabase to be fully initialized before setting up auth listeners
- **Error Messages**: Provides clear feedback when service isn't available yet

### 4. Metro Configuration (`metro.config.js`)

Updated bundler configuration:

- **Web Support**: Added proper web file extensions
- **Module Resolution**: Custom resolver to handle async-storage on web platform
- **Empty Module**: Returns empty module for async-storage during web builds

## Key Features

### Runtime-Only Initialization
```typescript
const canInitialize = (): boolean => {
  // Check for SSR/build environment
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_STATIC_RENDERING) {
    return false;
  }
  
  // Platform-specific checks
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  
  return typeof global !== 'undefined';
};
```

### Safe Storage Access
```typescript
const storage = getStorageAdapter(); // Returns mock storage during build
```

### Async Initialization
```typescript
// In AuthContext
const initialized = await initializeSupabase();
if (!initialized) {
  // Handle gracefully
}
```

## Benefits

1. **No Build Errors**: Completely eliminates "window is not defined" errors
2. **Graceful Degradation**: App doesn't crash if Supabase isn't ready
3. **Clear Feedback**: Users see helpful messages if service isn't available
4. **Platform Agnostic**: Works seamlessly on web, iOS, and Android
5. **Future Proof**: Easy to extend for other services that need runtime initialization

## Testing

To verify the fix works:

1. **Build Test**: Run `npm run build:web` - should complete without errors
2. **Runtime Test**: App should initialize Supabase after mounting
3. **Console Check**: Look for "✅ Supabase client initialized successfully" message
4. **Functionality Test**: Login, registration, and all Supabase operations should work normally

## Migration Notes

If you add new Supabase operations:

1. Always check if `supabase` is available before using it
2. Use the `supabaseReady` state in components if needed
3. Provide fallback behavior when Supabase isn't initialized
4. Never import Supabase modules at the top level - use dynamic imports

## Troubleshooting

If you still see errors:

1. Check console for initialization messages
2. Verify `initializeSupabase()` is being called in AuthContext
3. Ensure no other files are importing Supabase at the top level
4. Clear Metro bundler cache: `npx expo start -c`

## Technical Details

### Storage Adapter Pattern
The storage adapter provides a consistent interface across platforms while handling environment-specific quirks:

- **Web**: Direct localStorage access with window checks
- **Native**: Dynamic AsyncStorage import to avoid build-time execution
- **Build**: Mock implementation that logs warnings

### Proxy Pattern
The Supabase proxy intercepts all property access and method calls:

- Returns no-op handlers when client isn't initialized
- Binds methods correctly when client is ready
- Handles Promise-like properties specially to prevent issues

### Initialization Flow
1. App starts → AuthContext mounts
2. `initializeSupabase()` called → Creates client asynchronously
3. Storage adapter selected based on platform
4. Supabase client created with proper storage
5. Auth listeners set up
6. App ready for use

## Conclusion

This implementation provides a robust, production-ready solution to the SSR/build errors. The multi-layered approach ensures that:

- Build process never touches runtime-only APIs
- App gracefully handles initialization delays
- All platforms work correctly
- Future maintenance is straightforward

The error should now be completely resolved! 🎉

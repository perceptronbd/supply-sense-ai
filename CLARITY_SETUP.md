# Microsoft Clarity Integration

Microsoft Clarity has been successfully integrated into your SupplySense AI frontend application. Clarity is a free behavioral analytics tool that provides session replays, heatmaps, and insights about user behavior on your website.

## Setup Instructions

### 1. Get Your Clarity Project ID

1. Visit [Microsoft Clarity](https://clarity.microsoft.com/projects)
2. Sign in with your Microsoft account
3. Create a new project or select an existing one
4. Go to **Settings** > **Overview**
5. Copy your **Project ID**

### 2. Configure Environment Variables

1. Create a `.env.local` file in the `frontend` directory if it doesn't exist
2. Add your Clarity Project ID:

```bash
# Copy from .env.example and add your actual Clarity project ID
NEXT_PUBLIC_API_URL="http://localhost:3004"
NEXT_PUBLIC_CLARITY_PROJECT_ID="your-actual-clarity-project-id"
```

### 3. Verification

Once configured, Clarity will automatically start tracking user sessions when your application is running. You can verify the integration by:

1. Starting your development server: `pnpm run frontend:serve`
2. Opening your application in a browser
3. Checking the browser console for "Microsoft Clarity initialized successfully"
4. Visiting your Clarity dashboard to see incoming data

## Usage

### Basic Tracking
Clarity automatically tracks page views, clicks, scrolls, and other user interactions once initialized.

### Advanced Features

The integration includes utility functions for advanced tracking:

```typescript
import { clarityUtils } from '@/components/analytics/Clarity';

// Identify users (useful for authenticated users)
clarityUtils.identify('user-123', 'session-456', 'page-789', 'John Doe');

// Set custom tags for filtering
clarityUtils.setTag('userType', 'premium');
clarityUtils.setTag('experiment', ['A', 'B']);

// Track custom events
clarityUtils.event('button-clicked');
clarityUtils.event('form-submitted');

// Handle cookie consent (if required)
clarityUtils.consent(true); // or false

// Upgrade session for priority recording
clarityUtils.upgrade('critical-user-journey');
```

### Integration Examples

**In a login component:**
```typescript
const handleLogin = async (userId: string) => {
  // ... login logic
  clarityUtils.identify(userId, undefined, undefined, 'Authenticated User');
  clarityUtils.setTag('userStatus', 'authenticated');
};
```

**In an e-commerce flow:**
```typescript
const handlePurchase = () => {
  clarityUtils.event('purchase-completed');
  clarityUtils.upgrade('purchase-flow');
};
```

**For A/B testing:**
```typescript
const experimentVariant = getExperimentVariant();
clarityUtils.setTag('experiment', experimentVariant);
```

## Privacy and Compliance

- Clarity automatically hashes user identifiers before sending to Microsoft servers
- For GDPR/CCPA compliance, use the `clarityUtils.consent()` function
- Configure cookie consent in your Clarity project settings if required
- Review Microsoft's [Privacy Policy](https://privacy.microsoft.com/en-us/privacystatement) and [Legal Terms](https://www.microsoft.com/en-us/legal/terms-of-use)

## Features Available

- **Session Recordings**: Watch how users interact with your site
- **Heatmaps**: See where users click, scroll, and spend time
- **Insights**: Get automatic insights about user behavior
- **Clarity Copilot**: AI-powered analysis and recommendations

## Troubleshooting

1. **Clarity not initializing**: Check that `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set correctly
2. **No data in dashboard**: Ensure your project ID is correct and wait a few minutes for data to appear
3. **Console errors**: Verify the Clarity package is installed correctly: `pnpm list @microsoft/clarity`

## Documentation

- [Clarity Documentation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api)
- [Clarity NPM Package](https://www.npmjs.com/package/@microsoft/clarity)
- [Clarity Support](mailto:clarityms@microsoft.com)

## Files Modified

- `package.json` - Added @microsoft/clarity dependency
- `frontend/.env.example` - Added Clarity project ID placeholder
- `frontend/src/components/analytics/Clarity.tsx` - Clarity provider component
- `frontend/src/app/layout.tsx` - Integrated Clarity provider
- `CLARITY_SETUP.md` - This documentation file

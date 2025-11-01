# SSO (Single Sign-On) Implementation Guide

## Current Status: ❌ NOT IMPLEMENTED

Your portfolio website currently does not have SSO functionality. This guide outlines what you need to implement SSO.

## What is SSO?

Single Sign-On (SSO) allows users to authenticate once and access multiple applications without re-entering credentials. Common SSO providers include:
- Google OAuth 2.0
- Microsoft Azure AD
- GitHub OAuth
- Facebook Login
- LinkedIn OAuth

## Why You Might Need SSO

SSO is typically needed for:
1. **Admin Panel Access** - Secure authentication for admin dashboard
2. **User Accounts** - If you plan to add user registration/login
3. **Protected Content** - Gated content requiring authentication
4. **Comments/Testimonials** - Verified user submissions

## Current Authentication

Your site currently has:
- ✅ Basic admin authentication (`src/auth/AdminAuth.php`)
- ✅ reCAPTCHA for form spam protection
- ❌ No OAuth/SSO implementation
- ❌ No social login buttons
- ❌ No user session management

## Implementation Options

### Option 1: Google OAuth 2.0 (Recommended)

**Best for**: Admin panel access, professional portfolios

**Steps to Implement**:

1. **Set up Google Cloud Console**
   ```
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - https://brahim-elhouss.me/auth/google/callback
     - https://brahim-crafts.tech/auth/google/callback
   ```

2. **Install Dependencies**
   ```bash
   composer require league/oauth2-google
   ```

3. **Create OAuth Handler** (see code below)

4. **Add Login Button to Admin**
   ```html
   <a href="/auth/google" class="btn btn-google">
     <i class="fab fa-google"></i> Sign in with Google
   </a>
   ```

### Option 2: GitHub OAuth

**Best for**: Developer portfolios, tech-focused sites

**Steps**:
1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Register new application
3. Get Client ID and Secret
4. Implement similar to Google OAuth

### Option 3: Multi-Provider SSO

Use a service like Auth0 or Firebase Authentication for multiple providers.

## Sample Implementation

### 1. Create OAuth Configuration

```php
// src/config/oauth.php
<?php
return [
    'google' => [
        'client_id' => getenv('GOOGLE_CLIENT_ID'),
        'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => 'https://brahim-elhouss.me/auth/google/callback',
        'scopes' => ['email', 'profile']
    ],
    'github' => [
        'client_id' => getenv('GITHUB_CLIENT_ID'),
        'client_secret' => getenv('GITHUB_CLIENT_SECRET'),
        'redirect_uri' => 'https://brahim-elhouss.me/auth/github/callback',
        'scopes' => ['user:email']
    ]
];
```

### 2. Create OAuth Controller

```php
// src/auth/OAuthController.php
<?php
namespace Portfolio\Auth;

use League\OAuth2\Client\Provider\Google;

class OAuthController {
    private $provider;
    
    public function __construct() {
        $config = require __DIR__ . '/../config/oauth.php';
        
        $this->provider = new Google([
            'clientId'     => $config['google']['client_id'],
            'clientSecret' => $config['google']['client_secret'],
            'redirectUri'  => $config['google']['redirect_uri'],
        ]);
    }
    
    public function redirectToProvider() {
        $authUrl = $this->provider->getAuthorizationUrl();
        $_SESSION['oauth2state'] = $this->provider->getState();
        header('Location: ' . $authUrl);
        exit;
    }
    
    public function handleCallback() {
        // Verify state
        if (empty($_GET['state']) || ($_GET['state'] !== $_SESSION['oauth2state'])) {
            unset($_SESSION['oauth2state']);
            throw new \Exception('Invalid state');
        }
        
        // Get access token
        $token = $this->provider->getAccessToken('authorization_code', [
            'code' => $_GET['code']
        ]);
        
        // Get user details
        $user = $this->provider->getResourceOwner($token);
        
        // Store user session
        $_SESSION['user'] = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'avatar' => $user->getAvatar()
        ];
        
        // Redirect to dashboard
        header('Location: /admin/dashboard.php');
        exit;
    }
}
```

### 3. Create Routes

```php
// auth-routes.php
<?php
session_start();
require_once __DIR__ . '/vendor/autoload.php';

use Portfolio\Auth\OAuthController;

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$oauth = new OAuthController();

switch($path) {
    case '/auth/google':
        $oauth->redirectToProvider();
        break;
        
    case '/auth/google/callback':
        $oauth->handleCallback();
        break;
        
    case '/auth/logout':
        session_destroy();
        header('Location: /');
        break;
}
```

### 4. Update Admin Pages

```php
// admin/dashboard.php
<?php
session_start();

// Check if user is authenticated
if (!isset($_SESSION['user'])) {
    header('Location: /admin/login.php');
    exit;
}

$user = $_SESSION['user'];
?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
</head>
<body>
    <h1>Welcome, <?= htmlspecialchars($user['name']) ?></h1>
    <img src="<?= htmlspecialchars($user['avatar']) ?>" alt="Profile">
    <p>Email: <?= htmlspecialchars($user['email']) ?></p>
    <a href="/auth/logout">Logout</a>
</body>
</html>
```

## Security Considerations

1. **HTTPS Only** ✅ (Already configured)
2. **State Parameter** - Prevents CSRF attacks
3. **Secure Sessions** - Use secure session settings
4. **Token Storage** - Store tokens securely
5. **Scope Limitation** - Only request necessary permissions

## Environment Variables

Add to `.env` or production environment:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Testing

1. **Local Development**: Use http://localhost redirect URI for testing
2. **Staging**: Test on staging environment first
3. **Production**: Verify all redirect URIs are registered

## For Google Search Console

You DO NOT need SSO for Google Search Console. You only need:
1. ✅ Add property in Search Console (https://search.google.com/search-console)
2. ✅ Verify ownership via meta tag (already prepared in your HTML)
3. ✅ Submit sitemap.xml (already created)

## Next Steps

1. Decide if you need SSO (likely only for admin panel)
2. Choose provider(s)
3. Set up OAuth credentials
4. Implement authentication flow
5. Test thoroughly
6. Deploy

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OAuth 2.0 PHP League](https://oauth2-client.thephpleague.com/)
- [Auth0 Documentation](https://auth0.com/docs)

---

**Note**: For a portfolio website, SSO is optional unless you need:
- Secure admin access with Google/GitHub account
- User registration/login features
- Protected content areas
- Community features requiring authentication

# SupportMail Dashboard

This is a simple dashboard to manage SupportMail.

# Auth flow

## Login

1. User clicks on the "Login with Discord" button.
2. User is redirected to Discord's OAuth2 authorization page.
3. User authorizes the application.
4. Discord redirects back to the callback route with an authorization code.
5. The application exchanges the authorization code for an access token.
6. The application uses the access token to fetch user information from Discord's API.
7. The application stores the user information in the database.
8. The application creates a session cookie (JWT) with an expiration time (usually the time the access token is valid).
9. The user is redirected to the dashboard page, where they can see their information and manage their support tickets.

## Authorization

1. User GETs any route that is not in the list of public routes.
2. The application checks if the user has a session cookie (JWT). (if not, redirect to login)
3. The application checks if the session cookie is valid (not expired).
4. The application checks if the user exists in the database.
5. If the user exists and still has the tokens, return them.
6. Fetch user data from Discord // Get from cache if available.
7. Continue to the requested route.

### Check if user has guild access

_Everything from above has to be satisfied before this can happen!_

1. Find user guilds (cache or fetch from Discord)
1. Check if requested guild is in the list of cached guilds.
1. If it is not in the list, return a 404 Not Found.
1. Check for at least manager permissions for that guild.
1. If the user does not have manager permissions, return a 403 Forbidden error.
1. Continue to the requested route.

## Logout

1. User GETs the logout route.
2. The application gets and deletes the tokens from the database (if found).
3. The application revokes the access token (if found) and the refresh token (if found).
4. The application deletes the session cookie (JWT).
5. The user is redirected to the login page.

# Notes

## Component limits

- **custom_id**: 100
- **id**: 0 <= 2_147_483_647
- **ActionRow**
  - children: 5
- **Button**
  - label: 80
- **Container**
  - children: 10
- **MediaGallery**
  - items: 10
- **MediaGalleryItem**
  - description: 256
- **Select**
  - placeholder: 150
  - min_values: 0 <= len(options) <= 25
  - max_values: 1 <= len(options) <= 25
  - default_values: min_values <= max_values
  - options: 25
    - label: 100
    - value: 100
    - description: 100
- **Section**
  - accessory: 1
  - children: 3
- **TextInput**: 5
  - label: 45
  - placeholder: 100
  - min_length: 0 <= 4000
  - max_length: 1 <= 4000
  - value/default: 4000
- **TextDisplay**
  - content: [accumulatively, max 4000](https://discord.com/channels/336642139381301249/1345167602304946206/1363479426779844769)
- **Thumbnail**
  - description: 256

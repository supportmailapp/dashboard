# TODO

- Build algorigthm to FKCIN SORT CHANNELS CORRECTLY

## Later

- Build navigation for dashboard (bottom nav bar)

  - features-button for mobile (sidebar dor desktop), server-changer, user-settings

- Server-changer

  - Dialog everytime when clicked, a table with all servers
  - Clicking on a server will change the server

- User-settings

  - Dialog everytime when clicked, a form with user settings
  - Change user settings

- Sidebar for desktop

  - Sidebar with all features
  - Contents: Groups (grouping features), features (buttons)

- Store channels and roles from a guild in valkey with session id as key

- Implement Valkey

## Plans

_Plan für "welcher layer und was darin für was, wann zuständig ist._

### Caching

- User Cache

  - Store user data (id -> stringified(BasicUser))

- Guilds Cache

  - Store guild data (id -> stringified(BasicGuild))
  - Store user guilds (user id -> guild ids)
  - Store guild roles (guild id : roles -> stringified(BasicRole)[])
  - Store guild channels (guild id : channels -> stringified(BasicChannel)[])

### API

Auth? -> JWT (in der hook)

- Fetch user data (user id -> user)

  - returns: Parsed user data (BasicUser)
  - checks cache first
  - if not found, fetch from API (...?)
  - update the user in the cache
  - return user

- Fetch user guilds (user id -> guilds)

  - returns: Parsed guild data (BasicGuild[]) where the user can manage the bot
  - checks cache first
  - if not found, fetch from API (current user guilds)
  - update the guilds in the cache
  - filter to configured guilds with help from DB
  - parse to basic guilds
  - pack them into the cache
  - filter the guilds where the user can manage the bot
  - return newly guilds

- Fetch guild data (guild id -> guild, channels, roles)

  - returns: Parsed guild data ({ guild, channels, roles })
  - check cache first
  - if all exist, return them
  - if cached guild not exists, fetch guild from API
  - if cached channels not exists, fetch channels from API
  - if cached roles not exists, fetch roles from API
  - parse data to basic stuff
  - update the cache with parsed data
  - return parsed data

### Flow of the app

1. Hook

- check token
- check cache for user data, if not found, fetch user data and set it as locale
- if API route, resolve early
- get user guilds from cache or leave them empty
- resolve

2. Layouts

#### Root layout

> Server

- if user not given, return {}
- if locals.guilds not given, return a streaming promise (loadGuilds() = API wrapper), else return a promise with locals.guilds
  -# Don't forget ccDate

> Client

_Is this even needed?_

#### Guild Layout

> Server

- filter guild from locals.guilds
- if not found throw error(404)
- return a streaming promise (loadChannels(), loadRoles() = API wrappers)

> Client

_Is this even needed?_

<!--

### 1. Caching

#### User Cache
- Implement the user cache to store user data.
- This is already partially implemented in `users.ts`.

#### Guilds Cache
- Implement the guilds cache to store guild data, user guilds, guild roles, and guild channels.
- This is already partially implemented in `guilds.ts`.

### 2. API

#### Fetch User Data
- Implement a function to fetch user data, checking the cache first.
- This is already partially implemented in `oauth2.ts`.

#### Fetch User Guilds
- Implement a function to fetch user guilds, checking the cache first.
- This is already partially implemented in `oauth2.ts`.

#### Fetch Guild Data
- Implement a function to fetch guild data (guild, channels, roles), checking the cache first.
- This can be implemented in `utils.ts`.

### 3. Flow of the App

#### Hook
- Implement the hook to check the token, fetch user data, and set it as a locale.
- This is already partially implemented in `hooks.server.ts`.

#### Root Layout
- Implement the root layout to handle user and guild data.
- This is already partially implemented in `+layout.server.ts` and `+layout.ts`.

#### Guild Layout
- Implement the guild layout to handle guild data, channels, and roles.
- This is already partially implemented in (src/routes/[slug]/+layout.server.ts) and (src/routes/[slug]/+layout.ts).

### Next Steps
1. **Complete the caching logic** in guilds.ts and users.ts.

2. **Ensure the API functions** in oauth2.ts and utils.ts are fully implemented and tested.
3. **Finalize the hook logic** in hooks.server.ts to handle user and guild data.
4. **Complete the layout logics**.


 -->

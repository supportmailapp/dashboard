# TODO

- Sidebar for desktop

  - Sidebar with all features
  - Contents: Groups (grouping features), features (buttons)

- User-settings

  - Dialog everytime when clicked, a form with user settings
  - Change user settings

- Server-changer

  - Dialog everytime when clicked, a table with all servers
  - Clicking on a server will change the server

## Later

- Build algorigthm to FKCIN SORT CHANNELS CORRECTLY

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

export const apps = [
  {
    name: "sm-dashboard",
    interpreter_args: "--env-file=.env.production",
    script: "build/index.js", // The built SvelteKit server
    interpreter: "node",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env_file: ".env.production", // Your production env file
    env: {
      NODE_ENV: "production",
      PORT: 5050,
    },
  },
];

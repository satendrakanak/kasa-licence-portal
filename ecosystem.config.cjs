module.exports = {
  apps: [
    {
      name: "kasa-licence-portal",
      script: "npm",
      args: "run start",
      cwd: "/opt/kasa/kasa-licence-portal",
      env: {
        NODE_ENV: "production",
        PORT: "5000",
      },
      max_memory_restart: "512M",
    },
  ],
};

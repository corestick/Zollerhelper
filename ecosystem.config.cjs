module.exports = {
  apps: [
    {
      name: "zoller_helper",
      script: "index.cjs",
      watch: true,
      cwd: "./",
      //instances: 2,
      //max_memory_restart: "300M",
      //exec_mode: "cluster_mode",
      ignore_watch: [
        "node_modules",
        "package.json",
        "pnpm-lock.yaml",
        "src",
      ],
    },
  ],
};

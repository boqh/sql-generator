import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path"; // 修改这里
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), // 使用 resolve 而不是 path.resolve
    },
  },
  server: {
    port: 8089,
    host: true,
    open: true,
    hmr: true,
    proxy: {
      "/api": {
        target: "http://localhost:8099",
        changeOrigin: true,
        // rewrite: (path) => path, //  关键： 使用 rewrite 选项，返回原始路径 path，不进行任何修改
        rewrite: (path) => path.replace(/^\/api/, ''), // 移除 /api 前缀
      },
    },
  },
});

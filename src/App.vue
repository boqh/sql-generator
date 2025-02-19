<template>
  <a-layout style="min-height: 100vh">
    <!-- 侧边栏 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo" />
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        theme="dark"
        mode="inline"
      >
        <!-- SQL 生成器菜单组 -->
        <a-sub-menu key="sql">
          <template #title>
            <span>
              <code-outlined />
              <span>SQL 生成器</span>
            </span>
          </template>
          <a-menu-item key="sql-query">
            <router-link to="/sql/query">SQL 查询</router-link>
          </a-menu-item>
          <a-menu-item key="sql-generate">
            <router-link to="/sql/generate">SQL 生成</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- Fund 查询菜单组 -->
        <a-sub-menu key="fund">
          <template #title>
            <span>
              <fund-outlined />
              <span>Fund 查询</span>
            </span>
          </template>
          <a-menu-item key="fund01">
            <router-link to="/fund/fund01">Fund 01</router-link>
          </a-menu-item>
          <a-menu-item key="fund02">
            <router-link to="/fund/fund02">Fund 02</router-link>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0" />
      <a-layout-content style="margin: 0 16px">
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px' }">
          <router-view></router-view>
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        SQL Generator ©2024 Created by Your Company
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CodeOutlined, FundOutlined } from '@ant-design/icons-vue';

const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['sql-generate']);
const openKeys = ref<string[]>(['sql']);
</script>

<style>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.ant-layout-sider-children {
  display: flex;
  flex-direction: column;
}

.site-layout-background {
  background: #fff;
}
</style>
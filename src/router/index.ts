import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import SqlGenerate from '../views/sql/SqlGenerate.vue';
import SqlQuery from '../views/sql/SqlQuery.vue';
import Fund01 from '../views/fund/Fund01.vue';
import Fund02 from '../views/fund/Fund02.vue';
import dmsQuery from "@/views/dms/dmsQuery.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/sql/generate'
  },
  {
    path: '/sql/generate',
    name: 'SqlGenerate',
    component: SqlGenerate
  },
  {
    path: '/sql/query',
    name: 'SqlQuery',
    component: SqlQuery
  },
  {
    path: '/fund/fund01',
    name: 'Fund01',
    component: Fund01
  },
  {
    path: '/fund/fund02',
    name: 'Fund02',
    component: Fund02
  },
  {
    path: '/dms/dmsQuery',
    name: 'dmsQuery',
    component: dmsQuery
  }

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
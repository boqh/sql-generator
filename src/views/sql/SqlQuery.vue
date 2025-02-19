<template>
  <div class="sql-query">
    <div class="header">
      <h2>SQL 查询</h2>
      <div class="search-bar">
        <a-input-search
          v-model:value="searchKeyword"
          placeholder="输入 SQL 名称搜索"
          style="width: 300px"
          allow-clear
          enter-button
          @search="handleSearch"
        />
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="sqlList"
      :loading="loading"
      :pagination="pagination"
      row-key="ID"
      :scroll="{ x: 1200 }"
      @change="handleTableChange"
    >
      <!-- SQL 名称列 -->
      <template #sql_name="{ text }">
        <a-tooltip :title="text">
          {{ text }}
        </a-tooltip>
      </template>

      <!-- 描述列 -->
      <template #Description="{ text }">
        <a-tooltip :title="text">
          {{
            text?.length > 30 ? text.slice(0, 30) + "..." : text || "暂无描述"
          }}
        </a-tooltip>
      </template>

      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button type="link" @click="viewSQL(record)">
            <template #icon><eye-outlined /></template>
            查看
          </a-button>
          <a-button type="link" @click="editSQL(record)">
            <template #icon><edit-outlined /></template>
            编辑
          </a-button>
          <a-popconfirm
            title="确定要删除这条 SQL 吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteSQL(record)"
          >
            <a-button type="link" danger>
              <template #icon><delete-outlined /></template>
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <!-- SQL 详情对话框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      :title="modalTitle"
      :width="800"
      :footer="null"
      :mask-closable="false"
    >
      <div class="sql-detail">
        <div class="detail-item">
          <div class="item-label">SQL 名称：</div>
          <div class="item-content">{{ currentSQL?.sql_name }}</div>
        </div>
        <div class="detail-item">
          <div class="item-label">描述：</div>
          <div class="item-content">
            {{ currentSQL?.description || "暂无描述" }}
          </div>
        </div>
        <div class="detail-item">
          <div class="item-label">创建时间：</div>
          <div class="item-content">
            {{ formatDate(currentSQL?.CreatedAt) }}
          </div>
        </div>
        <div class="detail-item">
          <div class="item-label">更新时间：</div>
          <div class="item-content">
            {{ formatDate(currentSQL?.UpdatedAt) }}
          </div>
        </div>
        <div class="editor-container">
          <div class="panel-header">
            <span>SQL 参数</span>
            <a-tooltip title="复制">
              <copy-outlined class="action-icon" @click="copyParameters" />
            </a-tooltip>
          </div>
          <MonacoEditor
            v-if="currentSQL"
            v-model:value="formattedParameters"
            language="json"
            :style="{ height: '400px' }"
            theme="vs-dark"
            :options="{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
            }"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "ant-design-vue";
import type { TablePaginationConfig } from "ant-design-vue";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { getSQLList, deleteSQL as deleteSQLApi, searchSQL } from "@/api/sql";
import type { SqlRecord } from "@/api/sql";
import MonacoEditor from "@/components/MonacoEditor.vue";

// 表格列定义
const columns = [
  {
    title: "SQL 名称",
    dataIndex: "sql_name",
    key: "sql_name",
    slots: { customRender: "sql_name" },
    width: 200,
  },
  {
    title: "描述",
    dataIndex: "description",
    key: "description",
    slots: { customRender: "description" },
    ellipsis: true,
    width: 300,
  },
  {
    title: "创建时间",
    dataIndex: "CreatedAt",
    key: "CreatedAt",
    width: 180,
    sorter: true,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: "更新时间",
    dataIndex: "UpdatedAt",
    key: "UpdatedAt",
    width: 180,
    sorter: true,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
    width: 200,
    fixed: "right",
  },
];

// 状态定义
const router = useRouter();
const loading = ref(false);
const sqlList = ref<SqlRecord[]>([]);
const searchKeyword = ref("");
const detailModalVisible = ref(false);
const currentSQL = ref<SqlRecord | null>(null);
const modalTitle = ref("SQL 详情");

// 格式化的 JSON 参数
const formattedParameters = computed(() => {
  if (!currentSQL.value?.sql_parameters) return "";
  try {
    const parsed = JSON.parse(currentSQL.value.sql_parameters);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return currentSQL.value.sql_parameters;
  }
});

const pagination = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
});

// 初始化加载数据
onMounted(() => {
  loadData();
});

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    let response;
    if (searchKeyword.value) {
      response = await searchSQL(searchKeyword.value);
    } else {
      response = await getSQLList();
    }

    if (response.data.code === 200) {
      sqlList.value = response.data.data.filter((item) => item.sql_name);
      pagination.value.total = sqlList.value.length;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    message.error("加载数据失败：" + (error as Error).message);
  } finally {
    loading.value = false;
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadData();
};

// 处理表格变化
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.value.current = pag.current || 1;
  pagination.value.pageSize = pag.pageSize || 10;
  loadData();
};

// 查看 SQL
const viewSQL = (record: SqlRecord) => {
  currentSQL.value = record;
  modalTitle.value = "SQL 详情";
  detailModalVisible.value = true;
};

// 编辑 SQL
const editSQL = (record: SqlRecord) => {
  router.push({
    name: "SqlGenerate",
    query: {
      id: record.ID.toString(),
      name: record.sql_name,
      description: record.description,
    },
  });
};

// 删除 SQL
const deleteSQL = async (record: SqlRecord) => {
  try {
    const response = await deleteSQLApi(record.ID);
    if (response.data.code === 200) {
      message.success("删除成功");
      loadData();
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    message.error("删除失败：" + (error as Error).message);
  }
};

// 复制参数
const copyParameters = async () => {
  if (!currentSQL.value?.sql_parameters) return;
  try {
    await navigator.clipboard.writeText(currentSQL.value.sql_parameters);
    message.success("参数已复制到剪贴板");
  } catch (error) {
    message.error("复制失败");
  }
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
</script>

<style scoped>
.sql-query {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sql-detail {
  padding: 0 20px;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
}

.item-label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  word-break: break-all;
}

.editor-container {
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  color: #fff;
}

.action-icon {
  cursor: pointer;
  color: #fff;
  font-size: 16px;
  transition: color 0.3s;
}

.action-icon:hover {
  color: #1890ff;
}

:deep(.ant-table-pagination) {
  margin: 16px 0;
}
</style>

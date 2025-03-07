<template>
  <div class="sql-executor-container">
    <div class="input-section">
      <div class="database-selection-container">
        <div class="input-item">
          <label for="databaseSelect">选择数据库:</label>
          <a-select id="databaseSelect" v-model:value="selectedDatabase">
            <a-select-option value="ach_pay">ach_pay</a-select-option>
            <a-select-option value="card_pay_center">card_pay_center</a-select-option>
            <a-select-option value="virtual_card">virtual_card</a-select-option>
            <a-select-option value="virtual_card_api">virtual_card_api</a-select-option>
            <a-select-option value="crypto_payment">crypto_payment</a-select-option>
          </a-select>
        </div>
      </div>

      <div class="search-fields">
        <div class="input-item">
          <label>App ID:</label>
          <a-input v-model:value="searchParams.appId" placeholder="请输入 App ID" />
        </div>
        <div class="input-item">
          <label>Name:</label>
          <a-input v-model:value="searchParams.merchantName" placeholder="请输入 Name" />
        </div>
        <div class="input-item">
          <label>Merchant ID:</label>
          <a-input v-model:value="searchParams.merchantNo" placeholder="请输入 Merchant ID" />
        </div>
        <div class="input-item">
          <label>Email:</label>
          <a-input v-model:value="searchParams.email" placeholder="请输入 Email" />
        </div>
        <div class="input-item">
          <label>Card No:</label>
          <a-input v-model:value="searchParams.cardNo" placeholder="请输入 Card No" />
        </div>
      </div>

      <div class="button-group">
        <a-button type="primary" @click="search">搜索</a-button>
        <a-button type="primary" @click="sendSQL">执行SQL</a-button>
      </div>
    </div>

    <div class="sql-section">
      <label for="sqlInput">SQL Query:</label>
      <a-textarea id="sqlInput" v-model:value="sqlQuery" rows="5" />
    </div>

    <h2>Result:</h2>
    <div class="output-area">
      <a-table
          :columns="tableColumns"
          :data-source="sqlResultData"
          bordered
          :pagination="false"
          size="small"
      >
        <template #bodyCell="{ column, text }">
          <a-tooltip :title="text" placement="topLeft">
            <span class="table-cell-content">{{ truncateText(text, 50) }}</span>
          </a-tooltip>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';

const selectedDatabase = ref('ach_pay');
const sqlQuery = ref('');
const sqlResultData = ref([]);
const loading = ref(false);
const searchParams = ref({
  appId: '',
  merchantName: '',
  merchantNo: '',
  email: '',
  cardNo: ''
});

// const tableColumns = computed(() => {
//   if (sqlResultData.value.length > 0) {
//     const firstRow = sqlResultData.value[0];
//     return Object.keys(firstRow).map(key => ({
//       title: key,
//       dataIndex: key,
//       key: key,
//       ellipsis: false,
//       width: 'auto',
//     }));
//   }
//   return [];
// });

const tableColumns = computed(() => {
  if (sqlResultData.value.length > 0) {
    const firstRow = sqlResultData.value[0];
    return Object.keys(firstRow).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true, // 启用 Ant Design 的内置 ellipsis
      width: Math.min(200, Math.max(100, key.length * 15)), // 动态计算宽度
    }));
  }
  return [];
});

const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return text;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const sendSQL = async () => {
  if (!sqlQuery.value) {
    message.warning('请输入 SQL 查询语句');
    return;
  }

  loading.value = true;
  try {
    const requestBody = {
      database: selectedDatabase.value,
      sql: sqlQuery.value,
    };

    const response = await fetch('/api/dms/execute-sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    displaySQLResult(data);
    message.success('SQL 执行成功');
  } catch (error: any) {
    console.error('Error:', error);
    message.error('SQL 执行失败: ' + error.message);
    sqlResultData.value = [];
  } finally {
    loading.value = false;
  }
};

const search = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/dms/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: selectedDatabase.value,
        ...searchParams.value
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    displaySQLResult(data);
    message.success('搜索成功');
  } catch (error: any) {
    console.error('Error:', error);
    message.error('搜索失败: ' + error.message);
    sqlResultData.value = [];
  } finally {
    loading.value = false;
  }
};

const displaySQLResult = (data) => {
  const resultData = data.sqlResultData || [];
  sqlResultData.value = resultData.length ? resultData : [];
  nextTick(() => console.log('Table updated:', sqlResultData.value));
};
</script>

<style scoped>
.sql-executor-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.input-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sql-section {
  margin: 20px 0;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

label {
  font-weight: 500;
  color: #515a6e;
  font-size: 14px;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  border-radius: 6px;
  border: 1px solid #d9e0e7;
  padding: 8px 12px;
  transition: all 0.3s;
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover) {
  border-color: #40c9c6;
  box-shadow: 0 0 0 2px rgba(64, 201, 198, 0.2);
}

:deep(.ant-btn-primary) {
  border-radius: 6px;
  padding: 6px 24px;
  background: linear-gradient(45deg, #40c9c6, #3ec7e8);
  border: none;
  height: 38px;
}

:deep(.ant-btn-primary:hover) {
  background: linear-gradient(45deg, #36b1ae, #34b0d1);
  transform: translateY(-2px);
}

:deep(.ant-textarea) {
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #d9e0e7;
}

:deep(.ant-table-cell) {
  max-width: 200px; /* 设置最大宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.output-area {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

h2 {
  color: #2c3e50;
  font-weight: 600;
  margin: 24px 0 16px;
}

@media (max-width: 768px) {
  .search-fields {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
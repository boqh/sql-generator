<template>
  <div class="sql-executor-container">
    <div class="input-section">
      <div class="database-selection-container">
        <div class="input-item">
          <label for="databaseSelect">选择数据库:</label>
          <a-select id="databaseSelect" v-model:value="selectedDatabase">
            <a-select-option value="ach_pay">ach_pay</a-select-option>
            <a-select-option value="ach_pay_sbx">ach_pay_sbx</a-select-option>
            <a-select-option value="crypto_payment_sbx">crypto_payment_sbx</a-select-option>
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
          <a-input v-model:value="trimmedAppId" placeholder="请输入 App ID" />
        </div>
        <div class="input-item">
          <label>Name:</label>
          <a-input v-model:value="trimmedMerchantName" placeholder="请输入 Name" />
        </div>
        <div class="input-item">
          <label>Merchant ID:</label>
          <a-input v-model:value="trimmedMerchantNo" placeholder="请输入 Merchant ID" />
        </div>
        <div class="input-item">
          <label>Email:</label>
          <a-input v-model:value="trimmedEmail" placeholder="请输入 Email" />
        </div>
        <div class="input-item">
          <label>Card No:</label>
          <a-input v-model:value="trimmedCardNo" placeholder="请输入 Card No" />
        </div>
      </div>

      <div class="button-group">
        <a-button type="primary" @click="search">搜索</a-button>
        <a-button type="primary" @click="sendSQL">执行SQL</a-button>
      </div>
    </div>

    <div class="sql-section">
      <div class="sql-header">
        <label for="sqlInput">SQL Query:</label>
        <a-button class="format-btn" @click="toggleFormat">
          {{ showFormatted ? '显示单行' : '格式化显示' }}
        </a-button>
      </div>
      <a-textarea
          id="sqlInput"
          :value="displaySqlQuery"
          @input="updateSqlQuery($event.target.value)"
          rows="5"
          :class="{ 'formatted-sql': showFormatted }"
      />
    </div>

    <h2>执行结果:</h2>
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
import { format } from 'sql-formatter';

const selectedDatabase = ref('ach_pay');
const rawSqlQuery = ref(''); // 存储原始单行SQL
const sqlResultData = ref([]);
const loading = ref(false);
const showFormatted = ref(false); // 控制显示格式化还是单行
const rawSearchParams = ref({
  appId: '',
  merchantName: '',
  merchantNo: '',
  email: '',
  cardNo: ''
});

// 自定义SQL格式化函数，不为表别名添加反引号
const formatSQL = (sql: string) => {
  let formatted = format(sql, {
    language: 'sql',
    indent: '  ',
    uppercase: true,
  });

  // 移除字段名周围的多余空格，但保留表别名不加反引号
  formatted = formatted
      .replace(/`\s+([a-zA-Z0-9_]+)\s+`/g, '`$1`') // 字段名保留反引号并移除多余空格
      .replace(/`\s+([a-zA-Z0-9_]+)\s+`\.\s+`\s+([a-zA-Z0-9_]+)\s+`/g, '`$1`.$2'); // 表名用反引号，别名不用

  return formatted;
};

// 计算属性：显示用的SQL（格式化或单行）
const displaySqlQuery = computed(() => {
  if (showFormatted.value && rawSqlQuery.value) {
    try {
      return formatSQL(rawSqlQuery.value);
    } catch (error) {
      return rawSqlQuery.value;
    }
  }
  return rawSqlQuery.value;
});

// 更新原始SQL的方法
const updateSqlQuery = (value: string) => {
  rawSqlQuery.value = value.replace(/\s+/g, ' ').trim();
};

// 计算属性：用于发送给后端的单行SQL，去除不必要空格，表别名不加反引号
const trimmedSqlQuery = computed(() => {
  return rawSqlQuery.value
      .replace(/\s+/g, ' ') // 多个空格转为单个空格
      .replace(/\s*([(),])\s*/g, '$1') // 移除括号周围的空格
      .replace(/`\s*([a-zA-Z0-9_]+)\s*`\.\s*`\s*([a-zA-Z0-9_]+)\s*`/g, '`$1`.$2') // 表名加反引号，别名不加
      .replace(/\s*`\s*([a-zA-Z0-9_]+)\s*`/g, '`$1`') // 字段名规范化
      .trim();
});

// Search params computed properties
const trimmedAppId = computed({
  get: () => rawSearchParams.value.appId,
  set: (val) => { rawSearchParams.value.appId = val ? val.replace(/\s+/g, '').trim() : ''; }
});

const trimmedMerchantName = computed({
  get: () => rawSearchParams.value.merchantName,
  set: (val) => { rawSearchParams.value.merchantName = val ? val.replace(/\s+/g, ' ').trim() : ''; }
});

const trimmedMerchantNo = computed({
  get: () => rawSearchParams.value.merchantNo,
  set: (val) => { rawSearchParams.value.merchantNo = val ? val.replace(/\s+/g, '').trim() : ''; }
});

const trimmedEmail = computed({
  get: () => rawSearchParams.value.email,
  set: (val) => { rawSearchParams.value.email = val ? val.replace(/\s+/g, ' ').trim() : ''; }
});

const trimmedCardNo = computed({
  get: () => rawSearchParams.value.cardNo,
  set: (val) => { rawSearchParams.value.cardNo = val ? val.replace(/\s+/g, '').trim() : ''; }
});

const tableColumns = computed(() => {
  if (sqlResultData.value.length > 0) {
    const firstRow = sqlResultData.value[0];
    return Object.keys(firstRow).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: Math.min(200, Math.max(100, key.length * 15)),
    }));
  }
  return [];
});

const truncateText = (text, maxLength = 50) => {
  if (typeof text !== 'string') return text;
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// 切换格式化显示
const toggleFormat = () => {
  if (!rawSqlQuery.value) {
    message.warning('请输入 SQL 查询语句');
    return;
  }
  showFormatted.value = !showFormatted.value;
};

const sendSQL = async () => {
  if (!trimmedSqlQuery.value) {
    message.warning('请输入 SQL 查询语句');
    return;
  }

  loading.value = true;
  try {
    const requestBody = {
      database: selectedDatabase.value,
      sql: trimmedSqlQuery.value, // 使用单行SQL发送给后端
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
        appId: trimmedAppId.value,
        merchantName: trimmedMerchantName.value,
        merchantNo: trimmedMerchantNo.value,
        email: trimmedEmail.value,
        cardNo: trimmedCardNo.value,
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
  max-width: 1280px;
  margin: 30px auto;
  padding: 30px;
  background: linear-gradient(145deg, #f8fafc 0%, #eef2f6 100%);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.input-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.input-section:hover {
  transform: translateY(-2px);
}

.search-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sql-section {
  margin: 30px 0;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.sql-section:hover {
  transform: translateY(-2px);
}

.sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.button-group {
  margin-top: 24px;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

label {
  font-weight: 600;
  color: #2d3748;
  font-size: 15px;
  letter-spacing: 0.5px;
}

:deep(.ant-input),
:deep(.ant-select-selector) {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 10px 14px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.ant-input:hover),
:deep(.ant-select-selector:hover) {
  border-color: #63b3ed;
  box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
}

:deep(.ant-btn-primary) {
  border-radius: 8px;
  padding: 8px 28px;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border: none;
  height: 40px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
  transition: all 0.3s ease;
}

:deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #5aabeb 0%, #4a90d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.4);
}

.format-btn {
  border-radius: 8px;
  padding: 6px 20px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  height: 36px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
  transition: all 0.3s ease;
}

.format-btn:hover {
  background: linear-gradient(135deg, #5cd38c 0%, #4db680 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
}

:deep(.ant-textarea) {
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.ant-textarea:hover) {
  border-color: #63b3ed;
}

.formatted-sql {
  background: #f7fafc;
  color: #2d3748;
}

:deep(.ant-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #2d3748;
  font-weight: 600;
}

.output-area {
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.output-area:hover {
  transform: translateY(-2px);
}

h2 {
  color: #2d3748;
  font-weight: 700;
  margin: 30px 0 20px;
  font-size: 24px;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .search-fields {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
    gap: 12px;
  }

  .sql-executor-container {
    margin: 20px;
    padding: 20px;
  }
}
</style>